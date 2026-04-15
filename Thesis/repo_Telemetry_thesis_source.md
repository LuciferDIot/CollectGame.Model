# Thesis Source Document - CollectGame.Telemetry Repository
**System**: AURA (Adaptive User-Responsive Architecture)
**Repo**: CollectGame.Telemetry
**Role**: Real-time telemetry collection backend (game -> database)
**Stack**: Node.js + Express + TypeScript + MongoDB
**Deployment**: Render (https://telemetry-collection.onrender.com)
**Author**: K. W. J. P. Geevinda

> This document covers the telemetry backend - the infrastructure layer that receives gameplay data from the Unreal Engine game client and stores it for analysis by the CalibrationAnalysis and CollectGame.Model pipelines. Combine with the other two repo source docs for the full thesis.

---

## 1. Purpose and Position in AURA Pipeline

The Telemetry backend is the **data ingestion layer** of AURA. It sits between the game (Unreal Engine client) and all analysis/training pipelines:

```
Unreal Engine Game Client
    v  (HTTP POST every 30 seconds)
CollectGame.Telemetry Backend   <-- [THIS REPO]
    v  (MongoDB storage)
CollectGame.CalibrationAnalysis  (reads CSVs exported from MongoDB)
    v
CollectGame.Model               (ANFIS training + demo UI)
```

**Responsibilities**:
- Accept and validate telemetry payloads from Unreal Engine
- Store 30-second telemetry windows to MongoDB
- Log discrete death events with timestamps
- Accept calibration-mode telemetry (mode-tagged windows during the study)
- Maintain a real-time leaderboard (kills, items, distance, damage)
- Generate achievement notifications on leaderboard rank changes
- Provide debug endpoints for Unreal Engine integration testing

---

## 2. Architecture

### 2.1 Architectural Pattern: MVC + Repository + Service
The backend was refactored from a monolithic controller pattern to MVC + SOLID principles:

```
Routes        -> HTTP endpoint definitions
Controllers   -> Request parsing and response formatting
Services      -> Business logic (TelemetryService, NotificationService)
Repositories  -> Database access (LeaderboardRepository, TelemetryRepository)
Models        -> MongoDB schemas (Mongoose)
```

This separation was introduced in commit `fef2c74` ("MVC and SOLID principles added") after early prototypes placed all logic directly in route handlers.

### 2.2 Route Structure
| Router | Mount Path | Purpose |
|--------|-----------|---------|
| `userRouter` | `/api/users` | User registration, notification management |
| `unrealRouter` | `/api/unreal` | Primary Unreal Engine telemetry endpoints |
| `calibrationRouter` | `/api/calibration` | Calibration-mode telemetry (study phase) |
| `telemetryRouter` | `/api` and `/` | Standard + legacy telemetry, leaderboard, export |
| `debugRouter` | `/api` | Dry-run debug endpoints (no DB write) |

### 2.3 Middleware Stack
```
CORS            -> Allows cross-origin requests from game client
logRequestStart -> Logs incoming request method + URL
JSON parser     -> Parses request bodies
logRequestBody  -> Logs parsed body for debugging
Rate limiter    -> 1000 req / 15 min per IP (Render/load-balancer aware)
errorHandler    -> Centralised error formatting + MongoDB error log
```

### 2.4 Database: MongoDB (Mongoose)
Deployed on MongoDB Atlas; connected via environment variable `MONGODB_URI`.

**Collections**:
| Collection | Model | Purpose |
|-----------|-------|---------|
| `users` | `User` | Player registration + consent |
| `telemetries` | `Telemetry` | Standard 30s gameplay telemetry windows |
| `calibration_telemetry` | `CalibrationTelemetry` | Mode-tagged calibration windows |
| `deathevents` | `DeathEvent` | Discrete player death timestamps |
| `leaderboards` | `Leaderboard` | Cumulative stats + rank history |
| `notifications` | `Notification` | Achievement notifications |
| `user_notifications` | `UserNotification` | Per-user notification delivery state |
| `achievements` | `Achievement` | Milestone achievements |
| `error_logs` | `ErrorLog` | All server errors with stack traces |
| `telemetry_snapshots` | `TelemetrySnapshot` | 5-minute windowed performance records |

---

## 3. Data Models (Telemetry Schema)

### 3.1 Standard Telemetry (`Telemetry` model)
Collected every 30 seconds from gameplay sessions:

```typescript
interface ITelemetry {
  userId: ObjectId;           // Reference to User
  timestamp: Date;            // Sri Lankan timezone (UTC+5:30)
  sessionId: string;          // Auto-generated: "unreal_<timestamp>"

  // Collection archetype
  itemsCollected: number;
  pickupAttempts: number;
  timeNearInteractables: number;

  // Combat archetype
  enemiesHit: number;
  damageDone: number;
  timeInCombat: number;

  // Exploration archetype
  distanceTraveled: number;
  timeOutOfCombat: number;
  timeSprinting: number;

  kills: number;
  died: boolean;
  rawJson?: Record<string, unknown>;  // Flexible storage for future fields
}
```

**Indexes**: `userId` (ascending), `timestamp` (descending) - optimised for per-user time-series queries.

### 3.2 Calibration Telemetry (`CalibrationTelemetry` model)
Used during the calibration study (before adaptation was enabled):

```typescript
interface ICalibrationTelemetry {
  userId: ObjectId;
  modeId: number;              // 1, 2, or 3 - the game mode
  timestamp: Date;
  telemetryWindowSeconds: number;  // Default: 30

  metrics: {
    itemsCollected, heartsCollected, coinsCollected,
    timeNearInteractables, pickupAttempts,
    enemiesHit, damageDone, timeInCombat,
    distanceTraveled, timeOutOfCombat, timeSprinting
  };

  events: {
    playerDeath: boolean;
  };
}
```

**Key difference from standard telemetry**: includes `modeId` (which mode was active) and separates `heartsCollected` and `coinsCollected` as sub-categories of items. This granularity was needed for the calibration analysis to distinguish item types.

**Indexes**: `userId`, `modeId`, `timestamp` - supports both per-mode and per-user calibration queries.

### 3.3 Death Event (`DeathEvent` model)
Discrete event logging (separate from the 30-second aggregation):

```typescript
interface IDeathEvent {
  userId: ObjectId;
  timestamp: Date;
  sessionId: string;
  location: string;    // "Unknown" in Unreal integration (position not yet captured)
  cause: string;       // "Unknown" in Unreal integration (cause not yet captured)
}
```

Death events are stored separately to support temporal alignment in the CalibrationAnalysis pipeline (Notebook 00). Each death event is precisely timestamped and matched to the nearest following telemetry window.

---

## 4. API Endpoints

### 4.1 User Initialisation
```
POST /api/users/init
```
**Purpose**: Register a new player before gameplay starts.

**Request**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "consentAgreed": true
}
```

**Response** (includes real-time leaderboard):
```json
{
  "message": "User created successfully",
  "userId": "60d5ec...",
  "apiKey": "key_...",
  "bestAttacker": { "name": "...", "kills": 45 },
  "bestExplorer":  { "name": "...", "distanceTraveled": 5200 },
  "bestCollector": { "name": "...", "itemsCollected": 120 },
  "leaderboard": [...],
  "notifications": [...]
}
```

**Research significance**: `consentAgreed: true` is mandatory - no telemetry can be submitted without prior user registration and explicit consent. This satisfies research ethics requirements.

### 4.2 Primary Unreal Engine Telemetry
```
POST /api/unreal/telemetry?limit=6
```
**Purpose**: Receive 30-second gameplay window from Unreal Engine. Returns updated leaderboard + notifications.

**Request payload**:
```json
{
  "userId": "string",
  "telemetry": {
    "itemsCollected": 0,  "heartsCollected": 0,  "coinsCollected": 0,
    "timeNearInteractables": 0,  "pickupAttempts": 0,
    "enemiesHit": 0,  "damageDone": 0,  "timeInCombat": 0,
    "distanceTraveled": 0,  "timeOutOfCombat": 0,  "timeSprinting": 0
  },
  "performance": {
    "kills": 0,
    "deaths": 0
  }
}
```

**Processing pipeline** (in `TelemetryService.processUnrealTelemetry`):
1. Validate payload structure (missing userId/telemetry/performance -> 400 error)
2. Fetch previous leaderboard stats (for rank comparison -> notification generation)
3. Transform Unreal payload -> `InternalTelemetryData` (camelCase -> snake_case)
4. Save telemetry to MongoDB
5. Update global rank for all users (sorted by kills, bulk write)
6. Fetch updated stats post-save
7. Generate achievement notifications (rank change, category champion, milestones)
8. Build leaderboard response (top N + current user if not in top N)
9. Return combined response

### 4.3 Death Event
```
POST /api/unreal/death
```
**Purpose**: Log a discrete player death event.

**Request**: `{ "userId": "string", "timestamp": "ISO8601" }`

**Response**: `{ "message": "string" }`

Also increments `totalDeaths` in the leaderboard collection.

### 4.4 Calibration Telemetry (Study Phase)
```
POST /api/calibration/telemetry
```
**Purpose**: Receive calibration-mode telemetry during the baseline study. Mode-tagged to enable per-mode analysis in CalibrationAnalysis.

**Request**:
```json
{
  "userId": "string",
  "modeId": 1,
  "telemetryWindowSeconds": 30,
  "metrics": { ... all 11 metric fields ... }
}
```

**Response**: `{ "status": "accepted", "calibrationActive": true }`

This endpoint was added specifically for the calibration study and is separate from the main gameplay endpoint to prevent mixing of calibration data with runtime training data.

### 4.5 Debug Endpoints (No DB Write)
All debug endpoints validate the payload structure and return mock responses without writing to MongoDB. Used by the Unreal Engine team to verify payload format before live integration.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/users/init/debug` | Verify user registration payload |
| `POST /api/unreal/telemetry/debug` | Verify telemetry payload + key ordering |
| `POST /api/unreal/death/debug` | Verify death event payload |
| `POST /api/calibration/debug` | Verify calibration telemetry payload |

### 4.6 Leaderboard
```
GET /api/leaderboard?metric=kills&limit=10
```
**Metrics supported**: `kills`, `items`, `damage`, `distance`, `deaths`

### 4.7 Health Check
```
GET /healthz -> 200 OK
```
Used by Render's health monitoring system to detect server crashes and trigger automatic restarts.

---

## 5. Notification System

Achievement notifications are generated automatically on each telemetry submission. They are returned in the telemetry response so the game can display them immediately without a separate fetch.

### 5.1 Achievement Types
| Type | Trigger |
|------|---------|
| `TOP_RANK` | Leaderboard position milestone (Top 1, 3, 10, 25, 50, 100) |
| `RANK_IMPROVEMENT` | Climbing 10+ positions in a single session |
| `CATEGORY_CHAMPION` | Best Attacker (kills), Explorer (distance), or Collector (items) - first time |
| `TIME_RECORD` | Best performance in a 5-minute window |
| `MILESTONE` | Cumulative thresholds (100 kills, 500 items, etc.) |
| `COMPARATIVE` | K/D ratio, accuracy, damage comparisons vs. other players |

### 5.2 Priority System (1-10)
| Priority | Example |
|----------|---------|
| 10 | Rank #1 globally |
| 9 | Top 3 leaderboard |
| 8 | Top 10, Category champion |
| 7 | Rank improvement ≥10 positions |
| 6 | Top 25, time-based achievement |
| 5-1 | Progressively lower-significance milestones |

### 5.3 Notification Delivery
- Stored in MongoDB per user with read/unread state
- Returned inline with every telemetry response (avoid extra round-trips)
- `GET /api/users/notifications/:userId?unreadOnly=true` - fetch pending notifications
- `POST /api/users/notifications/:notificationId/read` - mark as read
- `DELETE /api/users/notifications/:notificationId` - dismiss

---

## 6. Leaderboard Architecture

### 6.1 Real-Time Ranking
After each telemetry submission, global ranks are recomputed in a single bulk MongoDB write:
```typescript
// Sort all users by totalKills descending
// Assign rank = index + 1
// Bulk update: set currentRank, set previousRank = old currentRank
// Append to rankHistory (capped at last 20 entries)
```

### 6.2 User-Inclusive Leaderboard
If the current user is not in the top N, they are fetched separately and appended to the leaderboard response so the player always sees their own standing.

### 6.3 Best Player per Category
Computed in parallel (Promise.all) for each telemetry response:
- **Best Attacker**: Player with highest `totalKills`
- **Best Explorer**: Player with highest `totalDistance`
- **Best Collector**: Player with highest `totalItems`

---

## 7. Error Handling

All errors (validation failures, DB errors, unexpected exceptions) are:
1. Formatted as `{ "error": "Description" }` JSON with appropriate HTTP status
2. Logged to the `error_logs` MongoDB collection with: timestamp, error message, stack trace, associated `userId` (if available)

This provides a persistent audit trail of all failures - important for a research system where data integrity is critical.

---

## 8. Deployment

| Aspect | Detail |
|--------|--------|
| Platform | Render (cloud PaaS) |
| Production URL | `https://telemetry-collection.onrender.com` |
| Config file | `render.yaml` |
| Health check | `GET /healthz` |
| Rate limiting | 1000 req / 15 min per IP |
| Timezone | Sri Lanka (UTC+5:30) - `getSriLankanTime()` utility used for all timestamps |

**Why Render?** Free-tier cloud hosting with automatic HTTPS, health monitoring, and GitHub integration. Suitable for research-scale traffic (7 participants, ≈30s request interval per player).

---

## 9. Test Suite

Tests implemented using the project's configured test runner:

| Test File | Coverage |
|-----------|---------|
| `TelemetryController.test.ts` | Payload validation, telemetry save, death logging |
| `UserController.test.ts` | User registration, duplicate handling |
| `CalibrationController.test.ts` | Calibration payload acceptance, modeId validation |
| `TelemetryServiceRefactor.test.ts` | Service-layer business logic |
| `NotificationService.test.ts` | Achievement generation, priority assignment |
| `ValueObjects.test.ts` | Domain value objects (Rank, TelemetryData, UserId) |
| `timezone.test.ts` | Sri Lanka timezone utility |

Run with: `npm test`

---

## 10. Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB (Atlas) via Mongoose ODM |
| ORM/Schema | Mongoose |
| HTTP | REST API |
| Auth | API key per user (`apiKey` field) |
| Deployment | Render |
| Config | `render.yaml`, environment variables |
| Rate limiting | `express-rate-limit` |
| Logging | Custom request logger middleware + MongoDB error_logs |
| Testing | (project test runner - npm test) |

---

## 11. Git Commit Trail (Key Commits)

| Commit | Message | Phase |
|--------|---------|-------|
| `31af059` | first commit | Foundation |
| `7b289a9` | feat: Implement telemetry backend with user registration, data collection, leaderboard, and Unreal integration | Foundation |
| `39d8730` | feat: Introduce core TypeScript types for telemetry and user data | Foundation |
| `cddffe6` | feat: Implement telemetry data collection, death logging, leaderboard generation, debug endpoint | v1 |
| `814e074` | Death endpoint refactor | v1 |
| `9853eab` | MongoDB migration | v1 |
| `f01630e` | calibration endpoint added | Calibration |
| `e50f498` | Calibration endpoint added | Calibration |
| `9607859` | logger and error database added | v2 |
| `64d5c94` | updated logs and logging issue fixed | v2 |
| `b3ddd96` | calibration changes | Calibration |
| `1242143` | feat: add UserController to handle user initialization | v2 |
| `170c67b` | feat: Implement TelemetryService for saving telemetry, logging deaths, managing leaderboards | v2 |
| `fef2c74` | MVC and SOLID principles added | Refactor |
| `b3b7d7c` | leaderboard logic | v2 |
| `6cb96ff` | Leaderboard names bug fixed, Notification limit added | Bug fix |
| `72b3ea3` | notification's read state not changing bug fixed | Bug fix |
| `38183fd` | added boundaries to notification | Notifications |
| `fc88652` | Logs and new commer's leaderboard updated | v2 |
| `e69044f` | feat: introduce TelemetryService for processing gameplay data, managing leaderboards, logging deaths, generating notifications | v3 |
| `028706f` | feat: Implement core telemetry and leaderboard features with new services, repositories, controllers, and comprehensive type definitions | v3 |
| `05fb00d` | test: expand backend test coverage to all service and domain layers | Testing |
| `129a673` | refactor: flatten repo structure, trim tests, update README | Cleanup |
| `0d9492e` | Merge PR #15 | Final |

---

## 12. Thesis Contributions from This Repo

### Infrastructure Contribution
1. **Engine-agnostic telemetry pipeline**: The backend accepts telemetry from Unreal Engine via a standard REST API, making the ANFIS pipeline independent of the specific game engine - any engine that can issue HTTP POSTs every 30 seconds can integrate with AURA.

2. **Dual-mode collection**: Standard gameplay telemetry and calibration-mode telemetry are stored in separate collections, preserving the clean boundary between calibration phase and training phase.

3. **Consent-first design**: User registration with `consentAgreed: true` is mandatory before any data can be submitted - directly aligned with research ethics requirements.

### Engineering Decisions with Thesis Relevance
- **30-second windowing enforced at the client**: The backend accepts whatever window the game sends but stores `telemetryWindowSeconds` for traceability. The 30-second window was determined by the ANFIS pipeline requirements, not the backend.
- **Separate death events**: Deaths are logged as discrete timestamped events rather than aggregated into the telemetry window. This enables precise temporal alignment in the CalibrationAnalysis notebook (nearest-following-window rule).
- **No model training here**: This backend is purely a data collection layer. No ML occurs in this repo - it feeds data to the two analysis repos.

---

*Document generated: 2026-03-07 | Repo: CollectGame.Telemetry | Status: Deployed and operational*

