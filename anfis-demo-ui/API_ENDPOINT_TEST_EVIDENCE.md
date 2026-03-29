# API Endpoint Test Evidence — Section 8.5
**System:** AURA (Adaptive User-Responsive Architecture)
**Endpoint Under Test:** `POST /api/pipeline`
**Server:** Next.js 16 dev server (`npm run dev`) on `http://localhost:3000`
**Date:** 2026-03-22

---

## Test Environment Setup

The backend was started with:

```powershell
cd F:\Campus\FYP\Implementation\CollectGame.Model\anfis-demo-ui
npm run dev
```

All tests were executed in a second PowerShell terminal while the dev server was running.

---

## Test 1 — Valid Full Payload (Happy Path)

**Purpose:** Confirm the pipeline processes a complete telemetry payload and returns HTTP 200 with an adaptation result.

**Command:**
```powershell
$start = Get-Date
$body = '{"userId":"test-user-01","telemetry":{"enemiesHit":10,"damageDone":200,"timeInCombat":15,"kills":3,"itemsCollected":5,"pickupAttempts":6,"timeNearInteractables":8,"distanceTraveled":120,"timeSprinting":12,"timeOutOfCombat":15,"deathCount":1}}'
$resp = Invoke-WebRequest -Uri "http://localhost:3000/api/pipeline" -Method POST -ContentType "application/json" -Body $body
$ms = ((Get-Date) - $start).TotalMilliseconds
Write-Host "Test 1 (Valid): HTTP $($resp.StatusCode) | $([math]::Round($ms))ms"
```

**Terminal Output:**
```
Test 1 (Valid): HTTP 200 | 8466ms
```

> **Note:** The 8,466 ms is the one-time cold-start cost — Next.js compiles the route and the ANFIS pipeline singleton initialises on the very first request. All subsequent warm requests are well under 200 ms (see Test 5).

**Result:** ✅ PASS (HTTP 200)

---

## Test 2 — Missing `userId` (Validation Guard)

**Purpose:** Confirm the API rejects requests that omit the `userId` field with HTTP 400.

**Command:**
```powershell
$body2 = '{"telemetry":{"enemiesHit":10}}'
try {
    $resp2 = Invoke-WebRequest -Uri "http://localhost:3000/api/pipeline" -Method POST -ContentType "application/json" -Body $body2
} catch {
    Write-Host "Test 2 (Missing userId): HTTP $($_.Exception.Response.StatusCode.value__) PASS (400 expected)"
}
```

**Terminal Output:**
```
Test 2 (Missing userId): HTTP 400 PASS (400 expected)
```

**Result:** ✅ PASS (HTTP 400)

---

## Test 3 — Missing `telemetry` Object (Validation Guard)

**Purpose:** Confirm the API rejects requests that omit the `telemetry` object entirely with HTTP 400.

**Command:**
```powershell
$body3 = '{"userId":"user-a"}'
try {
    $resp3 = Invoke-WebRequest -Uri "http://localhost:3000/api/pipeline" -Method POST -ContentType "application/json" -Body $body3
} catch {
    Write-Host "Test 3 (Missing telemetry): HTTP $($_.Exception.Response.StatusCode.value__) PASS (400 expected)"
}
```

**Terminal Output:**
```
Test 3 (Missing telemetry): HTTP 400 PASS (400 expected)
```

**Result:** ✅ PASS (HTTP 400)

---

## Test 4 — Empty Body `{}` (Validation Guard)

**Purpose:** Confirm the API rejects a completely empty JSON body with HTTP 400.

**Command:**
```powershell
try {
    $resp4 = Invoke-WebRequest -Uri "http://localhost:3000/api/pipeline" -Method POST -ContentType "application/json" -Body '{}'
} catch {
    Write-Host "Test 4 (Empty body): HTTP $($_.Exception.Response.StatusCode.value__) PASS (4xx expected)"
}
```

**Terminal Output:**
```
Test 4 (Empty body): HTTP 400 PASS (4xx expected)
```

**Result:** ✅ PASS (HTTP 400)

---

## Test 5 — Warm Latency (5 Runs)

**Purpose:** Confirm round-trip latency is consistently below the 200 ms threshold after the pipeline singleton is initialised.

**Command:**
```powershell
1..5 | ForEach-Object {
    $i = $_
    $s = Get-Date
    Invoke-WebRequest -Uri "http://localhost:3000/api/pipeline" -Method POST -ContentType "application/json" -Body $body | Out-Null
    $elapsed = ((Get-Date) - $s).TotalMilliseconds
    Write-Host "Latency run ${i}: $([math]::Round($elapsed))ms"
}
```

**Terminal Output:**
```
Latency run 1: 47ms
Latency run 2: 38ms
Latency run 3: 41ms
Latency run 4: 35ms
Latency run 5: 39ms
```

> Run this after Test 1 has already completed — that ensures the ANFIS pipeline singleton is warm.

**Result:** ✅ PASS (all runs < 200 ms)

---

## Summary Table

| # | Test Case | Payload | Expected HTTP | Actual HTTP | Latency | Result |
|---|-----------|---------|--------------|-------------|---------|--------|
| 1 | Valid full payload | 11 telemetry fields + userId | 200 OK | **200** | 8,466 ms (cold start) | ✅ PASS |
| 2 | Missing `userId` | telemetry only | 400 Bad Request | **400** | — | ✅ PASS |
| 3 | Missing `telemetry` | userId only | 400 Bad Request | **400** | — | ✅ PASS |
| 4 | Empty body `{}` | — | 400 Bad Request | **400** | — | ✅ PASS |
| 5 | Warm latency (×5) | Valid payload | < 200 ms | **35–47 ms** | avg ≈ 40 ms | ✅ PASS |

---

## Notes

- **Cold-start:** The very first POST to the server incurs a one-time compilation + pipeline initialisation cost (~8 s in dev mode). In a production build (`next build && next start`) this is not present.
- **Warm latency target:** < 200 ms — **achieved** (avg ≈ 40 ms).
- **Validator logic** is implemented in `app/api/pipeline/route.ts` and checks for `userId` and all 11 required telemetry fields before invoking the ANFIS engine.
- Only **one API endpoint** exists in this system: `POST /api/pipeline`. This is by design — the ANFIS pipeline is a single inference path from telemetry window to adaptation parameters.
