# Suggested Combinations Feature

## Overview

Create a new sidebar section that suggests activity combinations based on proximity, priority, and travel time. Support drag-and-drop of entire combinations to schedule multiple events at once.

## Implementation Steps

### 1. Create Combinations Service (`frontend/src/services/combinations-service.ts`)

New service to generate suggested combinations:

- **Core algorithm**:
  - **Priority filtering**: Only include events with `TriplanPriority.must` (1), `TriplanPriority.high` (10), or `TriplanPriority.maybe` (2)
  - **Exclude**: `TriplanPriority.least` (3) and `TriplanPriority.unset` (0)
  - **Combination requirement**: Each combination must contain at least one "must" priority event
  - **Activity ordering**: Use greedy nearest-neighbor algorithm starting from highest priority event to minimize travel time and backtracking
  - Group events within 30 minutes travel time
  - Shopping days: up to 12 hours (unlimited events from CATEGORY.SHOPPING)
  - Other combinations: 2-6 events max, up to 12 hours total
  - **Travel time calculation**: Use `eventStore.distanceResults` if available, fallback to Haversine air distance calculation (similar to clustering-service.ts)
  - **Combination ranking**: Prioritize combinations with multiple "must" events first
- **Key methods**:
  - `generateCombinations(events, distanceResults, calendarEvents)` - main algorithm
  - `isShoppingCategory(event, categories)` - identify shopping events
  - `calculateCombinationDuration(events, distanceResults)` - sum durations + travel time
  - `hasScheduledEvents(combination, calendarEvents)` - check if any events already scheduled
- **Output**: Array of `SuggestedCombination` objects with event order, total duration, and scheduled flag

### 2. Add TypeScript Interfaces (`frontend/src/utils/interfaces.ts`)

```typescript
export interface SuggestedCombination {
  id: string;
  events: SidebarEvent[]; // ordered
  totalDuration: number; // in minutes
  travelTimeBetween: number[]; // travel time between consecutive events
  hasScheduledEvents: boolean; // if any event is on calendar
  isShoppingDay: boolean;
  suggestedName: string; // e.g., "Shopping Day", "Must-See Tour"
}
```

### 3. Update EventStore (`frontend/src/stores/events-store.ts`)

Add observable state for combinations:

- `@observable suggestedCombinations: SuggestedCombination[] = []`
- `setSuggestedCombinations(combinations)` action
- Computed property `suggestedCombinationsComputed` (filters based on sidebar search/filters)

### 4. Add Sidebar Group (`frontend/src/components/triplan-sidebar/triplan-sidebar.tsx`)

- Add `SUGGESTED_COMBINATIONS` to `SidebarGroups` enum
- Position: top of sidebar (before categories)

### 5. Create Combinations Component (`frontend/src/components/triplan-sidebar/sidebar-suggested-combinations/sidebar-suggested-combinations.tsx`)

New component to display combinations:

- Renders each combination as a draggable card
- Shows: combination name, event count, total duration, travel time warning
- **Visual indicators**:
  - Yellow warning badge if `hasScheduledEvents === true` with tooltip: "Contains scheduled activities - dropping may change your calendar"
  - Shopping bag icon for shopping days
  - Clock icon showing total duration
- Event list preview (collapsible)
- Use `fc-event` class for FullCalendar drag-drop compatibility

### 6. Implement Drag-Drop Handler (`frontend/src/components/triplan-calendar/triplan-calendar.tsx`)

Extend `onEventReceive` to handle combination drops:

- Detect if dragged item is a combination (check data attribute or ID format)
- Extract drop date/time from FullCalendar info
- Schedule events sequentially:
  - Event 1: starts at drop time
  - Event 2: starts at Event 1 end + travel time
  - Continue for all events in order
- **Handle scheduled events**: Reschedule all events in combination (including already-scheduled ones)
- Remove all combination events from sidebar
- Recalculate combinations after drop

### 7. Calculation Triggers

Recalculate combinations when:

- Sidebar events added/removed/modified
- Calendar events added/removed (affects scheduled status)
- After combination drop to calendar
- User clicks manual recalculate button (optional)

Add to `TriplanSidebarCategories` (similar to clustering calculation):

```typescript
useEffect(() => {
  const combinations = CombinationsService.generateCombinations(
    eventStore.allEventsFilteredWithSidebarSearchComputed,
    eventStore.distanceResults,
    eventStore.calendarEvents,
    eventStore.categories
  );
  eventStore.setSuggestedCombinations(combinations);
}, [eventStore.sidebarEvents, eventStore.calendarEvents]);
```

### 8. Translation Keys (`frontend/src/locale/en.json`, `he.json`)

Add keys:

- `SUGGESTED_COMBINATIONS.TITLE`: "Suggested Combinations"
- `SUGGESTED_COMBINATIONS.SHOPPING_DAY`: "Shopping Day"
- `SUGGESTED_COMBINATIONS.MUST_SEE_TOUR`: "Must-See Activities"
- `SUGGESTED_COMBINATIONS.CONTAINS_SCHEDULED`: "Contains scheduled activities - dropping may change your calendar"
- `SUGGESTED_COMBINATIONS.TOTAL_TIME`: "Total time: {TIME}"
- `SUGGESTED_COMBINATIONS.EVENT_COUNT`: "{COUNT} activities"

### 9. Styling (`frontend/src/components/triplan-sidebar/sidebar-suggested-combinations/sidebar-suggested-combinations.scss`)

- Card-style layout for combinations
- Drag handle visual
- Warning badge styling (yellow/amber)
- Hover effects
- Event list preview styles

## Key Files to Modify

- `frontend/src/services/combinations-service.ts` (new)
- `frontend/src/utils/interfaces.ts`
- `frontend/src/stores/events-store.ts`
- `frontend/src/components/triplan-sidebar/triplan-sidebar.tsx`
- `frontend/src/components/triplan-sidebar/sidebar-suggested-combinations/sidebar-suggested-combinations.tsx` (new)
- `frontend/src/components/triplan-sidebar/sidebar-suggested-combinations/sidebar-suggested-combinations.scss` (new)
- `frontend/src/components/triplan-calendar/triplan-calendar.tsx`
- `frontend/src/components/triplan-sidebar/sidebar-categories/triplan-sidebar-categories.tsx`
- `frontend/src/locale/en.json`
- `frontend/src/locale/he.json`

## Algorithm Details

**Combination Generation**:

1. Filter sidebar events to:
   - Unscheduled events with valid locations
   - Priority in [must (1), high (10), maybe (2)] only
   - Exclude: least (3) and unset (0)

2. Identify all "must" priority events as potential combination seeds

3. For each "must" event (seed):
   a. Start combination with this seed event
   b. Find compatible nearby events using greedy nearest-neighbor:
      - Within 30 min travel time from last added event
      - Same priority filtering (must/high/maybe only)
      - Total combination duration ≤ 6 hours
      - Order by: highest priority first, then nearest distance
   c. Add events sequentially until no more compatible events found
   d. Special case: shopping events can form unlimited-size "shopping day" (≤ 12h)

4. Rank combinations by quality:
   - Prioritize combinations with multiple "must" events
   - Secondary: total number of events
   - Tertiary: minimize total travel time

5. Remove duplicate combinations (same event set regardless of order)

6. Mark combinations containing any scheduled events with warning badge

7. Generate descriptive names based on content (e.g., "Shopping Day", "Must-See Tour")

**Drag-Drop Flow**:

1. User drags combination to calendar time slot
2. Parse drop location (date/time)
3. Create calendar events in sequence with travel time gaps
4. Remove events from sidebar
5. Trigger combination recalculation
6. Update UI