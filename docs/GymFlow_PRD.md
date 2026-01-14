# Product Requirements Document: GymFlow v2
## Modern Minimalist Workout Tracker (Complete Specification)

---

## 1. Project Overview

**GymFlow** is a minimalist, self-hosted web application designed for **ultra-fast workout data entry**. Optimized for a single user on a private network, prioritizing speed and one-thumb navigation above all else.

### Core Problem
Existing workout apps are bloated with social features, analytics, and unnecessary friction. GymFlow aims to log a complete set in **under 5 seconds** with **zero interruptions**.

### Infrastructure
- Runs on home server via Docker
- Accessed through Tailscale private network
- Single-user deployment (no multi-tenancy considerations)

---

## 2. Technical Stack

### Frontend
- **React 18+** with Vite for instant HMR
- **Pico.css** (classless semantic HTML for zero CSS overhead)
- **React Router** for client-side navigation (instant transitions)
- Target: Sub-200ms page transitions, native app feel

### Backend
- **Node.js 20+** with Express
- **SQLite 3** (server-side persistence)
- **better-sqlite3** (synchronous API for speed)

### Infrastructure
- **Docker** + **Docker Compose**
- **Tailscale** for network-level security (no app authentication)

---

## 3. Complete Data Schema (SQLite)

### Schema Definition

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,  -- Hex color code (e.g., "#3B82F6")
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK(template_type IN ('strength', 'cardio', 'timed', 'bodyweight')),
    last_used_at DATETIME,  -- Updated on every log entry
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    metric_1 REAL,       -- See metric mapping below
    metric_2 INTEGER,    -- See metric mapping below
    metric_3 INTEGER,    -- See metric mapping below
    notes TEXT,          -- Optional free-text field
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_exercises_category ON exercises(category_id);
CREATE INDEX idx_exercises_last_used ON exercises(last_used_at DESC);
CREATE INDEX idx_logs_exercise ON logs(exercise_id);
CREATE INDEX idx_logs_created ON logs(created_at DESC);
```

### Metric Mapping by Template Type

| Template Type | metric_1 | metric_2 | metric_3 | Label Example |
|--------------|----------|----------|----------|---------------|
| **strength** | Weight (lbs/kg) | Reps | Sets | "185 lbs × 8 reps × 3 sets" |
| **cardio** | Distance (miles/km) | Duration (minutes) | *unused* | "3.2 miles in 28 min" |
| **timed** | Duration (seconds) | *unused* | *unused* | "90 seconds" |
| **bodyweight** | Reps | Sets | *unused* | "12 reps × 3 sets" |

**Design Decision**: Unused metrics are left NULL. This allows flexibility without schema changes.

### Seed Data (Initial Database State)

```sql
INSERT INTO categories (name, color, sort_order) VALUES
    ('Upper Body', '#3B82F6', 1),
    ('Lower Body', '#10B981', 2),
    ('Cardio', '#F59E0B', 3),
    ('Core', '#EF4444', 4);

INSERT INTO exercises (category_id, name, template_type) VALUES
    (1, 'Bench Press', 'strength'),
    (1, 'Pull-ups', 'bodyweight'),
    (2, 'Squats', 'strength'),
    (2, 'Deadlift', 'strength'),
    (3, 'Running', 'cardio'),
    (3, 'Cycling', 'cardio'),
    (4, 'Plank', 'timed'),
    (4, 'Crunches', 'bodyweight');
```

---

## 4. API Specification (RESTful Endpoints)

### Base URL
`http://localhost:8080/api`

### Endpoints

#### Categories

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|--------------|----------|-------|
| GET | `/categories` | - | `[{id, name, color, sort_order}]` | Returns all categories sorted by `sort_order` |
| POST | `/categories` | `{name, color, sort_order?}` | `{id, name, color, sort_order}` | Creates new category |
| PUT | `/categories/:id` | `{name?, color?, sort_order?}` | `{id, name, color, sort_order}` | Updates category |
| DELETE | `/categories/:id` | - | `{success: true}` | Cascades to exercises/logs |

#### Exercises

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|--------------|----------|-------|
| GET | `/exercises?category_id=X` | - | `[{id, name, template_type, last_used_at}]` | Returns exercises sorted by `last_used_at DESC NULLS LAST` |
| GET | `/exercises/:id` | - | `{id, name, template_type, category_id}` | Single exercise details |
| POST | `/exercises` | `{category_id, name, template_type}` | `{id, ...}` | Creates new exercise |
| PUT | `/exercises/:id` | `{name?, template_type?}` | `{id, ...}` | Updates exercise |
| DELETE | `/exercises/:id` | - | `{success: true}` | Cascades to logs |

#### Logs

| Method | Endpoint | Request Body | Response | Notes |
|--------|----------|--------------|----------|-------|
| GET | `/logs?exercise_id=X&limit=3` | - | `[{id, metric_1, metric_2, metric_3, created_at}]` | Returns recent logs (default limit=3) |
| POST | `/logs` | `{exercise_id, metric_1?, metric_2?, metric_3?, notes?}` | `{id, ...}` | **Also updates** `exercises.last_used_at` |
| DELETE | `/logs/:id` | - | `{success: true}` | For correcting mistakes |

### API Design Principles
- **No pagination**: Single user = small dataset
- **No authentication**: Tailscale handles network security
- **Permissive validation**: Accept nulls, coerce types (speed over strictness)
- **Synchronous responses**: No async delays (using better-sqlite3)

---

## 5. User Interface Specification

### Phase 1: Core Three-Tap Flow

#### Home Screen (`/`)
```
┌─────────────────────────────┐
│ ☰ GymFlow          [Admin]  │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │   UPPER BODY          │  │  <- Large tap target
│  │   (Blue #3B82F6)      │  │     Category color as bg
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   LOWER BODY          │  │
│  │   (Green #10B981)     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   CARDIO              │  │
│  │   (Orange #F59E0B)    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   CORE                │  │
│  │   (Red #EF4444)       │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**Behavior**:
- Tap category → Navigate to `/category/:id`
- Hamburger menu → Navigate to `/admin`
- Display categories sorted by `sort_order`

---

#### Category View (`/category/:id`)

```
┌─────────────────────────────┐
│ ← Back        UPPER BODY     │
├─────────────────────────────┤
│                             │
│  ┌─────────┐  ┌─────────┐  │
│  │ Bench   │  │ Pull-   │  │  <- Grid of exercises
│  │ Press   │  │ ups     │  │     Most recent first
│  └─────────┘  └─────────┘  │
│                             │
│  ┌─────────┐  ┌─────────┐  │
│  │ Dumbbell│  │ Rows    │  │
│  │ Flys    │  │         │  │
│  └─────────┘  └─────────┘  │
│                             │
└─────────────────────────────┘
```

**Behavior**:
- Display exercises sorted by `last_used_at DESC NULLS LAST`
- Tap exercise → Navigate to `/entry/:exercise_id`
- "Back" button → Navigate to `/`

---

#### Entry View (`/entry/:exercise_id`)

```
┌─────────────────────────────┐
│ ← Back        Bench Press    │
├─────────────────────────────┤
│ Recent History:             │
│  • 185 lbs × 8 reps × 3 sets│
│  • 180 lbs × 10 reps × 3    │
│  • 175 lbs × 10 reps × 3    │
├─────────────────────────────┤
│                             │
│  Weight (lbs)               │
│  ┌─────────────────────────┐│
│  │       185               ││  <- Auto-focused
│  └─────────────────────────┘│     Numeric keyboard
│                             │
│  Reps                       │
│  ┌─────────────────────────┐│
│  │       8                 ││  <- Pre-filled from
│  └─────────────────────────┘│     most recent log
│                             │
│  Sets                       │
│  ┌─────────────────────────┐│
│  │       3                 ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │        SAVE             ││  <- Giant button
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

**Behavior**:
1. On load:
   - Fetch last 3 logs for this exercise
   - Pre-fill form with most recent log values
   - Auto-focus first input field
   - Display recent history as read-only reference

2. On "SAVE":
   - POST to `/api/logs`
   - Show green success flash (1 second): "✓ Saved!"
   - Navigate back to `/category/:id`
   - **No confirmation dialog** (speed priority)

3. "Back" button:
   - Navigate to `/category/:id`
   - **No "unsaved changes" warning** (again, speed)

**Input Labels by Template Type**:
- `strength`: Weight / Reps / Sets
- `cardio`: Distance / Duration (min) / -
- `timed`: Duration (sec) / - / -
- `bodyweight`: Reps / Sets / -

---

### Phase 2: Admin Interface

#### Admin Home (`/admin`)

```
┌─────────────────────────────┐
│ ← Home        Admin Panel    │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │  Manage Categories      ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  Manage Exercises       ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  View All Logs          ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

---

#### Manage Categories (`/admin/categories`)

```
┌─────────────────────────────┐
│ ← Back        Categories     │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ + Add New Category      ││
│  └─────────────────────────┘│
│                             │
│  Upper Body      [Edit] [×] │
│  Lower Body      [Edit] [×] │
│  Cardio          [Edit] [×] │
│  Core            [Edit] [×] │
│                             │
└─────────────────────────────┘
```

**Behavior**:
- "Add New" → Show inline form: Name + Color picker
- "Edit" → Inline edit mode
- "[×]" → Delete (with confirmation: "Delete category and all exercises/logs?")
- Drag handles for re-ordering (updates `sort_order`)

---

#### Manage Exercises (`/admin/exercises`)

```
┌─────────────────────────────┐
│ ← Back        Exercises      │
├─────────────────────────────┤
│  Filter: [All Categories ▾] │
│                             │
│  ┌─────────────────────────┐│
│  │ + Add New Exercise      ││
│  └─────────────────────────┘│
│                             │
│  Bench Press (Strength)     │
│  Category: Upper Body       │
│                [Edit] [×]   │
│                             │
│  Pull-ups (Bodyweight)      │
│  Category: Upper Body       │
│                [Edit] [×]   │
│                             │
└─────────────────────────────┘
```

**Form Fields**:
- Name (text input)
- Category (dropdown)
- Template Type (dropdown: strength/cardio/timed/bodyweight)

---

### Phase 3: Progressive Web App (PWA)

#### manifest.json
```json
{
  "name": "GymFlow",
  "short_name": "GymFlow",
  "description": "Minimalist workout tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Service Worker Strategy
- **Cache-First** for static assets (HTML, CSS, JS)
- **Network-First** for API calls (always fresh data)
- **Offline fallback**: Show cached home screen + message

---

## 6. Non-Functional Requirements

### Performance Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| Page transition | < 200ms | React Router navigation |
| API response time | < 50ms | SQLite query execution |
| Initial page load | < 1s | Vite production build |
| Input responsiveness | Instant | No debouncing on number inputs |

### Mobile Optimization
- **One-thumb navigation**: All tap targets > 44×44px
- **No accidental taps**: 16px spacing between buttons
- **Numeric keyboards**: Use `inputmode="decimal"` for weight, `inputmode="numeric"` for reps/sets
- **No scroll hijacking**: Natural mobile scrolling behavior
- **Full-screen PWA**: Hide browser chrome on mobile

### Data Integrity
- **No orphaned records**: Use `ON DELETE CASCADE` for foreign keys
- **Graceful degradation**: Empty states ("No exercises yet") instead of errors
- **Permissive validation**: Accept `null` for optional fields, coerce strings to numbers

### Security
- **Zero authentication**: Tailscale provides network-level access control
- **No HTTPS required**: Private network traffic only
- **No rate limiting**: Single user, trusted network
- **CORS**: Allow all origins (private network context)

---

## 7. Deployment Specification

### Dockerfile (Multi-Stage Build)

```dockerfile
# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend/ ./

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 8080
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  gymflow:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data  # Persistent SQLite storage
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/gymflow.db
    restart: unless-stopped
```

### Directory Structure
```
gymflow/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   │   ├── categories.js
│   │   ├── exercises.js
│   │   └── logs.js
│   └── package.json
├── data/               # Git-ignored, mounted as volume
│   └── gymflow.db
├── Dockerfile
└── docker-compose.yml
```

---

## 8. User Flow Examples (Speed-Optimized)

### Scenario 1: Logging Bench Press (Target: < 5 seconds)

1. Open app (PWA from home screen) - **0s**
2. Tap "UPPER BODY" - **0.5s**
3. Tap "Bench Press" - **1s**
4. Form pre-filled with "185 / 8 / 3" - **1.2s**
5. Change weight to "190" (keyboard already open) - **3s**
6. Tap giant "SAVE" button - **4s**
7. Green flash, navigate back to category - **4.5s**

**Total: 4.5 seconds** ✓

### Scenario 2: Adding New Exercise (Admin Flow)

1. From home, tap hamburger menu
2. Tap "Manage Exercises"
3. Tap "+ Add New Exercise"
4. Enter "Shoulder Press", select "Upper Body", select "Strength"
5. Tap "Save"
6. Exercise appears in list, navigate back to home

---

## 9. Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| No internet (offline) | Show cached UI, queue API calls, sync when online |
| Invalid metric (e.g., "abc" for weight) | Coerce to 0, allow save (permissive) |
| Empty form submission | Allow save with all nulls (user might track exercise attempt) |
| Delete category with exercises | Show confirmation, cascade delete all exercises + logs |
| Concurrent edits (two tabs open) | Last write wins (no conflict resolution needed for single user) |
| Database corruption | App logs error, shows "Database error - restart container" |

**Philosophy**: For a single-user speed-focused app, **fail permissively** rather than block the user. Data integrity is secondary to logging speed.

---

## 10. Future Enhancements (Out of Scope for MVP)

- **Export data**: Download CSV/JSON backup
- **Simple charts**: Weight progression over time (optional toggle)
- **Rest timer**: Countdown between sets
- **Voice input**: Dictate metrics instead of typing
- **Apple Watch companion**: Quick-add from wrist

---

## 11. Success Metrics

For a single-user app, success is qualitative:

✅ **Primary Goal**: Can log a workout set in < 5 seconds, one-handed  
✅ **Secondary Goal**: Zero friction—no logins, no confirmations, no interruptions  
✅ **Tertiary Goal**: Works offline, feels like a native app  

---

## Appendix A: Example API Requests/Responses

### POST /api/logs (Logging a set)

**Request:**
```json
{
  "exercise_id": 1,
  "metric_1": 190.0,
  "metric_2": 8,
  "metric_3": 3
}
```

**Response:**
```json
{
  "id": 42,
  "exercise_id": 1,
  "metric_1": 190.0,
  "metric_2": 8,
  "metric_3": 3,
  "notes": null,
  "created_at": "2025-01-13T14:32:10.000Z"
}
```

**Side Effect**: Updates `exercises.last_used_at` to `CURRENT_TIMESTAMP`

---

### GET /api/exercises?category_id=1

**Response:**
```json
[
  {
    "id": 1,
    "name": "Bench Press",
    "template_type": "strength",
    "category_id": 1,
    "last_used_at": "2025-01-13T14:32:10.000Z"
  },
  {
    "id": 2,
    "name": "Pull-ups",
    "template_type": "bodyweight",
    "category_id": 1,
    "last_used_at": "2025-01-12T09:15:00.000Z"
  }
]
```

---

## Appendix B: Color Palette

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary (Blue) | Bright Blue | `#3B82F6` | Upper Body category, primary actions |
| Success (Green) | Emerald | `#10B981` | Lower Body category, success flash |
| Warning (Orange) | Amber | `#F59E0B` | Cardio category |
| Danger (Red) | Red | `#EF4444` | Core category, delete actions |
| Background | Black | `#000000` | App background (dark theme) |
| Text | White | `#FFFFFF` | Primary text |
| Muted Text | Gray | `#6B7280` | Secondary text, timestamps |

---

## Document Changelog

- **v2.0** (2025-01-13): Complete specification with API contracts, UX flows, and seed data
- **v1.0** (Original): Initial concept document

---

**End of Document**  
This PRD is now ready for a coding agent to implement with zero ambiguity.