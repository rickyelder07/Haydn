---
phase: 13-advanced-piano-roll-editing
plan: "03"
subsystem: ui
tags: [react, typescript, piano-roll, quantize, chord-detection, tailwind]

# Dependency graph
requires:
  - phase: 13-01
    provides: quantizeUtils.ts (QuantizeParams, gridTicksForValue), chordDetection.ts (DetectedChord), gridUtils.ts (PIANO_KEY_WIDTH, ticksToX)
provides:
  - QuantizePopover.tsx — popover UI with grid/strength/threshold/swing controls and Apply callback
  - ChordStrip.tsx — 24px DOM strip with clickable chord label buttons aligned to bar positions
affects:
  - 13-04 (wires QuantizePopover and ChordStrip into PianoRollEditor)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Popover local state pattern — isOpen/controls in useState, no Zustand persistence for ephemeral UI
    - Click-outside via useRef + document mousedown listener + cleanup on unmount
    - Viewport culling for DOM-based positional strips — skip elements where x + width < 0 or x > viewport
    - PIANO_KEY_WIDTH offset on chord strip — strip left-pads by 60px so labels align with note grid, not piano keys

key-files:
  created:
    - src/components/PianoRoll/QuantizePopover.tsx
    - src/components/PianoRoll/ChordStrip.tsx
  modified: []

key-decisions:
  - "QuantizePopover state is local useState (not Zustand) — popover open/close and control values are ephemeral UI, no persistence needed"
  - "ChordStrip is purely presentational — receives pre-computed DetectedChord[] from parent, no internal computation"
  - "Threshold slider capped at 50% max — prevents excluding all notes from quantization"

patterns-established:
  - "Popover pattern: trigger button + absolute positioned panel in relative wrapper div + click-outside ref cleanup"
  - "Chord strip alignment: PIANO_KEY_WIDTH (60px) left offset ensures chord labels align over note grid, not piano key sidebar"

requirements-completed: [QUANT-01, QUANT-02, QUANT-03, QUANT-04, QUANT-05, QUANT-06, QUANT-07, CHORD-01, CHORD-02, CHORD-03, CHORD-04, CHORD-05]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 13 Plan 03: QuantizePopover and ChordStrip Components Summary

**Popover quantization controls (grid/strength/threshold/swing + Apply) and DOM-based chord symbol strip with PIANO_KEY_WIDTH-aligned bar labels**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T20:40:00Z
- **Completed:** 2026-03-02T20:41:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- QuantizePopover with trigger button (Q), 4 controls (grid selector + 3 range sliders), Apply button that calls onApply(QuantizeParams) and closes popover
- Click-outside-to-close via wrapperRef + document mousedown listener with proper cleanup
- ChordStrip 24px strip with absolutely positioned chord buttons aligned using ticksToX + PIANO_KEY_WIDTH offset
- Both components export named props interface and default export — ready for Plan 04 wiring

## Task Commits

Each task was committed atomically:

1. **Task 1: Create QuantizePopover.tsx** - `48671b3` (feat)
2. **Task 2: Create ChordStrip.tsx** - `9680e09` (feat)

## Files Created/Modified
- `src/components/PianoRoll/QuantizePopover.tsx` - Quantization controls popover: trigger button, grid/strength/threshold/swing controls, amber Apply button
- `src/components/PianoRoll/ChordStrip.tsx` - Chord symbol strip: 24px height, PIANO_KEY_WIDTH offset, viewport culling, clickable bar-aligned labels

## Decisions Made
- QuantizePopover state is local useState (not Zustand) — popover open/close and slider values are ephemeral UI state, no persistence needed
- ChordStrip is purely presentational — receives pre-computed DetectedChord[] array, no internal chord detection
- Threshold max capped at 50 (not 100) — prevents the edge case where all notes are within threshold and nothing gets quantized

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- QuantizePopover and ChordStrip are standalone, TypeScript-clean, and ready to be imported into PianoRollEditor in Plan 04
- Plan 04 will wire both components: add quantize action to projectStore/editStore, connect QuantizePopover trigger to toolbar, mount ChordStrip above the note grid, implement onChordClick to select notes by bar

---
*Phase: 13-advanced-piano-roll-editing*
*Completed: 2026-03-02*
