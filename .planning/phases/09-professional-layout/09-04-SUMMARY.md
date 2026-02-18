---
phase: 09-professional-layout
plan: 04
subsystem: ui
tags: [canvas, timeline, playhead, drag, seek, piano-roll, react, zustand, daw]

requires:
  - phase: 09-03
    provides: "TimelineRuler: canvas ruler with TransportStrip, scrollX/zoomX sync, tick marks"

provides:
  - "Playhead: draggable cyan triangle with vertical line rendered over timeline ruler"
  - "TimelineRuler: click-to-seek on ruler canvas, playhead position tracking"
  - "PianoRollEditor: handleSeek wiring ticks->seconds->playbackStore.seekTo"

affects:
  - 09-professional-layout
  - future-playback-phases

tech-stack:
  added: []
  patterns:
    - "Incremental drag delta: startX updated each mousemove so deltas are always relative to last position"
    - "Playhead absolute positioning: offset by PIANO_KEY_WIDTH within flex container to align with ruler canvas"
    - "Canvas pointerEvents:none + parent div onClick = clean separation of click handling from rendering"
    - "Tick-to-seconds conversion: (ticks / ppq) * (60 / tempo)"

key-files:
  created:
    - src/components/TimelineRuler/Playhead.tsx
  modified:
    - src/components/TimelineRuler/TimelineRuler.tsx
    - src/components/TimelineRuler/index.ts
    - src/components/PianoRoll/PianoRollEditor.tsx

key-decisions:
  - "Incremental delta on drag (startX updates each move): avoids growing accumulated error on fast drags"
  - "Playhead visibility guard (isPlayheadVisible): only render when ticks-to-pixel position is within visible ruler width"
  - "isPlaying prop accepted but seek is context-agnostic: PlaybackController handles audio state, no special UI branching needed"
  - "Canvas receives pointerEvents:none; parent div handles onClick: prevents canvas capturing clicks that need coordinate calculation"

patterns-established:
  - "Playhead pattern: SVG triangle + CSS div line, window-level mouse events, stopPropagation on mousedown"
  - "Ruler seek pattern: click x + scrollX / pixelsPerTick = absolute tick position with clamp to durationTicks"

duration: 2min
completed: 2026-02-18
---

# Phase 9 Plan 4: Playhead Interaction for Timeline Ruler Summary

**Draggable cyan playhead triangle over timeline ruler with click-to-seek, wired to playbackStore.seekTo via tick-to-seconds conversion**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-18T00:03:28Z
- **Completed:** 2026-02-18T00:05:26Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Playhead.tsx: draggable SVG triangle (cyan-400) with vertical line, window-level mouse events, incremental delta approach
- TimelineRuler updated: click-to-seek on canvas area, playhead rendered absolutely offset by PIANO_KEY_WIDTH, visibility guard prevents rendering off-screen
- PianoRollEditor wired: playbackState/tempo/seekTo subscribed from store, handleSeek converts ticks to seconds

## Task Commits

1. **Task 1: Create Playhead component with drag interaction** - `0be25e3` (feat)
2. **Task 2: Integrate Playhead and click-to-seek in TimelineRuler** - `bb6c9fc` (feat)
3. **Task 3: Connect TimelineRuler playhead to playback store** - `d632814` (feat)

## Files Created/Modified

- `src/components/TimelineRuler/Playhead.tsx` - Draggable playhead triangle and vertical line, window mouse event handling
- `src/components/TimelineRuler/TimelineRuler.tsx` - Added playheadTicks/isPlaying/onSeek/durationTicks props, click-to-seek handler, Playhead render
- `src/components/TimelineRuler/index.ts` - Added Playhead to barrel export
- `src/components/PianoRoll/PianoRollEditor.tsx` - Subscribed to playbackState/tempo/seekTo, added handleSeek, passed all props to TimelineRuler

## Decisions Made

- **Incremental delta drag:** `startX` is updated to `moveEvent.clientX` on each mousemove, so `deltaX` is always the displacement since the last event rather than total drag distance. This prevents growing accumulated error on fast drags across a large pixel range.
- **Playhead visibility guard:** Only render the Playhead DOM node when `playheadX >= 0 && playheadX <= width`. Avoids rendering off-screen elements (minor perf) and prevents the absolutely-positioned triangle from appearing outside the ruler container.
- **Context-agnostic seek:** The `isPlaying` prop is passed through but seek behavior is identical in both states — `PlaybackController.seekTo()` handles audio position whether playing or paused. No special UI branching required.
- **Canvas pointerEvents:none:** The canvas element itself has `pointerEvents: none` so the parent `<div>` receives the `onClick`. This gives accurate `getBoundingClientRect()` coordinates without canvas capturing the event.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Timeline ruler fully interactive: click-to-seek and drag-to-scrub working
- Playhead syncs with piano roll playhead (both read `position.ticks` from playbackStore)
- No blockers for subsequent 09-professional-layout plans

## Self-Check: PASSED

- FOUND: src/components/TimelineRuler/Playhead.tsx
- FOUND: src/components/TimelineRuler/TimelineRuler.tsx (updated)
- FOUND: src/components/TimelineRuler/index.ts (updated)
- FOUND: src/components/PianoRoll/PianoRollEditor.tsx (updated)
- FOUND commit: 0be25e3 (Task 1)
- FOUND commit: bb6c9fc (Task 2)
- FOUND commit: d632814 (Task 3)

---
*Phase: 09-professional-layout*
*Completed: 2026-02-18*
