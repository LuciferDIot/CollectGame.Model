#!/usr/bin/env python3
import argparse, csv, json, os, sys, time, uuid
from datetime import datetime, timezone
try:
    import urllib.request as urllib_request
    import urllib.error as urllib_error
except ImportError:
    print("ERROR: urllib not available.")
    sys.exit(1)

# /api/pipeline/adapt validates { userId, telemetry: {...} } -- see
# app/api/pipeline/adapt/route.ts. userId is generated once per probe run
# (not per request) so the continuity probe exercises one simulated
# player's session across the full run, rather than looking like a fresh
# user on every call regardless of whether the instance survived a cold start.
_PROBE_USER_ID = f"aura-probe-{uuid.uuid4()}"
_SAMPLE_TELEMETRY = {
    "enemiesHit": 5, "damageDone": 800, "timeInCombat": 15, "kills": 2,
    "itemsCollected": 3, "pickupAttempts": 4, "timeNearInteractables": 6,
    "distanceTraveled": 500, "timeSprinting": 8, "timeOutOfCombat": 15, "deathCount": 0,
}

def _make_payload():
    payload = {"userId": _PROBE_USER_ID, "telemetry": dict(_SAMPLE_TELEMETRY)}
    return json.dumps(payload).encode("utf-8")

# With a constant telemetry payload sent repeatedly for one persistent
# userId, the session manager's delta should decay toward ~0 and
# target_multiplier should settle onto a flat plateau within a few calls
# (EMA alpha=0.3). A sudden jump back toward the call-1 magnitude mid-run
# means globalThis._anfisAdaptPipeline got recycled (cold start) and the
# session state was lost -- that's the signal this probe exists to catch,
# so the fields below are pulled out of the response body rather than left
# buried in a truncated preview.
_RESULT_FIELDS = [
    "timestamp", "latency_ms", "server_pipeline_ms", "status_code", "error", "body_preview",
    "target_multiplier", "multiplier_clamped",
    "delta_combat", "delta_collect", "delta_explore",
    "soft_combat", "soft_collect", "soft_explore",
]

def _probe_once(url, timeout=10):
    data = _make_payload()
    req = urllib_request.Request(url, data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "aura-probe/1.0"},
        method="POST")
    t0 = time.perf_counter()
    ts = datetime.now(timezone.utc).isoformat()
    status_code = None; error = ""; body_preview = ""
    result = {k: "" for k in _RESULT_FIELDS}
    try:
        with urllib_request.urlopen(req, timeout=timeout) as resp:
            status_code = resp.status
            raw_body = resp.read()
            body_preview = raw_body.decode("utf-8", errors="replace")[:120]
            try:
                parsed = json.loads(raw_body)
                result["server_pipeline_ms"] = parsed.get("performance_timings", {}).get("total", "")
                result["target_multiplier"] = parsed.get("target_multiplier", "")
                result["multiplier_clamped"] = parsed.get("validation", {}).get("multiplier_clamped", "")
                deltas = parsed.get("deltas", {})
                result["delta_combat"] = deltas.get("delta_combat", "")
                result["delta_collect"] = deltas.get("delta_collect", "")
                result["delta_explore"] = deltas.get("delta_explore", "")
                soft = parsed.get("soft_membership", {})
                result["soft_combat"] = soft.get("soft_combat", "")
                result["soft_collect"] = soft.get("soft_collect", "")
                result["soft_explore"] = soft.get("soft_explore", "")
            except json.JSONDecodeError:
                pass
    except urllib_error.HTTPError as e:
        status_code = e.code; error = str(e)
        try: body_preview = e.read(512).decode("utf-8", errors="replace")[:120]
        except: pass
    except Exception as e:
        error = type(e).__name__ + ": " + str(e)
    result.update({"timestamp": ts, "latency_ms": round((time.perf_counter()-t0)*1000, 2),
                    "status_code": status_code, "error": error, "body_preview": body_preview})
    return result

_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")

def _save_csv(rows, prefix, label=None):
    os.makedirs(_OUTPUT_DIR, exist_ok=True)
    suffix = f"_{label}" if label else ""
    fname = os.path.join(_OUTPUT_DIR, f"{prefix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{suffix}.csv")
    with open(fname, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=_RESULT_FIELDS)
        w.writeheader(); w.writerows(rows)
    return fname

def _print_stats(rows):
    latencies = sorted([r["latency_ms"] for r in rows if r["error"]=="" ])
    errs = [r for r in rows if r["error"]!=""]
    print(f"\n{'='*50}\n  Total: {len(rows)}  Errors: {len(errs)}")
    if latencies:
        p = lambda pct: latencies[int(len(latencies)*pct)]
        print(f"  Min:{min(latencies):.1f}  Max:{max(latencies):.1f}  Avg:{sum(latencies)/len(latencies):.1f}  p50:{p(.5):.1f}  p90:{p(.9):.1f}  p99:{p(.99):.1f} ms")
    print(f"{'='*50}\n")

def run_latency(url, n, label=None):
    print(f"[LATENCY] {n} requests -> {url}")
    rows = []
    for i in range(1, n+1):
        r = _probe_once(url); rows.append(r)
        ef = f"  WARN: {r['error'][:60]}" if r["error"] else ""
        print(f"  [{i:>4}/{n}]  {r['latency_ms']:>8.1f} ms   HTTP {r['status_code'] or 'ERR'}{ef}")
    _print_stats(rows)
    fname = _save_csv(rows, "latency", label)
    print(f"Saved -> {os.path.abspath(fname)}\n")

def run_continuity(url, minutes, label=None):
    duration_s = minutes*60; interval_s = 30
    deadline = time.monotonic()+duration_s
    print(f"[CONTINUITY] {minutes:.0f}-min run -> {url}\n  Probe every {interval_s}s. Ctrl-C to stop.\n")
    rows = []; n = 0
    try:
        while time.monotonic() < deadline:
            n += 1; r = _probe_once(url); rows.append(r)
            rem = max(0, deadline-time.monotonic())
            ef = f"  WARN: {r['error'][:60]}" if r["error"] else ""
            print(f"  [{n:>5}]  {r['latency_ms']:>8.1f} ms   HTTP {r['status_code'] or 'ERR'}   {rem/60:.1f} min left{ef}")
            time.sleep(min(interval_s, max(0, deadline-time.monotonic())))
    except KeyboardInterrupt:
        print("\n  Stopped by user.")
    _print_stats(rows)
    fname = _save_csv(rows, "continuity", label)
    print(f"Saved -> {os.path.abspath(fname)}\n")

parser = argparse.ArgumentParser()
sub = parser.add_subparsers(dest="mode", required=True)
lat = sub.add_parser("latency"); lat.add_argument("--url", required=True); lat.add_argument("--n", type=int, default=100)
lat.add_argument("--label", default=None)
cont = sub.add_parser("continuity"); cont.add_argument("--url", required=True); cont.add_argument("--minutes", type=float, default=90)
cont.add_argument("--label", default=None)
args = parser.parse_args()
if args.mode=="latency": run_latency(args.url, args.n, args.label)
elif args.mode=="continuity": run_continuity(args.url, args.minutes, args.label)
