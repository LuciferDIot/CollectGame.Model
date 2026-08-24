#!/usr/bin/env python3
import csv, glob, os, statistics

_HERE = os.path.dirname(os.path.abspath(__file__))
_OUTPUTS_DIR = os.path.join(_HERE, "outputs")


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def inspect_file(path):
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows = list(reader)

    print(f"file: {os.path.basename(path)}")
    print(f"  row_count: {len(rows)}")
    print(f"  columns: {columns}")

    delta_combat_raw = [r.get("delta_combat", "") for r in rows]
    delta_combat = [_to_float(v) for v in delta_combat_raw]

    print(f"  delta_combat first 5 values: {delta_combat_raw[:5]}")

    zero_probe = None
    for i, v in enumerate(delta_combat, start=1):
        if v is not None and v == 0:
            zero_probe = i
            break
    if zero_probe is not None:
        print(f"  delta_combat first reaches exactly 0 at probe: {zero_probe}")
    else:
        print("  delta_combat never reaches exactly 0")

    jumps = []
    prev = None
    for i, v in enumerate(delta_combat, start=1):
        if prev is not None and v is not None and v > prev:
            jumps.append((i, prev, v))
        if v is not None:
            prev = v
    print(f"  upward jumps in delta_combat: {len(jumps)}")
    for probe_number, previous, current in jumps:
        print(f"    ({probe_number}, {previous}, {current})")

    if "server_pipeline_ms" in columns:
        spm = [_to_float(r.get("server_pipeline_ms", "")) for r in rows]
        spm = [v for v in spm if v is not None]
        if spm:
            print(
                f"  server_pipeline_ms: n={len(spm)} min={min(spm)} "
                f"median={statistics.median(spm)} max={max(spm)}"
            )
        else:
            print("  server_pipeline_ms: column present but no numeric values")
    else:
        print("  server_pipeline_ms: not recorded")

    print()


def main():
    pattern = os.path.join(_OUTPUTS_DIR, "continuity_*.csv")
    files = sorted(glob.glob(pattern))
    if not files:
        print(f"no files matching {pattern}")
        return
    for path in files:
        inspect_file(path)


if __name__ == "__main__":
    main()
