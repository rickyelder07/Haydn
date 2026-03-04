---
phase: 14-midi-hardware-integration
plan: 04
subsystem: ui
tags: [midi, react, zustand, typescript, transport, recording, page, header]

# Dependency graph
requires:
  - phase: 14-01
    provides: midiInputStore foundation, MidiInputEngine singleton
  - phase: 14-02
    provides: startRecordingWithCountIn, commitRecording, handleMidiEvent pipeline
  - phase: 14-03
    provides: MidiConnectButton component, TransportStrip arm button and recording indicator
provides:
  - MidiConnectButton wired into page.tsx header (renders when project loaded)
  - TransportStrip arm-aware play/stop: handlePlayClick routes to startRecordingWithCountIn or commitRecording+stop based on armed state
  - Complete MIDI hardware integration end-to-end across plans 14-01 through 14-04
affects:
  - Human verification of full MIDI recording flow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Arm-aware play button: isArmed+stopped → startRecordingWithCountIn, isArmed+playing → commitRecording+stop, else normal togglePlayPause
    - Stop button commits recording before stopping if armed+recording in progress
    - MidiConnectButton placed before NewProjectButton in header flex row

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/components/TimelineRuler/TransportStrip.tsx

key-decisions:
  - "handlePlayClick routes to startRecordingWithCountIn when armed+stopped — play button doubles as record+play trigger when armed"
  - "handlePlayClick calls commitRecording+stop when armed+playing — play/pause button becomes stop-and-commit when recording"
  - "handleStopClick always calls stop, but first calls commitRecording if armed+recording — ensures notes are never lost on stop"
  - "MidiConnectButton placed first in header right flex row (before NewProjectButton) — MIDI control grouped with project-level actions"

patterns-established:
  - "Arm-aware transport pattern: wrap transport action handlers with isArmed branching to route to recording store actions"

requirements-completed: [MIDI-05, MIDI-06, MIDI-07, MIDI-08, MIDI-09, MIDI-10, MIDI-11, MIDI-12, MIDI-13]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 14 Plan 04: MIDI Hardware Integration Wiring Summary

**MidiConnectButton in page.tsx header + arm-aware handlePlayClick/handleStopClick in TransportStrip completing end-to-end MIDI hardware recording flow**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-04T18:30:09Z
- **Completed:** 2026-03-04T18:33:00Z
- **Tasks:** 1 automated (Task 2 is human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- MidiConnectButton imported and rendered in page.tsx header right section, gated on `project` loaded state — appears between nothing and NewProjectButton
- TransportStrip gains `startRecordingWithCountIn`, `commitRecording` from midiInputStore and `selectedTrackIndex` from useEditStore
- `handlePlayClick`: when armed+stopped triggers count-in recording flow; when armed+playing commits and stops; otherwise normal play/pause
- `handleStopClick`: when armed+recording commits notes before stopping; otherwise normal stop
- TypeScript compiles with zero errors; Next.js production build passes

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire MidiConnectButton into header and arm-aware play/stop flow** - `4f2d883` (feat)

**Plan metadata:** pending final docs commit

## Files Created/Modified

- `src/app/page.tsx` - Added MidiConnectButton import + render before NewProjectButton in project-loaded header
- `src/components/TimelineRuler/TransportStrip.tsx` - Added useEditStore import, startRecordingWithCountIn + commitRecording subscriptions, handlePlayClick + handleStopClick arm-aware handlers, updated play/stop onClick bindings

## Decisions Made

- **handlePlayClick acts as stop-and-commit when armed+playing** — The play button semantically becomes "stop recording" when armed and already recording, which is the most natural UX: the same button that started recording stops it
- **handleStopClick always guards with isArmed+isRecording check** — Belt-and-suspenders: ensures notes are committed even if the user hits stop instead of play to end recording
- **MidiConnectButton first in header row** — Groups MIDI connection alongside project-level toolbar actions (New Project, Export) for consistent placement

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `src/app/page.tsx` MidiConnectButton import — FOUND (line 18)
- `src/app/page.tsx` `<MidiConnectButton />` in header — FOUND (line 124)
- `src/components/TimelineRuler/TransportStrip.tsx` handlePlayClick — FOUND (lines 67-81)
- `src/components/TimelineRuler/TransportStrip.tsx` handleStopClick — FOUND (lines 83-88)
- `src/components/TimelineRuler/TransportStrip.tsx` startRecordingWithCountIn + commitRecording — FOUND (lines 60-61)
- Commit `4f2d883` — FOUND
- `npx tsc --noEmit` — PASS (zero errors)
- `npm run build` — PASS

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Browser MIDI permission prompt appears at runtime when the MIDI connect button is clicked.

## Next Phase Readiness

- Phase 14 is complete upon human verification of the full MIDI hardware integration flow
- All 4 plans (14-01 foundation, 14-02 event pipeline, 14-03 UI components, 14-04 wiring) complete
- No further automated work required — Task 2 is a human-verify checkpoint

---
*Phase: 14-midi-hardware-integration*
*Completed: 2026-03-04*
