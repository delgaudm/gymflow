# Progress Analytics & Workout Tracking Design

**Date**: 2026-01-17
**Feature**: Add workout analytics and progress tracking to GymFlow

## Overview

Add a Progress section to GymFlow that provides a 30-day rolling calendar view of workout activity, with clickable days that show detailed workout reports. This feature surfaces workout consistency patterns and provides easy access to historical workout data.

## Navigation Changes (Hamburger Menu)

### Current State
Homepage has an "Admin" button in the top-right corner that links to `/admin`.

### Proposed Changes
Replace the Admin button with a hamburger icon (☰) in the top-right. When clicked, a dropdown overlay slides down showing two menu items:
- **Progress** → links to `/progress`
- **Admin** → links to `/admin`

### Implementation Details
- Hamburger button stays visible on all pages for consistent navigation
- Dropdown dismisses when clicking outside or selecting an item
- Uses Pico.css built-in styling and CSS variables for dark mode consistency
- Mobile-optimized tap target (44x44px minimum)
- Simple state management with React useState

### Visual Style (Dark Mode)
- Hamburger icon: simple 3-line icon, same styling as existing buttons
- Dropdown background: Pico's `--pico-card-background-color` (dark gray, ~#1c2631)
- Border: subtle `--pico-card-border-color`
- Menu items: full-width links styled as Pico buttons with hover state
- Shadow: subtle dark shadow for depth (`box-shadow: 0 8px 16px rgba(0,0,0,0.3)`)
- Matches existing dark aesthetic throughout GymFlow

## Progress Page - Calendar Grid

### Route
`/progress`

### Page Structure

**Summary Statistic**:
- "X workouts in last 30 days" - simple count of days with logged exercises

**Calendar Grid Layout**:
- 5-6 rows (weeks) × 7 columns (days) = ~35 cells to cover 30 days
- Each cell represents one day
- Cells show the day number (1-31)
- Grid starts from 30 days ago and ends today
- Today's date is highlighted with border or styling

**Cell Visual States**:
- **Green cell** (`--pico-primary-background`): Day has logged workouts - clickable
- **Gray cell** (muted dark gray): No workout logged - not clickable, no hover effect
- Green cells have `cursor: pointer` and subtle hover effect

**Clicking a Green Cell**:
- Navigates to `/progress/YYYY-MM-DD` (e.g., `/progress/2026-01-15`)
- Shows the daily workout report for that date

**Mobile Optimization**:
- Grid responsive: cells scale to fit mobile width
- Minimum cell size: 44x44px for touch targets
- Grid gap: 4-8px for easy tapping

**Data Source**:
- API endpoint: `GET /api/progress/calendar?days=30`
- Returns array of dates with workout counts for the last 30 days

## Daily Workout Report Page

### Route
`/progress/:date` (e.g., `/progress/2026-01-15`)

### Page Header

**Date Display**: Large, prominent header showing the date (e.g., "Wednesday, January 15, 2026")

**Navigation Bar** with four elements:
- **Back button**: "← Progress" - returns to `/progress` calendar view
- **Previous day arrow**: "←" - navigates to previous day (even if no workout)
- **Next day arrow**: "→" - navigates to next day (even if no workout)
- **Home button**: "⌂ Home" or "Home" - returns to main logging page `/`

**Navigation Behavior**:
- Previous/Next arrows cycle through all days, not just workout days
- If navigating to a day with no workout, show "No workout logged" message
- Arrows wrap within reasonable bounds (or disable at boundaries)
- All navigation uses React Router for proper browser back/forward behavior

### Workout Report Content

Display a list/table of exercises logged that day with summary metrics.

**Format** (one entry per exercise):
- Exercise name (bold or prominent)
- Summary metrics based on template type:
  - **Strength**: `225 lbs × 5 reps × 3 sets`
  - **Cardio**: `3.5 miles in 28:30`
  - **Cardio Machine**: `Level 8, Incline 5, 30:00, 350 cal`
  - **Timed**: `15:00`
  - **Bodyweight**: `12 reps × 4 sets`

**Visual Style**:
- Simple table or list (Pico.css styled)
- Category color indicator (left border or dot) for each exercise
- Timestamp showing when logged (e.g., "8:45 AM")
- Clean, scannable layout optimized for mobile

**Data Source**:
- API endpoint: `GET /api/progress/daily/:date`
- Returns all logs for that date with exercise and category details

## API Endpoints & Data Requirements

### New API Endpoints

**1. `GET /api/progress/calendar?days=30`**

Returns workout activity for the last N days (default 30).

Response format:
```json
{
  "days": [
    { "date": "2026-01-17", "workout_count": 5 },
    { "date": "2026-01-16", "workout_count": 0 },
    { "date": "2026-01-15", "workout_count": 3 }
  ],
  "total_workout_days": 18
}
```

Query:
```sql
SELECT DATE(created_at) as date, COUNT(DISTINCT exercise_id) as workout_count
FROM logs
WHERE created_at >= date('now', '-30 days')
GROUP BY DATE(created_at)
```

**2. `GET /api/progress/daily/:date`**

Returns all workout logs for a specific date (e.g., `/api/progress/daily/2026-01-15`).

Response format:
```json
{
  "date": "2026-01-15",
  "logs": [
    {
      "id": 123,
      "exercise_id": 5,
      "exercise_name": "Bench Press",
      "category_name": "Chest",
      "category_color": "#EF4444",
      "template_type": "strength",
      "metrics": { "weight": 225, "reps": 5, "sets": 3 },
      "created_at": "2026-01-15T08:45:00Z"
    }
  ]
}
```

Query joins `logs`, `exercises`, and `categories` tables, filtered by `DATE(created_at) = :date`.

### Database Changes

**No schema changes required**:
- All data exists in current `logs`, `exercises`, and `categories` tables
- Uses existing `created_at` timestamps for date filtering
- Uses existing `template_type` for formatting metrics display

**Performance**:
- Add index on `logs.created_at` if not already present
- Calendar query scans max 30 days of data
- Daily query returns typically 3-10 exercises

## Frontend Components & State Management

### New React Components

**1. `<HamburgerMenu />`** - Reusable navigation component
- Props: none (self-contained)
- State: `isOpen` boolean for dropdown visibility
- Renders on every page by moving to `App.jsx` layout
- Click outside handler to close dropdown

**2. `<ProgressCalendar />`** - 30-day calendar grid
- Props: `calendarData` (from API)
- Renders grid with day cells
- Handles click events on workout days
- Calculates grid layout (5-6 weeks)
- Uses `useNavigate` from React Router

**3. `<DailyReport />`** - Workout report for specific date
- Props: `date` (from URL params)
- Fetches data via `useAPI` hook
- Renders exercise list with formatted metrics
- Navigation arrows and back button

**4. `<MetricsSummary />`** - Formats exercise metrics
- Props: `templateType`, `metrics`
- Returns formatted string based on template type
- Handles all 5 template types

### New Pages

**1. `/src/pages/Progress.jsx`**
- Fetches calendar data with `useAPI('/api/progress/calendar?days=30')`
- Renders summary stat + `<ProgressCalendar />`

**2. `/src/pages/DailyWorkout.jsx`**
- Uses `useParams()` to get date from URL
- Fetches data with `useAPI('/api/progress/daily/:date')`
- Renders `<DailyReport />`

### Routing Updates

In `App.jsx`:
```jsx
<Route path="/progress" element={<Progress />} />
<Route path="/progress/:date" element={<DailyWorkout />} />
```

### Shared Utilities
- `formatDate(dateString)` - converts ISO to readable format
- `formatMetrics(templateType, metrics)` - reusable across components

## Styling & Visual Design

### Calendar Grid CSS

```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  max-width: 500px;
  margin: 2rem auto;
}

.calendar-day {
  aspect-ratio: 1;
  min-height: 44px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.calendar-day.has-workout {
  background: var(--pico-primary-background);
  cursor: pointer;
  transition: opacity 0.2s;
}

.calendar-day.has-workout:hover {
  opacity: 0.8;
}

.calendar-day.no-workout {
  background: var(--pico-muted-color);
  opacity: 0.3;
}

.calendar-day.today {
  border: 2px solid var(--pico-primary);
}
```

### Hamburger Dropdown CSS

```css
.hamburger-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--pico-card-background-color);
  border: 1px solid var(--pico-card-border-color);
  border-radius: var(--pico-border-radius);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  min-width: 150px;
  z-index: 1000;
}

.hamburger-dropdown a {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition: background 0.2s;
}

.hamburger-dropdown a:hover {
  background: var(--pico-primary-background);
}
```

### Daily Report CSS

```css
.daily-report-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.exercise-log {
  border-left: 4px solid var(--category-color);
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--pico-card-background-color);
  border-radius: 4px;
}

.exercise-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.exercise-metrics {
  color: var(--pico-muted-color);
  font-size: 0.9rem;
}
```

### Color Consistency
- Uses Pico.css CSS variables throughout for automatic dark mode support
- Category colors from existing database
- Green workout days use primary color
- All spacing uses rem units for accessibility

## Edge Cases & Error Handling

### Edge Cases

**1. No workouts in 30-day window**
- Show calendar with all gray cells
- Display: "0 workouts in last 30 days"
- Message: "Start logging workouts to see your progress!"

**2. Navigating to future dates**
- Previous/Next arrows should not go beyond today
- Disable "Next" button if already viewing today
- URL guard: redirect future dates back to `/progress`

**3. Navigating to dates outside 30-day window**
- Allow viewing but show indicator: "This date is outside your 30-day window"

**4. Invalid date formats in URL**
- `/progress/invalid-date` → redirect to `/progress` with error toast
- Validate date format: `YYYY-MM-DD`

**5. Days with many exercises (>10)**
- Scrollable list on mobile
- No pagination needed

**6. Clicking hamburger menu on any page**
- Menu works identically on all pages
- Optional: highlight current page in dropdown

### Error States

**1. API failures**
- Calendar fetch fails: Show error message, retry button
- Daily report fetch fails: Show "Unable to load workout data"
- Use existing error handling pattern from `useAPI` hook

**2. Empty states**
- Day with no workout: "No workout logged on this day"
- Distinguish from API errors with different messaging

**3. Loading states**
- Calendar: Show loading spinner while fetching
- Daily report: Show loading state during navigation
- Keep existing GymFlow pattern of simple "Loading..." text

### Browser Navigation
- Back button from daily report → returns to calendar
- Back button from calendar → returns to home
- Use proper React Router practices

## Mobile Optimization & PWA

### Mobile-First Design

**1. Touch Targets**
- All calendar cells: minimum 44x44px
- Hamburger menu button: 48x48px
- Previous/Next arrows: 44x44px minimum
- Adequate spacing between elements (8px+ gaps)

**2. Responsive Breakpoints**
- Calendar grid scales naturally (7 equal columns)
- Very small screens (<350px): reduce font size slightly
- Navigation buttons stack vertically if needed
- Daily report: single column, full width

**3. One-Thumb Navigation**
- Hamburger menu in top-right (right-handed thumb zone)
- Calendar cells large enough for thumb tapping
- Navigation arrows positioned for easy access
- No horizontal scrolling required

### PWA Integration

**1. Offline Support**
- Cache calendar data for 30 days in service worker
- Cache daily reports as user views them
- Show "offline" indicator if API unreachable
- Cached data allows progress review without connection

**2. Install Prompt**
- Progress page works seamlessly in installed PWA
- Uses existing manifest

**3. Performance**
- Calendar loads in <200ms
- Daily report transitions <200ms
- Optional: prefetch adjacent days when viewing daily report

### Accessibility

**1. Keyboard Navigation**
- Calendar cells focusable via Tab key
- Enter key activates workout day cells
- Hamburger menu keyboard-accessible

**2. Screen Readers**
- ARIA labels on calendar cells: "January 15, 5 exercises logged"
- Semantic HTML: `<nav>`, `<main>`, `<article>`

### Performance Targets
- Calendar page load: <1s
- Day-to-day navigation: <200ms
- API response times: <50ms

## Implementation Plan

### Phase 1: Backend API
- Create `/api/progress/calendar` endpoint with 30-day query
- Create `/api/progress/daily/:date` endpoint with date filtering
- Add database index on `logs.created_at` if needed
- Test endpoints with sample data

### Phase 2: Hamburger Menu
- Create `<HamburgerMenu />` component
- Replace Admin button in `Home.jsx` header
- Add menu to App.jsx layout so it appears on all pages
- Test dropdown open/close, click outside behavior

### Phase 3: Progress Calendar Page
- Create `<ProgressCalendar />` component with grid layout
- Create `/src/pages/Progress.jsx` page
- Add route to App.jsx
- Integrate API call and render calendar
- Add "X workouts in last 30 days" summary
- Test clicking workout days navigates correctly

### Phase 4: Daily Report Page
- Create `<MetricsSummary />` component for formatting
- Create `<DailyReport />` component
- Create `/src/pages/DailyWorkout.jsx` page
- Add route with `:date` param
- Implement navigation (back, prev, next, home)
- Test all 5 template types display correctly

### Phase 5: Styling & Polish
- Add CSS for calendar grid, dropdown, daily report
- Ensure dark mode consistency
- Mobile responsive testing
- Edge case handling (empty states, errors)

## Testing Strategy

### Manual Testing
- Test full flow: Home → Menu → Progress → Calendar → Daily Report → Navigation
- Test on mobile device/emulator
- Test with empty database (0 workouts)
- Test with 30+ days of workout data
- Test date navigation edge cases

### Data Scenarios
- No workouts in 30 days
- Partial data (10 workouts in 30 days)
- Full data (workout every day)
- All 5 template types in one day
- Very old dates in URL

### Browser Testing
- Chrome/Safari on mobile
- Test as installed PWA
- Test offline behavior

## Deployment Checklist
- Frontend build (`npm run build`)
- Backend restart to load new API endpoints
- Database index creation (if needed)
- Test in production environment
- Clear service worker cache if necessary
