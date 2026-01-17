# Exercise Performance Trends & History Tracking Design

**Date**: 2026-01-17
**Feature**: Add maintenance-focused exercise trends and history tracking

## Overview

Add exercise-level progress tracking to help users over 55 maintain strength and fitness safely. Focus on consistency and safe progression rather than personal records or max-outs that could lead to injury.

## Philosophy: Maintenance Over Max-Out

**Target User**: Adults 55+ focused on maintaining muscle mass and strength, not competitive goals.

**Key Principles**:
- Celebrate "maintaining" as success, not just improvement
- Avoid incentivizing risky behavior (going too heavy, maxing out)
- Focus on volume and consistency over intensity
- Provide awareness without judgment
- Quick at-a-glance understanding for gym use

## Core Concept - Maintenance-Focused Trends

### Trend Calculation

**Comparison Method**:
- Compare last 8 workout sessions vs. previous 8 sessions for that exercise
- Session-based (not calendar-based) - works with irregular schedules
- Calculate average metric for each period
- Requires minimum 16 total sessions before showing trend

**Trend Determination**:
- If last 8 avg is >10% higher than previous 8: ↗️ **Improving**
- If last 8 avg is >10% lower than previous 8: ↘️ **Declining**
- Within ±10%: → **Maintaining**
- Less than 16 sessions: null (not enough data)

**Why 10% Threshold**:
- Prevents over-reacting to normal variation
- Tolerant of day-to-day fluctuations
- "Maintaining" is appropriately wide range

### Metrics by Exercise Type

Different exercise types track different metrics for progress:

| Template Type | Metric | Calculation |
|--------------|--------|-------------|
| **strength** | Total volume | weight × reps × sets |
| **bodyweight** | Total reps | reps × sets |
| **cardio** | Distance covered | metric_1 (miles) |
| **cardio_machine** | Calories burned | metric_4 (calories) |
| **timed** | Total duration | metric_1 (seconds) |

**Why These Metrics**:
- **Strength volume**: Safe progression - can improve via reps OR sets, not just weight
- **Bodyweight reps**: Simple total work measurement
- **Cardio distance**: Consistency metric, not speed/pace (avoids going too hard)
- **Calories**: For ergometer/machines, already calculated metric
- **Duration**: For timed exercises like planks, simple endurance measure

## UI Integration - Where Trends Appear

### Changes to Existing Pages

**Daily Progress Report** (`/progress/:date`):
- Exercise names become **clickable links**
- Click navigates to Exercise History page
- Visual: subtle underline on hover, distinct color
- No other changes - keeps existing clean layout

**Exercise Entry Page** (`/entry/:exerciseId`):
- **No changes to main flow** - stays focused on logging
- Already shows last 3 workouts for context
- Optional: Add subtle "View History →" link below recent logs
- Avoids clutter during active workout sessions

**Main Progress Calendar** (`/progress`):
- **No changes** - calendar remains the primary focus
- Exercise trends accessed only by drilling down

### New Exercise History Page

**Route**: `/progress/exercise/:exerciseId`

**Layout Structure**:

1. **Header Section**:
   - Exercise name (large, prominent)
   - Category color indicator (left border or badge)
   - Back button to return to previous page

2. **Trend Indicator** (prominent card at top):
   - Large arrow emoji: ↗️ ↘️ →
   - Status text:
     - ↗️ "Improving" (green background)
     - → "Maintaining" (blue/neutral background)
     - ↘️ "Declining" (orange background, not red - less judgmental)
   - Context text: "Based on your last 8 vs previous 8 workouts"
   - If < 16 sessions: Gray background, "Keep logging to see your trend (need X more workouts)"

3. **Metric Summary**:
   - What we're tracking: "Tracking total volume: 2,100 lbs avg"
   - Recent avg vs previous avg display
   - Percentage change (if trend exists)

4. **Chronological Log List**:
   - Last 30 workout entries for this exercise
   - Same format as daily report:
     - Date
     - Formatted metrics (using existing formatMetrics utility)
     - Timestamp
     - Notes (if any)
   - Category color left border for visual consistency
   - Reverse chronological (newest first)

5. **Navigation**:
   - Back button (uses browser history)
   - Optional: Link to log another entry

**Visual Style**:
- Consistent with existing dark mode (Pico.css variables)
- Reuse existing component patterns
- Mobile-first: large touch targets, readable text
- Fast loading: no charts, simple lists

## API Endpoints & Data Requirements

### New API Endpoint

**`GET /api/progress/exercise/:exerciseId`**

Returns exercise details, trend calculation, and recent logs.

**Response Format**:
```json
{
  "exercise": {
    "id": 5,
    "name": "Resistance band hammer curls",
    "template_type": "strength",
    "category_name": "Bodyweight",
    "category_color": "#ef4444"
  },
  "trend": {
    "direction": "improving",
    "recent_avg": 2100,
    "previous_avg": 1800,
    "percent_change": 16.7,
    "session_count": 18
  },
  "logs": [
    {
      "id": 123,
      "metric_1": 70,
      "metric_2": 10,
      "metric_3": 3,
      "metric_4": null,
      "notes": "green band and black band",
      "created_at": "2026-01-17T16:10:27Z"
    }
  ]
}
```

**Trend Object Fields**:
- `direction`: "improving" | "maintaining" | "declining" | null
- `recent_avg`: Average metric for last 8 sessions
- `previous_avg`: Average metric for previous 8 sessions (sessions 8-15)
- `percent_change`: ((recent - previous) / previous) × 100
- `session_count`: Total sessions logged for this exercise
- If `session_count` < 16, `direction` = null (not enough data)

### Backend Implementation

**Query for Trend Calculation**:
```sql
SELECT metric_1, metric_2, metric_3, metric_4, created_at
FROM logs
WHERE exercise_id = ?
ORDER BY created_at DESC
LIMIT 16
```

**Query for Log Display**:
```sql
SELECT
  l.id,
  l.metric_1,
  l.metric_2,
  l.metric_3,
  l.metric_4,
  l.notes,
  l.created_at
FROM logs l
WHERE l.exercise_id = ?
ORDER BY l.created_at DESC
LIMIT 30
```

**Metric Calculation Logic** (per session):

```javascript
function calculateMetric(templateType, log) {
  switch(templateType) {
    case 'strength':
      return (log.metric_1 || 0) * (log.metric_2 || 0) * (log.metric_3 || 0);
    case 'bodyweight':
      return (log.metric_1 || 0) * (log.metric_2 || 0);
    case 'cardio':
      return log.metric_1 || 0;
    case 'cardio_machine':
      return log.metric_4 || 0;
    case 'timed':
      return log.metric_1 || 0;
    default:
      return 0;
  }
}
```

**Trend Direction Logic**:

```javascript
function determineTrend(recentAvg, previousAvg) {
  const percentChange = ((recentAvg - previousAvg) / previousAvg) * 100;

  if (percentChange > 10) return 'improving';
  if (percentChange < -10) return 'declining';
  return 'maintaining';
}
```

**Algorithm**:
1. Fetch last 16 logs for exercise
2. Calculate metric for each log based on template type
3. Skip logs with null/incomplete metrics
4. If less than 16 valid logs, return trend = null
5. Split into two groups: recent (0-7), previous (8-15)
6. Calculate average for each group
7. Determine trend direction based on 10% threshold
8. Calculate percentage change
9. Return trend object

### Database Changes

**No schema changes required**:
- All data exists in current `logs` and `exercises` tables
- Calculation happens in application layer

**Optional Performance Optimization**:
- Add composite index: `CREATE INDEX idx_logs_exercise_created ON logs(exercise_id, created_at DESC)`
- Improves query speed for exercise-specific log fetching
- Particularly useful as log count grows

## Frontend Components & Implementation

### New React Components

**1. `/src/pages/ExerciseHistory.jsx`**

Main page component for exercise history view.

```jsx
function ExerciseHistory() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useAPI(`/api/progress/exercise/${exerciseId}`);

  return (
    <main className="container">
      <header>
        <h1>{data?.exercise.name}</h1>
        <button onClick={() => navigate(-1)}>← Back</button>
      </header>

      {data?.trend && <TrendIndicator trend={data.trend} templateType={data.exercise.template_type} />}

      <div className="logs-list">
        {data?.logs.map(log => <LogEntry key={log.id} log={log} />)}
      </div>
    </main>
  );
}
```

**2. `/src/components/TrendIndicator.jsx`**

Displays trend arrow, status, and context.

Props:
- `trend`: Trend object from API
- `templateType`: For displaying what metric is tracked

Renders:
- Arrow emoji (↗️ → ↘️) + status text
- Background color based on direction
- Context text: "Based on your last 8 vs previous 8 workouts"
- Metric explanation: "Tracking total volume: 2,100 lbs avg"
- Percentage change (if trend exists)
- "Not enough data" state for null trends

Visual Styles:
- Improving: green background (`--pico-primary-background`), upward arrow
- Maintaining: blue/neutral background, right arrow
- Declining: orange background, downward arrow
- Null: gray background, info icon

**3. Updates to `/src/utils/formatMetrics.js`**

Add utility functions:

```javascript
// Calculate metric value for trend
export function calculateTrendMetric(templateType, metrics) {
  switch(templateType) {
    case 'strength':
      return (metrics.metric_1 || 0) * (metrics.metric_2 || 0) * (metrics.metric_3 || 0);
    case 'bodyweight':
      return (metrics.metric_1 || 0) * (metrics.metric_2 || 0);
    case 'cardio':
      return metrics.metric_1 || 0;
    case 'cardio_machine':
      return metrics.metric_4 || 0;
    case 'timed':
      return metrics.metric_1 || 0;
  }
}

// Get human-readable metric name
export function getTrendMetricName(templateType) {
  switch(templateType) {
    case 'strength': return 'total volume';
    case 'bodyweight': return 'total reps';
    case 'cardio': return 'distance';
    case 'cardio_machine': return 'calories burned';
    case 'timed': return 'duration';
  }
}

// Format trend metric for display
export function formatTrendMetric(templateType, value) {
  switch(templateType) {
    case 'strength': return `${value.toLocaleString()} lbs total`;
    case 'bodyweight': return `${value} reps total`;
    case 'cardio': return `${value.toFixed(1)} miles`;
    case 'cardio_machine': return `${value} calories`;
    case 'timed': return formatDuration(value);
  }
}
```

### Updates to Existing Components

**DailyWorkout.jsx** (`/src/pages/DailyWorkout.jsx`):

Change exercise name from `<div>` to `<Link>`:

```jsx
// Before:
<div style={exerciseNameStyle}>{log.exercise_name}</div>

// After:
<Link
  to={`/progress/exercise/${log.exercise_id}`}
  style={exerciseNameStyle}
>
  {log.exercise_name}
</Link>
```

Add hover styling:
- Underline on hover
- Cursor pointer
- Distinct color to indicate clickability

**Optional Enhancement - EntryView.jsx**:

Below the recent 3 logs, add subtle link:

```jsx
<Link to={`/progress/exercise/${exerciseId}`} style={viewHistoryStyle}>
  View History →
</Link>
```

Style: Small, muted text, right-aligned

### Routing Updates

In `/src/App.jsx`, add route:

```jsx
<Route path="/progress/exercise/:exerciseId" element={<ExerciseHistory />} />
```

### Styling Approach

**Reuse Existing Patterns**:
- Log list: Same border-left color coding as daily report
- Cards: Same background/border as existing components
- Typography: Consistent font sizes and weights
- Spacing: Maintain existing rhythm

**Dark Mode**:
- All colors use Pico.css CSS variables
- Trend backgrounds:
  - Improving: `--pico-primary-background` with opacity
  - Maintaining: `--pico-secondary-background`
  - Declining: Custom orange with opacity
  - Null: `--pico-muted-color` with low opacity

**Mobile-First**:
- Trend card: Full width, min 60px height
- Arrow emoji: 1.5-2em size
- Touch targets: Min 44x44px
- Readable text: 1rem minimum

## Edge Cases & Error Handling

### Data Scenarios

**1. Not Enough History (< 16 sessions)**:
- Trend direction: null
- Display: "Keep logging to see your trend"
- Show session count: "You have 8 workouts logged. 8 more needed for trends."
- Still display log history - useful even without trend
- Encourage without pressure

**2. Exactly 8 Sessions**:
- Can't calculate previous 8
- Same as "not enough data" state
- Message: "Keep going! 8 more workouts will show your trend"

**3. Irregular Workout Patterns**:
- Large time gaps between sessions don't matter
- Session-based calculation handles this naturally
- Works with real-life schedules

**4. Many Logs (50+ workouts)**:
- Only fetch last 30 for display
- Trend calculated on most recent 16 only
- No pagination needed
- Good performance

**5. Frequently Changing Resistance/Weight**:
- Total volume metric smooths variation naturally
- Lighter weight + more reps = similar volume
- Trend shows "maintaining" which is accurate
- Reflects actual progression appropriately

**6. Missing or Null Metrics**:
- Skip logs with incomplete data in calculations
- Example: bodyweight exercise with null reps
- Display log in history but mark as incomplete
- Prevents bad data from skewing trends
- May need more than 16 logs to get 16 valid ones

**7. All Zeros (valid but unusual)**:
- Treat as valid data point
- Might indicate testing/warm-up
- Include in calculations
- User responsibility to log accurately

**8. Very Small Changes (< 10%)**:
- Show as "maintaining"
- This is intentional - celebrates consistency
- Avoids micro-optimization anxiety

### Error States

**API Failures**:
- Exercise history fetch fails: Show error with retry button
- Message: "Unable to load exercise history"
- Use existing error handling pattern from `useAPI` hook
- Maintain navigation - back button still works

**Invalid Exercise ID**:
- URL like `/progress/exercise/999` where exercise doesn't exist
- Backend returns 404
- Frontend redirects to `/progress`
- Optional: Show toast notification "Exercise not found"

**Network Issues**:
- Offline mode: Show cached data if available (via service worker)
- No cache: Show friendly offline message
- Retry button when connection restored

**Browser Navigation**:
- Back button uses `navigate(-1)` - returns to source page
- Works from daily report, entry page, or direct link
- Maintains scroll position in lists

**Concurrent Data Changes**:
- User logs new workout in another tab
- Exercise history may be stale until refresh
- Not critical - trend doesn't need real-time updates
- Next page load will show updated trend

## Mobile Optimization & Performance

### Mobile-First Design

**Exercise History Page**:
- Trend indicator: Large card, easy to read at-a-glance
- Arrow emoji: 1.5-2em, visible from arm's length
- Text: Minimum 1rem, high contrast
- Single column layout, full width on mobile

**Clickable Exercise Names**:
- Touch target: Entire exercise card, not just text
- Padding ensures easy tapping (44x44px minimum)
- Visual feedback: Background change on tap
- No accidental taps - sufficient spacing

**Log List**:
- Same mobile optimization as daily report
- Scrollable if many entries
- No horizontal scroll
- Thumb-friendly spacing

### Performance Targets

**Page Load**:
- Exercise history API call: <50ms (indexed query)
- Trend calculation: Server-side, ~5-10ms
- Page render: <200ms (consistent with existing pages)
- Total time to interactive: <500ms

**Data Efficiency**:
- Fetch only 30 logs for display (not entire history)
- Trend uses 16 logs maximum
- Response payload: 2-5KB typical
- Works on slow gym WiFi

**Database Performance**:
- Composite index on (exercise_id, created_at)
- Query execution: <10ms even with thousands of logs
- No joins required for trend calculation
- Lightweight aggregation

### Caching Strategy

**Service Worker**:
- Cache exercise history pages after first visit
- Trend data refreshes on each request
- Offline viewing of previously loaded pages
- Consistent with existing PWA caching

**API Response**:
- No aggressive caching (trend should be current)
- Standard cache-control headers
- Fresh data on each visit

### Battery Consideration

**No Background Activity**:
- No auto-refresh or polling
- Static data once loaded
- No timers or intervals
- Respects device resources during workout

**Minimal CPU**:
- Trend calculation: Simple arithmetic
- No complex algorithms
- No animations (except CSS transitions)
- Efficient rendering

## Implementation Phases

### Phase 1: Backend API
- Create `/api/progress/exercise/:exerciseId` endpoint
- Implement trend calculation logic
- Add metric calculation functions
- Test with various exercise types
- Add composite index for performance

### Phase 2: Exercise History Page
- Create `ExerciseHistory.jsx` page component
- Create `TrendIndicator.jsx` component
- Add utility functions to `formatMetrics.js`
- Add route to App.jsx
- Basic styling (no trend yet, just log list)

### Phase 3: Trend Display
- Integrate trend calculation display
- Add visual indicators (arrows, colors)
- Implement "not enough data" state
- Add context text and explanations
- Test with real data

### Phase 4: Link Integration
- Update `DailyWorkout.jsx` to make exercise names clickable
- Add hover states and visual feedback
- Test navigation flow
- Optional: Add link to entry page

### Phase 5: Polish & Testing
- Refine mobile responsive design
- Test all edge cases
- Performance optimization
- Cross-browser testing
- User testing (at gym, real scenario)

## Testing Strategy

### Manual Testing Scenarios

**Trend Calculation**:
- Exercise with < 16 logs (no trend)
- Exercise with exactly 16 logs (first trend)
- Exercise with 50+ logs (mature data)
- Exercise with improving trend
- Exercise with maintaining trend
- Exercise with declining trend

**Different Exercise Types**:
- Test strength exercise (volume calculation)
- Test bodyweight exercise (reps calculation)
- Test cardio exercise (distance)
- Test cardio_machine exercise (calories)
- Test timed exercise (duration)

**Data Quality**:
- Logs with missing metrics
- Logs with zero values
- Logs with very large values
- Mixed valid and invalid logs

**Navigation**:
- Click from daily report → exercise history → back
- Direct URL access to exercise history
- Invalid exercise ID in URL
- Browser back/forward buttons

**Mobile**:
- Test on actual mobile device at gym
- Check readability at arm's length
- Verify touch targets work with sweaty fingers
- Test on slow network

### Edge Case Testing

- User with no workout history
- User with only 1 exercise logged
- Exercise deleted while viewing history
- API timeout/failure scenarios
- Offline mode functionality

## Success Metrics

**User Experience**:
- Can view exercise trend in < 3 taps from home
- Trend visible and understandable at-a-glance
- Page loads in < 500ms on mobile
- No confusion about what metric is tracked

**Technical**:
- API response time < 50ms
- Zero database schema changes required
- No new dependencies added
- Works offline with service worker

**Behavioral**:
- Encourages consistent logging (need 16 sessions)
- Celebrates "maintaining" as success
- Doesn't incentivize risky max-outs
- Provides awareness without judgment
