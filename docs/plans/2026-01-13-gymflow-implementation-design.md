# GymFlow v2 Implementation Design
## Date: 2026-01-13

This document captures implementation decisions and clarifications for building GymFlow v2 based on the PRD.

---

## 1. Design Decisions from PRD Review

### UI/UX Specifications

**Entry View Enhancements:**
- ✅ Notes field included in entry form (optional text input below metrics)
- ✅ Empty form fields left truly empty (no placeholder text for pre-filled values)
- ✅ Recent history displays metric values only (no timestamps)
- ✅ Success flash shows "✓ Saved!" for 1 second before auto-navigation

**Layout Decisions:**
- ✅ Home screen uses 2-column grid for categories (more compact, fits 4 categories without scrolling)
- ✅ Category colors applied as background with white text (high contrast, bold visual distinction)
- ✅ Unused exercises sorted to end of list (last_used_at DESC NULLS LAST)

**Admin Interface:**
- ✅ View All Logs displays as chronological table (exercise name, metrics, date, delete button)
- ✅ Color picker uses native `<input type="color">` (no external library needed)
- ✅ Category reordering via up/down arrow buttons (simpler than drag-and-drop, better mobile UX)

### Technical Architecture

**Routing & Serving:**
- Express serves static build at `/*` and API at `/api/*`
- All non-API routes fallback to index.html for React Router client-side routing
- Single-server deployment (no separate static file server needed)

**Database Initialization:**
- Auto-initialize on first server start
- Check for `/app/data/gymflow.db` existence in server.js
- If missing: create schema, insert seed data, log initialization

**State Management:**
- Form state preserved in sessionStorage (user can navigate away and return)
- API failures show error message with manual retry button (no auto-retry)
- Service worker implements cache-first for static assets, network-first for API

**PWA Implementation (Phase 1):**
- Service worker registered from main.jsx
- Cache strategy: static assets cached, API always fresh
- Offline fallback shows cached UI + "You're offline" banner
- manifest.json with app metadata and icons

---

## 2. Implementation Decisions for Minor Gaps

### Icon Design
**Decision:** Generate simple geometric SVG icons
- 192x192 and 512x512 PNG exports from SVG source
- Minimalist dumbbell/barbell symbol in app theme color (#3B82F6)
- Transparent background for adaptive icon support
- Create `/frontend/public/icons/` directory with source SVG

### Color Picker
**Decision:** Native HTML5 `<input type="color">`
- Zero dependencies, works across all modern browsers
- Returns hex color format (matches schema requirements)
- Good native UX on both desktop and mobile

### Category Reordering
**Decision:** Up/down arrow buttons instead of drag-and-drop
- **Rationale:** Simpler implementation, no library needed
- Better mobile touch target reliability
- Each category shows ↑↓ buttons (disabled at edges)
- Updates `sort_order` via PUT `/api/categories/:id`

### View All Logs Display
**Decision:** Show recent 100 logs with "Load More" button
- Prevents performance issues with years of data
- Displays: Date | Exercise Name | Metrics | [Delete]
- Sorted by `created_at DESC`
- If total logs > 100, show "Load More (X remaining)" button
- Each load fetches next 100 logs

---

## 3. Performance Optimization Strategy

### Frontend Optimizations
1. **Vite production build** with code splitting
2. **React.lazy()** for admin routes (not needed in fast path)
3. **Numeric input optimization:** `inputmode="decimal"` for weight, `inputmode="numeric"` for reps/sets
4. **No debouncing on inputs** (instant responsiveness)
5. **Prefetch last 3 logs** on category view load (ready before user taps exercise)

### Backend Optimizations
1. **Synchronous SQLite queries** with better-sqlite3 (no async overhead)
2. **Prepared statements** for all frequent queries (log insertion, exercise lookup)
3. **Indexes** on hot paths: `exercises.last_used_at`, `logs.created_at`, `logs.exercise_id`
4. **No middleware bloat:** Only express.json() and express.static()

### Service Worker Strategy
```javascript
// Static assets (HTML, CSS, JS, fonts)
Cache-First → Cache → Network → Fallback

// API calls
Network-First → Network → Cache (if offline) → Error

// Images/icons
Cache-First → Cache → Network
```

---

## 4. File Structure (Detailed)

```
gymflow/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryCard.jsx       # Home screen category button
│   │   │   ├── ExerciseButton.jsx     # Category view exercise button
│   │   │   ├── EntryForm.jsx          # Dynamic form based on template_type
│   │   │   └── Toast.jsx              # Success/error notifications
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Category selection screen
│   │   │   ├── CategoryView.jsx       # Exercise list for category
│   │   │   ├── EntryView.jsx          # Log entry form
│   │   │   ├── AdminHome.jsx          # Admin dashboard
│   │   │   ├── ManageCategories.jsx   # Category CRUD
│   │   │   ├── ManageExercises.jsx    # Exercise CRUD
│   │   │   └── ViewLogs.jsx           # All logs table
│   │   ├── hooks/
│   │   │   ├── useAPI.js              # Fetch wrapper with error handling
│   │   │   └── useFormState.js        # SessionStorage persistence
│   │   ├── App.jsx                    # Router setup
│   │   ├── main.jsx                   # Entry point + SW registration
│   │   └── service-worker.js          # PWA cache strategy
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icons/
│   │   │   ├── icon.svg               # Source vector graphic
│   │   │   ├── icon-192.png
│   │   │   └── icon-512.png
│   │   └── favicon.ico
│   ├── index.html                     # Vite entry (Pico.css CDN link)
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── routes/
│   │   ├── categories.js              # Category CRUD endpoints
│   │   ├── exercises.js               # Exercise CRUD + sorting
│   │   └── logs.js                    # Log CRUD + trigger last_used_at
│   ├── db.js                          # SQLite init + prepared statements
│   ├── server.js                      # Express setup + static serving
│   └── package.json
├── data/                              # Git-ignored, Docker volume
│   └── gymflow.db                     # SQLite database file
├── docs/
│   ├── GymFlow_PRD.md                 # Original requirements
│   └── plans/
│       └── 2026-01-13-gymflow-implementation-design.md
├── .gitignore                         # Ignore data/, node_modules/, dist/
├── Dockerfile                         # Multi-stage build
├── docker-compose.yml
└── README.md                          # Quick start guide
```

---

## 5. Implementation Phases

### Phase 1: Core Backend (API + Database)
**Deliverables:**
- SQLite schema creation + seed data insertion
- Express server with CORS and static serving
- RESTful API endpoints (categories, exercises, logs)
- Auto-update `exercises.last_used_at` trigger on log creation
- Basic error handling (500 for DB errors, 404 for not found)

**Validation:**
- Manual API testing with curl/Postman
- Verify cascade deletes work correctly
- Confirm sorting (last_used_at DESC NULLS LAST)

---

### Phase 2: Frontend Core Flow (Three-Tap Path)
**Deliverables:**
- React Router setup with Home, CategoryView, EntryView
- Pico.css integration via CDN
- Category grid (2-column layout with color backgrounds)
- Exercise list (sorted by recency)
- Entry form with dynamic fields based on template_type
- Form pre-fill from last 3 logs
- Success flash animation + auto-navigation

**Validation:**
- Complete flow test: Home → Category → Exercise → Log → Back
- Verify < 5 second target with pre-filled form
- Test all template types (strength, cardio, timed, bodyweight)

---

### Phase 3: Admin Interface
**Deliverables:**
- AdminHome navigation screen
- ManageCategories (CRUD + reorder with arrows)
- ManageExercises (CRUD + category filter dropdown)
- ViewLogs (table with delete, paginated at 100 rows)
- Color picker for category creation/editing

**Validation:**
- Create new category and verify cascade on delete
- Add exercise to category, confirm appears in category view
- Delete log from ViewLogs, verify removed from exercise history

---

### Phase 4: PWA Features
**Deliverables:**
- Service worker with cache-first/network-first strategies
- manifest.json with proper metadata
- Icon generation (SVG → 192px, 512px PNGs)
- Offline fallback UI ("You're offline" banner)
- Add to home screen prompt (if supported by browser)

**Validation:**
- Test offline mode (disconnect network, verify cached UI)
- Verify API calls fail gracefully with error message
- Install PWA on mobile device, test native app feel

---

### Phase 5: Docker Deployment
**Deliverables:**
- Multi-stage Dockerfile (frontend build → production server)
- docker-compose.yml with volume mounting
- Health check endpoint (GET /health → 200 OK)
- README with deployment instructions

**Validation:**
- Build Docker image, run container
- Verify persistent data across container restarts
- Test Tailscale network access (if available)

---

## 6. Testing Strategy

### Manual Testing Checklist
**Speed Test:**
- [ ] Log a set in under 5 seconds (pre-filled form)
- [ ] Page transitions under 200ms (measure with DevTools)
- [ ] API responses under 50ms (check Network tab)

**Functional Test:**
- [ ] Create category → Create exercise → Log workout
- [ ] Navigate back button at each stage (no errors)
- [ ] Delete category with exercises (cascades correctly)
- [ ] Form state persists when navigating away and back
- [ ] Success/error messages display correctly

**Edge Cases:**
- [ ] Submit form with all empty fields (allows null metrics)
- [ ] Invalid numeric input (coerce to 0 or null)
- [ ] API failure scenario (show retry button)
- [ ] No exercises in category (show "No exercises yet")

**PWA Test:**
- [ ] Install on mobile device (shows install prompt)
- [ ] Works offline (cached UI, API error message)
- [ ] Icons display correctly in app drawer/home screen

---

## 7. Success Criteria

The implementation is complete when:
1. ✅ A workout set can be logged in under 5 seconds (one-handed)
2. ✅ All three phases (core flow, admin, PWA) are functional
3. ✅ Docker deployment works with persistent data
4. ✅ No friction: zero logins, confirmations, or interruptions
5. ✅ Feels like a native app (full-screen PWA, instant transitions)

---

## 8. Open Questions (Resolved)

All ambiguities from PRD review have been resolved. Implementation can proceed with confidence.

---

**Next Steps:**
1. Initialize git repository
2. Create feature branch with git worktree
3. Generate detailed implementation plan with file-by-file tasks
4. Begin Phase 1 (backend) implementation

---

**End of Design Document**
