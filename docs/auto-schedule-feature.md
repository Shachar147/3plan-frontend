# Auto Schedule Feature Implementation

## Overview

Build a smart auto-scheduling system that automatically places sidebar events into the trip calendar, optimizing for priority, geographic proximity, time preferences, and various constraints.

## Implementation Plan

### 1. Create Auto-Schedule Service

**File**: `frontend/src/services/auto-schedule-service.ts`

Define interfaces and core methods for scheduling logic.

### 2. Add Time Utility Functions

**File**: `frontend/src/utils/time-utils.ts`

Helper functions for duration parsing, date manipulation, and opening hours validation.

### 3. Implement Category Detection

Auto-detect food/hotel/dessert categories by titleKey or translated titles.

### 4. Build Core Scheduling Algorithm

Main scheduling logic with priority sorting, time slot finding, proximity optimization, and constraint handling.

### 5. Create Configuration Modal

**File**: `frontend/src/services/react-modal-service.tsx`

Modal for category selection, hotel selection, and travel buffer configuration.

### 6. Implement Preview Mode

Temporary state for scheduled events with action banner (Save/Try Again/Discard).

### 7. Add UI Button

**File**: `frontend/src/components/triplan-sidebar/sidebar-collapsable-menu/triplan-sidebar-collapsable-menu.tsx`

Auto-schedule button in sidebar actions.

### 8. Add Translations

**Files**: `frontend/src/locale/en.json`, `frontend/src/locale/he.json`

All translation keys for UI elements, messages, and errors.

### 9. Testing

End-to-end testing with various scenarios and edge cases.

## Detailed To-dos

- [x] **1. Setup and Interfaces**
    - [x] Create `frontend/src/services/auto-schedule-service.ts` file
    - [x] Define `AutoScheduleConfig` interface
    - [x] Define `SchedulingResult` interface
    - [x] Define helper types for time slots and day schedules

- [x] **2. Time Utility Functions**
    - [x] Add `parseDurationToMinutes(duration: string)` to `time-utils.ts`
    - [x] Add `addMinutesToDate(date: Date, minutes: number)` to `time-utils.ts`
    - [x] Add `getPreferredTimeSlot(preferredTime: TriplanEventPreferredTime)` to `time-utils.ts`
    - [x] Add `isEventOpenOnDay(openingHours, date)` with support for multiple time ranges per day
    - [x] Add `canEventFitInTimeRange(startTime, duration, rangeStart, rangeEnd)` helper

- [x] **3. Category Detection**
    - [x] Implement `detectCategories(eventStore)` function
    - [x] Check for 'CATEGORY.FOOD' titleKey
    - [x] Check for 'CATEGORY.HOTELS' titleKey
    - [x] Check for 'CATEGORY.DESSERTS' titleKey
    - [x] Add fallback checks for translated titles (אוכל, בתי מלון, קינוחים)
    - [x] Implement `getHotelEvents(eventStore, hotelCategoryId)` function

- [x] **4. Core Scheduling Algorithm - Setup**
    - [x] Create `scheduleEvents(eventStore, config)` main function
    - [x] Implement day initialization logic (create time slots for each day)
    - [x] Implement hotel placement logic (08:00-09:00 each day)
    - [x] Add randomness seed/mechanism for "Try Again" feature

- [x] **5. Core Scheduling Algorithm - Event Sorting**
    - [x] Sort events by `prioritiesOrder` array
    - [x] Group events by priority tier
    - [x] Implement MUST distribution logic (ensure each day gets at least one MUST)

- [x] **6. Core Scheduling Algorithm - Time Slot Finding**
    - [x] Check opening hours for each event
    - [x] Handle multiple time ranges per day for opening hours
    - [x] Apply preferred time constraints (morning: 09:00-12:00, noon: 12:00-15:00, etc.)
    - [x] Calculate event end time based on duration
    - [x] Validate event fits within day limits

- [x] **7. Core Scheduling Algorithm - Proximity Optimization**
    - [x] Get travel time from `eventStore.distanceResults`
    - [x] Implement Haversine distance fallback
    - [x] Add travel buffer (configurable minutes)
    - [x] Score slots by proximity to already scheduled events
    - [x] Prefer same-day clustering of nearby events

- [x] **8. Core Scheduling Algorithm - Constraints**
    - [x] Implement food-after-food prevention (hard constraint)
    - [x] Allow food-to-dessert and dessert-to-food combinations
    - [x] Implement closed venue detection (hard constraint)
    - [x] Implement soft preference for not exceeding 23:00
    - [x] Allow night events to extend to 00:00

- [x] **9. Core Scheduling Algorithm - Conflict Handling**
    - [x] Track unscheduled events
    - [x] Generate warning messages for conflicts
    - [x] Return `SchedulingResult` with scheduled/unscheduled events and warnings

- [x] **10. Configuration Modal - Structure**
    - [x] Create `openAutoScheduleConfigModal(eventStore)` in `react-modal-service.tsx`
    - [x] Design modal layout with sections
    - [x] Add category detection and pre-fill detected categories
    - [x] Create dropdown for Food Category
    - [x] Create dropdown for Dessert Category
    - [x] Create dropdown for Hotel Category

- [x] **11. Configuration Modal - Hotel Selection**
    - [x] Add conditional hotel selection section
    - [x] Populate dropdown with hotel events from selected category
    - [x] Show/hide based on hotel category selection

- [x] **12. Configuration Modal - Summary and Buffer**
    - [x] Display count of events to be scheduled
    - [x] Display trip date range
    - [x] Add travel buffer input (default 30, min 0, max 120)
    - [x] Validate buffer input

- [x] **13. Configuration Modal - Validation and Actions**
    - [x] Implement `validateConfig(config)` function
    - [x] Disable "Schedule Events" button when fields are missing
    - [x] Show validation error messages
    - [x] Add warning for missing hotel events
    - [x] Implement Cancel button
    - [x] Implement Schedule Events button with config storage

- [ ] **14. Preview Mode - State Management**
    - [ ] Add preview state to eventStore for scheduled events
    - [ ] Store original config for "Try Again"
    - [ ] Implement preview event rendering (different styling/opacity)
    - [ ] Prevent preview events from saving to backend

- [ ] **15. Preview Mode - Action Banner**
    - [ ] Create action banner component/section above calendar
    - [ ] Implement "Save Schedule" action (commit to backend)
    - [ ] Implement "Try Again" action (re-run with new random seed)
    - [ ] Implement "Discard Changes" action (clear preview)
    - [ ] Display warnings/notifications in banner

- [x] **16. UI Integration - Button**
    - [x] Add `renderAutoScheduleButton()` to `sidebar-collapsable-menu.tsx`
    - [x] Check for unscheduled events before showing button
    - [x] Add button to `renderActions()` after `renderClearAll()`
    - [x] Handle trip locked state
    - [x] Add fa-magic icon

- [x] **17. Translations**
    - [x] Add all AUTO_SCHEDULE keys to `en.json`
    - [x] Add all AUTO_SCHEDULE keys to `he.json`
    - [x] Add button text translations
    - [x] Add modal UI translations
    - [x] Add error/warning message translations
    - [x] Add action banner translations

- [ ] **18. Testing and Refinement**
    - [ ] Test with trips containing only MUSTs
    - [ ] Test with mixed priority events
    - [ ] Test with events having various preferred times
    - [ ] Test with venues having split opening hours
    - [ ] Test food/dessert constraint logic
    - [ ] Test proximity clustering
    - [ ] Test "Try Again" randomness (generates different schedules)
    - [ ] Test preview mode and all banner actions
    - [ ] Test with missing distance data
    - [ ] Test edge cases (no hotels, no events, locked trip, etc.)

## Key Implementation Details

### Priority Order

Use `prioritiesOrder` from `enums.ts`: must, high, maybe, least, unset

### Preferred Time Mapping

- morning (1): 09:00-12:00
- noon (2): 12:00-15:00
- afternoon (3): 15:00-18:00
- sunset (4): 18:00-19:30
- evening (5): 19:30-22:00
- night (7): 22:00-00:00
- nevermind (6) / unset (0): no preference

### Duration Format

"HH:MM" format (e.g., "01:30" = 1.5 hours)

### Opening Hours

Array of time ranges per day, can have multiple periods (e.g., split shifts)

### Distance Calculation

Use `getCoordinatesRangeKey()` and `eventStore.distanceResults`, fallback to Haversine distance

