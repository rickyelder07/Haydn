---
phase: 07-multi-track-support
plan: 03
subsystem: UI Components
tags: [track-list, drag-drop, mute-solo, sortable]
dependency_graph:
  requires: [07-01-trackUIStore]
  provides: [TrackControls, TrackItem, sortable-track-list]
  affects: [TrackList]
tech_stack:
  added: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
  patterns: [sortable-list, inline-controls, drag-handle]
key_files:
  created:
    - src/components/TrackList/TrackControls.tsx
    - src/components/TrackList/TrackItem.tsx
  modified:
    - src/components/TrackList/TrackList.tsx
    - src/components/TrackList/index.ts
decisions:
  - summary: "Drag handle icon uses 6-dot grip pattern"
    rationale: "Clear visual affordance for dragging, follows common design patterns"
  - summary: "Left accent bar for selected track uses border-l-4"
    rationale: "Strong visual indicator without being intrusive"
  - summary: "Mute/solo buttons use stopPropagation on click"
    rationale: "Prevents accidental track selection when toggling controls"
metrics:
  duration: "5m 7s"
  tasks: 3
  commits: 3
  files_created: 2
  files_modified: 2
  completed: "2026-02-09"
---

# Phase 7 Plan 3: Track List UI Components Summary

**One-liner:** Drag-and-drop track reordering with inline mute/solo controls using dnd-kit and TrackItem components.

## What Was Built

Refactored TrackList component with three new sub-components for drag-and-drop reordering and inline track controls:

1. **TrackControls** - Mute and solo buttons with visual state feedback
2. **TrackItem** - Sortable track card component with drag handle
3. **TrackList refactor** - DndContext integration for drag-and-drop reordering

## Task Breakdown

### Task 1: Create TrackControls Component
**Status:** Complete
**Commit:** 59e5cbb

Created TrackControls component with mute and solo buttons:
- Mute button with speaker icon (speaker-slash when muted)
- Solo button with headphones icon
- Visual states: gray/opacity-50 for muted, amber-400 for soloed
- Click handlers use stopPropagation to prevent track selection
- Reads state from trackUIStore (mutedTracks, soloedTracks)
- Inline SVG icons following 02-03 pattern

### Task 2: Create TrackItem Component
**Status:** Complete
**Commit:** 52c68c3

Created TrackItem component with useSortable hook:
- Uses @dnd-kit/sortable for drag-and-drop functionality
- Drag handle with 6-dot grip icon (listeners only on handle, not entire card)
- Left accent bar when selected (border-l-4 border-blue-500)
- Background changes: bg-blue-50 when selected, bg-white otherwise
- Opacity 0.5 when dragging for visual feedback
- Layout: drag handle | track info | TrackControls | stats
- Imports and renders TrackControls component

### Task 3: Refactor TrackList with DndContext
**Status:** Complete
**Commit:** f37269f (from plan 07-04)

Refactored TrackList to use dnd-kit for sortable tracks:
- DndContext wraps track list with closestCenter collision detection
- SortableContext provides vertical list sorting strategy
- Sensors: PointerSensor and KeyboardSensor for accessibility
- handleDragEnd calls trackUIStore.reorderTracks
- Initialize trackOrder on project load via useEffect
- Render TrackItem components in trackOrder order
- Global "Reset Mute/Solo" button above track list
- Updated index.ts to export TrackItem and TrackControls

## Deviations from Plan

### Out-of-Order Execution

**Context:** Plan 07-03 Task 3 (TrackList refactor) was implemented as part of commit f37269f, which was labeled as plan 07-04. This is because plans 07-02, 07-04, and 07-05 were executed before 07-03 was started.

**What happened:**
- Task 1 and Task 2 were completed and committed with proper 07-03 labels (59e5cbb, 52c68c3)
- Task 3 refactor work was done in commit f37269f labeled as 07-04
- The TrackList.tsx file already had DndContext, SortableContext, sensors, handleDragEnd, and trackOrder initialization when 07-03 execution started

**Why this occurred:**
- Multiple plans were being executed in parallel or out of sequence
- Plan 07-04 required the TrackList refactor to integrate AddTrackModal, so it implemented the dnd-kit foundation
- This is fine according to deviation rules - the work got done, just with different commit labels

**Impact:**
- No impact on functionality - all Task 3 requirements were met
- Verification confirms: DndContext wraps list, SortableContext provides strategy, sensors enable drag, trackOrder controls display order
- Only difference: commit f37269f has "07-04" prefix instead of "07-03"

**Files affected:** src/components/TrackList/TrackList.tsx (refactored with dnd-kit)

**Resolution:** Documented in summary. All plan 07-03 requirements are complete and verified.

## Verification Results

All verification criteria passed:

1. ✓ TypeScript compilation succeeds (`npx tsc --noEmit`)
2. ✓ TrackControls has mute and solo buttons that call trackUIStore
3. ✓ TrackItem is sortable with drag handle using useSortable
4. ✓ TrackList wraps items in DndContext and SortableContext
5. ✓ All imports resolve correctly

## Success Criteria

All success criteria met:

- ✓ Tracks display with mute/solo buttons inline
- ✓ Clicking mute/solo toggles visual state and trackUIStore
- ✓ Tracks can be dragged and reordered
- ✓ Selected track has visible accent bar (border-l-4) and background (bg-blue-50)
- ✓ Global reset button clears all mute/solo states

## Key Decisions

1. **Drag handle icon pattern:** Used 6-dot grip icon for clear visual affordance. Common pattern users recognize as draggable.

2. **Left accent bar for selection:** Used border-l-4 instead of full border or ring. Provides strong visual indicator without being intrusive or taking up space.

3. **stopPropagation on control buttons:** Prevents accidental track selection when clicking mute/solo buttons. Users expect controls to toggle without changing selection.

4. **Opacity during drag:** Set to 0.5 during drag for clear visual feedback that item is being moved.

## Technical Highlights

**dnd-kit Integration:**
- Modern, accessible replacement for deprecated react-beautiful-dnd
- Keyboard navigation support via KeyboardSensor with sortableKeyboardCoordinates
- Smooth animations via CSS.Transform.toString(transform)

**Component Architecture:**
- TrackItem handles sortable logic and layout
- TrackControls is a pure UI component for mute/solo
- TrackList orchestrates DndContext and track order state
- Clean separation of concerns for maintainability

**Visual Feedback:**
- Drag handle cursor changes: cursor-grab → cursor-grabbing
- Dragging item opacity: 1.0 → 0.5
- Mute state: gray background + opacity-50
- Solo state: amber-400 background
- Selected state: blue left border + blue-50 background

## Self-Check: PASSED

**Created files verified:**
- ✓ FOUND: src/components/TrackList/TrackControls.tsx
- ✓ FOUND: src/components/TrackList/TrackItem.tsx

**Modified files verified:**
- ✓ FOUND: src/components/TrackList/TrackList.tsx (has DndContext and SortableContext)
- ✓ FOUND: src/components/TrackList/index.ts (exports TrackItem and TrackControls)

**Commits verified:**
- ✓ FOUND: 59e5cbb (Task 1: TrackControls component)
- ✓ FOUND: 52c68c3 (Task 2: TrackItem component)
- ✓ FOUND: f37269f (Task 3: TrackList refactor - labeled as 07-04)

**Functionality verified:**
- ✓ TrackControls imports useTrackUIStore and calls toggleMute/toggleSolo
- ✓ TrackItem imports useSortable and applies transform/transition
- ✓ TrackList imports DndContext and SortableContext
- ✓ handleDragEnd function calls reorderTracks
- ✓ trackOrder initialized via useEffect

All verification checks passed.
