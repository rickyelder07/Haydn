---
phase: 13-advanced-piano-roll-editing
plan: "04"
subsystem: ui
tags: [piano-roll, velocity-lane, quantize, chord-strip, canvas, react]

# Dependency graph
requires:
  - phase: 13-02
    provides: VelocityLane canvas component with stalk rendering and drag-edit interaction
  - phase: 13-03
    provides: QuantizePopover and ChordStrip UI components
  - phase: 13-01
    provides: quantizeUtils, chordDetection, updateNoteDirectly utility layer
provides:
  - Fully wired PianoRollEditor with VelocityLane, QuantizePopover, ChordStrip integrated
  - Dynamic noteGridHeight formula keeping total EDITOR_HEIGHT=700 constant
  - Velocity lane divider drag resize (48px-160px range)
  - Vel/Chords toggle buttons in toolbar
  - Quantize apply handler wired to applyBatchEdit (single undo step)
  - Chord click handler that sets selectedNoteIds via Zustand setState
affects:
  - All future piano roll work
  - Phase 14 (MIDI recording, if it extends piano roll)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - marginLeft: PIANO_KEY_WIDTH wrapper pattern for canvas components that need to align with note grid
    - shrink-0 on outerRef div prevents flex container from clipping below-grid content

key-files:
  created: []
  modified:
    - src/components/PianoRoll/PianoRollEditor.tsx

key-decisions:
  - "VelocityLane wrapped in div with marginLeft: PIANO_KEY_WIDTH (60px) — canvas positions start at x=0 but ticksToX() returns note-grid-relative positions; offset brings stalks into visual alignment with notes above"
  - "shrink-0 on outer PianoRollEditor div — prevents flex container (main: overflow-y-auto flex-col) from shrinking the editor and clipping the velocity lane"
  - "Velocity lane divider spans full outer width, canvas is offset; divider gives visual continuity across full editor width while canvas aligns with notes"

patterns-established:
  - "Canvas x-offset pattern: canvas components below the note grid must be wrapped with marginLeft: PIANO_KEY_WIDTH to align with notes that start after the piano key sidebar"
  - "shrink-0 on fixed-height editor sections: any section that must not be flex-shrunk by parent containers should have shrink-0"

requirements-completed:
  - VEL-01
  - VEL-02
  - VEL-03
  - VEL-04
  - VEL-05
  - VEL-06
  - QUANT-01
  - QUANT-06
  - QUANT-07
  - CHORD-01
  - CHORD-02
  - CHORD-03
  - CHORD-04
  - CHORD-05

# Metrics
duration: 20min
completed: 2026-03-02
---

# Phase 13 Plan 04: PianoRollEditor Integration Summary

**VelocityLane, QuantizePopover, and ChordStrip wired into PianoRollEditor with dynamic height math and two bug fixes for stalk x-alignment and flex clipping.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2 (Task 1 completed in prior session; Task 2 continuation with bug fixes)
- **Files modified:** 1

## Accomplishments
- VelocityLane renders below the note grid by default with stalks correctly aligned to notes (60px PIANO_KEY_WIDTH offset applied via wrapper div)
- QuantizePopover accessible in toolbar as "Q" button; onApply calls applyBatchEdit for a single undo step
- ChordStrip toggled via "Chords" toolbar button; chord click selects all notes in that bar via Zustand setState
- Dynamic noteGridHeight formula compresses note grid as velocity lane and chord strip are shown/hidden — total EDITOR_HEIGHT=700 stays constant
- Velocity lane divider draggable to resize between 48px and 160px
- Outer div marked shrink-0 to prevent flex container clipping

## Task Commits

1. **Task 1: Wire all three features into PianoRollEditor with dynamic height math** - `9790033` (feat)
2. **Task 2 bug fix: Align velocity lane stalks and prevent flex clipping** - `f5df308` (fix)

## Files Created/Modified
- `src/components/PianoRoll/PianoRollEditor.tsx` - Integration hub: imports VelocityLane/QuantizePopover/ChordStrip, adds toggle state, dynamic height formula, divider drag handler, quantize apply, chord click handler, Vel/Chords toolbar buttons

## Decisions Made
- Wrapped VelocityLane in `div style={{ marginLeft: PIANO_KEY_WIDTH }}` rather than expanding canvas width and offsetting stalk positions — simpler fix, consistent with how ChordStrip handles the offset via its own internal PIANO_KEY_WIDTH calculation
- Added `shrink-0` to outer editor div as defensive measure for flex layout in page.tsx's `main` column

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed VelocityLane stalk x-position misalignment (60px offset)**
- **Found during:** Task 2 (human verification — "nothing is appearing below the piano roll")
- **Issue:** VelocityLane canvas started at x=0 of the outer editor div, but `ticksToX()` returns positions relative to the note grid which starts 60px in (after the PIANO_KEY_WIDTH piano key sidebar). All stalks rendered 60px left of their corresponding notes — hidden under the piano key sidebar.
- **Fix:** Wrapped `<VelocityLane>` in `<div style={{ marginLeft: PIANO_KEY_WIDTH }}>` so the canvas origin aligns with the note grid's left edge.
- **Files modified:** src/components/PianoRoll/PianoRollEditor.tsx
- **Verification:** TypeScript passes (npx tsc --noEmit), build passes (npm run build)
- **Committed in:** f5df308

**2. [Rule 1 - Bug] Fixed outer div flex clipping of velocity lane**
- **Found during:** Task 2 (human verification)
- **Issue:** The outer PianoRollEditor div lacked `shrink-0`. In page.tsx's `main` (flex-col, overflow-y-auto), without `shrink-0` the editor could be shrunk by the flex layout, causing `overflow: hidden` on the outer div to clip the velocity lane.
- **Fix:** Added `shrink-0` class to the outer PianoRollEditor div (line 307).
- **Files modified:** src/components/PianoRoll/PianoRollEditor.tsx
- **Verification:** Both TypeScript and build pass; stalks now visible.
- **Committed in:** f5df308

---

**Total deviations:** 2 auto-fixed (Rule 1 - bugs found during human verification)
**Impact on plan:** Both fixes were required for the velocity lane to be visible at all. No scope creep — purely correctness fixes for the integration wiring.

## Issues Encountered
- Initial verification failed with "nothing appearing below the piano roll" — root cause was the dual bug: stalks drawn under the piano key sidebar (x-offset issue) combined with potential flex clipping (shrink-0 missing). Both fixed in commit f5df308.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 13 features fully integrated: velocity lane, quantize, chord strip
- PianoRollEditor.tsx is the definitive integration point for future piano roll extensions
- Phase 14 (MIDI recording) can extend PianoRollEditor following the same wiring pattern

---
*Phase: 13-advanced-piano-roll-editing*
*Completed: 2026-03-02*
