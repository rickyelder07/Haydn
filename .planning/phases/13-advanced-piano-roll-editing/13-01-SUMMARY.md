---
phase: 13-advanced-piano-roll-editing
plan: 01
subsystem: ui
tags: [piano-roll, quantization, chord-detection, tonal, zustand, midi]

# Dependency graph
requires:
  - phase: 03-piano-roll
    provides: PianoRollEditor canvas, gridUtils, HaydnNote types
  - phase: 05-nl-editing
    provides: editStore with applyBatchEdit and history management
provides:
  - Pure quantization math (quantizeNote, gridTicksForValue, QuantizeParams)
  - Tonal-based per-bar chord detection (detectChordsPerBar, formatChordSymbol, DetectedChord)
  - Non-history velocity update action (updateNoteDirectly) in editStore
affects: [13-02, 13-03, 13-04, VelocityLane, QuantizePopover, ChordStrip]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure utility modules (no side effects) imported by Wave 2 component plans
    - updateNoteDirectly pattern for real-time drag without per-event undo entries

key-files:
  created:
    - src/components/PianoRoll/quantizeUtils.ts
    - src/components/PianoRoll/chordDetection.ts
  modified:
    - src/state/editStore.ts

key-decisions:
  - "quantizeNote threshold guard returns originalTicks unchanged when within thresholdPct of grid — avoids over-quantizing already-close notes"
  - "updateNoteDirectly bypasses _history.push entirely — consumers must call updateNote on mouseup for the single undo entry"
  - "formatChordSymbol returns null for slash chords (inversions) — ChordStrip only displays root-position chords"
  - "detectChordsPerBar requires 3+ notes per bar — prevents false positives on sparse bars"

patterns-established:
  - "Threshold guard pattern: pure functions return original value unchanged when change is below threshold"
  - "Direct-vs-history split: updateNoteDirectly for drag frames, updateNote on mouseup for undo"

requirements-completed: [QUANT-02, QUANT-03, QUANT-04, QUANT-05, QUANT-07, CHORD-02, VEL-05]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 13 Plan 01: Utility Layer Summary

**Pure quantization math (swing + threshold + strength), tonal chord detection per bar, and non-history velocity update action — the complete utility layer for Wave 2 piano roll components.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-02T20:26:51Z
- **Completed:** 2026-03-02T20:30:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created `quantizeUtils.ts` with `quantizeNote()` (swing, threshold guard, strength interpolation) and `gridTicksForValue()` for all note values including triplets
- Created `chordDetection.ts` with `detectChordsPerBar()` (tonal Chord.detect, 3+ note guard, non-slash preference) and `formatChordSymbol()` (type map to short display names)
- Added `updateNoteDirectly` to editStore — writes directly to projectStore without pushing a history entry, enabling smooth real-time velocity drag in VelocityLane

## Task Commits

Each task was committed atomically:

1. **Task 1: Create quantizeUtils.ts** - `0a25ea5` (feat)
2. **Task 2: Create chordDetection.ts** - `6a7971f` (feat)
3. **Task 3: Add updateNoteDirectly to editStore** - `54f3768` (feat)

## Files Created/Modified

- `src/components/PianoRoll/quantizeUtils.ts` - Pure quantization math: QuantizeParams interface, quantizeNote(), gridTicksForValue()
- `src/components/PianoRoll/chordDetection.ts` - Tonal-based chord detection: DetectedChord interface, detectChordsPerBar(), formatChordSymbol()
- `src/state/editStore.ts` - Added updateNoteDirectly to EditState interface and create body

## Decisions Made

- Threshold guard returns `originalTicks` unchanged when already within `thresholdPct` of the grid — avoids over-quantizing notes that are already tight
- `updateNoteDirectly` bypasses `_history.push` entirely and does not update `canUndo`/`canRedo` flags — consumers call `updateNote` on mouseup for the single undoable entry
- `formatChordSymbol` returns `null` for slash chords (inversions) so ChordStrip only displays root-position chords
- `detectChordsPerBar` requires 3+ notes per bar to avoid false positives on sparse/melodic bars

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled clean after each task. Production build (`npm run build`) passed with zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 plans (VelocityLane, QuantizePopover, ChordStrip) can now import from quantizeUtils.ts, chordDetection.ts, and editStore.updateNoteDirectly
- All three utility exports are type-safe and compile clean
- tonal v6.4.3 confirmed working in production build

## Self-Check: PASSED

- FOUND: `src/components/PianoRoll/quantizeUtils.ts`
- FOUND: `src/components/PianoRoll/chordDetection.ts`
- FOUND: commit `0a25ea5` (quantizeUtils.ts)
- FOUND: commit `6a7971f` (chordDetection.ts)
- FOUND: commit `54f3768` (updateNoteDirectly)
- FOUND: `updateNoteDirectly` in both EditState interface and create body (2 occurrences)

---
*Phase: 13-advanced-piano-roll-editing*
*Completed: 2026-03-02*
