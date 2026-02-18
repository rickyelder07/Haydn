---
phase: 09-professional-layout
plan: 03
subsystem: ui
tags: [canvas, transport, timeline, piano-roll, react, zustand, daw]

requires:
  - phase: 09-02
    provides: "PianoRollEditor with toolbar, ZoomControls, NoteInspector"

provides:
  - "TimelineRuler: canvas-based hierarchical tick ruler synced with piano roll scroll/zoom"
  - "TransportStrip: compact play/pause/stop/tempo controls embedded in timeline"
  - "TempoDisplay: click-to-edit inline BPM display (40-240 range)"
  - "Transport controls integrated with piano roll, standalone TransportControls removed from page"

affects:
  - 09-professional-layout
  - future-playback-phases

tech-stack:
  added: []
  patterns:
    - "Canvas ruler with device pixel ratio scaling for crisp rendering"
    - "Hierarchical tick marks: measures (full height), beats (medium), subdivisions (conditional on zoom)"
    - "Transport strip aligned to PIANO_KEY_WIDTH for visual grid alignment"
    - "TempoDisplay: display/edit state toggle with clamp validation"

key-files:
  created:
    - src/components/TimelineRuler/TimelineRuler.tsx
    - src/components/TimelineRuler/TransportStrip.tsx
    - src/components/TimelineRuler/index.ts
    - src/components/TransportControls/TempoDisplay.tsx
  modified:
    - src/components/PianoRoll/PianoRollEditor.tsx
    - src/app/page.tsx

key-decisions:
  - "TransportStrip width set to PIANO_KEY_WIDTH (60px) so ruler ticks align precisely with piano roll grid"
  - "Subdivision ticks only shown when zoomX > 1.5 to avoid visual clutter at lower zoom levels"
  - "TempoDisplay uses monospace font matching transport strip aesthetic"
  - "Loop toggle rendered as disabled placeholder - loop state deferred to future phase"

patterns-established:
  - "TimelineRuler pattern: canvas + dpr scaling + scrollX/zoomX sync = performant ruler for any scroll width"
  - "TransportStrip pattern: compact controls in fixed-width strip aligned to sidebar width"

duration: 5min
completed: 2026-02-17
---

# Phase 9 Plan 3: Timeline Ruler with Integrated Transport Summary

**Canvas-based DAW timeline ruler with hierarchical tick marks and compact transport strip replacing standalone TransportControls panel**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-17T23:56:42Z
- **Completed:** 2026-02-17T24:01:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Canvas timeline ruler renders measure numbers, beat ticks, and subdivision ticks at hierarchical heights
- Transport controls (play/pause/stop/tempo) embedded in compact 60px strip aligned to piano keyboard sidebar
- TempoDisplay with click-to-edit, Enter/Escape/blur save, 40-240 BPM validation
- Standalone TransportControls section removed from page.tsx — transport now lives inside piano roll

## Task Commits

1. **Task 1: Create TempoDisplay with inline editing** - `25fab15` (feat)
2. **Task 2: Create TimelineRuler and TransportStrip components** - `54f2fe7` (feat)
3. **Task 3: Integrate TimelineRuler into PianoRollEditor and remove standalone TransportControls** - `b7e9704` (feat)

## Files Created/Modified

- `src/components/TransportControls/TempoDisplay.tsx` - Click-to-edit tempo with 40-240 BPM range, Enter/Escape/blur handling
- `src/components/TimelineRuler/TimelineRuler.tsx` - Canvas ruler with dpr-aware rendering, hierarchical tick marks, scrollX/zoomX sync
- `src/components/TimelineRuler/TransportStrip.tsx` - Play/pause/stop/tempo in compact 32px strip, aligned to PIANO_KEY_WIDTH
- `src/components/TimelineRuler/index.ts` - Barrel export
- `src/components/PianoRoll/PianoRollEditor.tsx` - Added TimelineRuler import and render above toolbar
- `src/app/page.tsx` - Removed TransportControls import and render block

## Decisions Made

- **TransportStrip width = PIANO_KEY_WIDTH (60px):** The transport strip must match the piano keyboard sidebar width so the ruler ticks align with the piano roll grid. Hard-coded to the exported constant.
- **Subdivision visibility threshold = zoomX > 1.5:** Below this zoom, 16th-note ticks would overlap, so they're hidden. This matches the threshold where beat ticks become meaningfully spaced.
- **Loop toggle disabled:** Loop playback state is not yet implemented in playbackStore. Added a visually-disabled placeholder to establish the UI position for future implementation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

During Task 3 verification, the `npm run build` initially showed a prerender error (`TypeError: Cannot read properties of undefined (reading 'call')`). Investigation revealed this was caused by a cached `.next` build directory conflict from switching between git stash states during investigation, not a code issue. Running a clean build confirmed the error did not persist and the build passes cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Timeline ruler is wired and ready — scrollX and zoomX sync with piano roll ensures ruler tracks correctly during horizontal scroll and zoom
- TransportStrip connected to playbackStore; play/pause/stop/tempo all functional
- Loop toggle placeholder in place, ready for loop range implementation in a future phase
- No blockers for subsequent 09-professional-layout plans

## Self-Check: PASSED

- FOUND: src/components/TransportControls/TempoDisplay.tsx
- FOUND: src/components/TimelineRuler/TimelineRuler.tsx
- FOUND: src/components/TimelineRuler/TransportStrip.tsx
- FOUND: src/components/TimelineRuler/index.ts
- FOUND commit: 25fab15 (Task 1)
- FOUND commit: 54f2fe7 (Task 2)
- FOUND commit: b7e9704 (Task 3)

---
*Phase: 09-professional-layout*
*Completed: 2026-02-17*
