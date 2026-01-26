---
phase: 02-audio-playback-engine
plan: 02
completed: 2026-01-26
duration: 2.4 minutes

subsystem: audio-playback

tags:
  - audio
  - playback
  - tone.js
  - scheduling
  - transport

tech-stack:
  added:
    - Tone.Part (note scheduling)
    - Tone.Transport (playback control)
  patterns:
    - Singleton pattern for PlaybackController
    - Observer pattern for state/position updates
    - Lookahead scheduling via Tone.Part
    - Module-level state for instrument reuse

key-files:
  created:
    - src/audio/utils/timeConversion.ts
    - src/audio/playback/NoteScheduler.ts
    - src/audio/playback/PlaybackController.ts
  modified: []

requires:
  - 02-01 (AudioEngine and InstrumentFactory)
  - 01-01 (HaydnProject type definitions)

provides:
  - Core playback logic with play/pause/stop
  - Time conversion utilities (ticks ↔ seconds)
  - Tempo handling and live adjustment
  - Position tracking at 20fps
  - Note scheduling to Tone.Transport

affects:
  - 02-03 (Transport UI will use PlaybackController)
  - 02-04 (Visual feedback will subscribe to position updates)

decisions:
  - "Tone.Part for scheduling": Uses Tone.js Part API for efficient note scheduling with built-in lookahead
  - "20fps position tracking": Updates position every 50ms for smooth UI without excessive overhead
  - "Tempo lookahead 0.1s": Schedules tempo changes 100ms ahead for smooth transitions
  - "Instrument reuse": Keeps instruments loaded in Map for faster play/pause cycles
  - "Auto-stop at end": Stops and resets to start when reaching end of track per CONTEXT.md
  - "40-240 BPM range": Wide tempo range for experimental use cases per CONTEXT.md
---

# Phase 02 Plan 02: Playback Logic Core Summary

**One-liner:** Core playback engine with Tone.js Transport scheduling, tempo handling, and 20fps position tracking

## What Was Built

Implemented the core playback logic that converts MIDI projects to scheduled audio events using Tone.js:

**1. Time Conversion Utilities** (`src/audio/utils/timeConversion.ts`)
- `ticksToSeconds`: Converts MIDI ticks to seconds with tempo event interpolation
- `secondsToTicks`: Reverse conversion for seeking functionality
- `ticksToBarsBeat`: Musical time display (bars:beats:sixteenths)
- `formatTime`: mm:ss display formatting
- `midiToNoteName`: MIDI number to Tone.js note format (e.g., 60 → "C4")

**2. NoteScheduler** (`src/audio/playback/NoteScheduler.ts`)
- Schedules all notes from HaydnProject to Tone.Transport using Tone.Part
- Handles MIDI tempo events via `Transport.bpm.setValueAtTime()`
- Reuses instruments across tracks with same GM program number
- Module-level state maintains loaded instruments between play/pause cycles
- `clearScheduledNotes()` for cleanup, `disposeAllInstruments()` for project changes

**3. PlaybackController** (`src/audio/playback/PlaybackController.ts`)
- Singleton pattern for global playback state management
- `loadProject()`: Initializes audio and schedules notes
- `play()/pause()/stop()`: Control Tone.Transport
- `seekTo(seconds)`: Timeline navigation
- `setTempo(bpm)`: Live tempo adjustment with 0.1s lookahead (40-240 BPM range)
- Position tracking at 20fps (50ms interval) for smooth UI updates
- Observer pattern: `onStateChange()`, `onPositionChange()`, `onEnd()` listeners
- Auto-stop and reset at end of track per CONTEXT.md

## Key Technical Decisions

**Tone.Part for scheduling** - Uses Tone.js Part API instead of manual scheduling. Tone.Part handles lookahead scheduling internally, simplifying the implementation and ensuring precise timing.

**20fps position tracking** - Updates position every 50ms via setInterval. This provides smooth UI updates without excessive computation. The 50ms interval is imperceptible to users while being lightweight enough for background operation.

**Tempo lookahead** - Schedules tempo changes 100ms ahead using `Transport.bpm.setValueAtTime(now + 0.1)`. This prevents glitches during live tempo adjustments by giving the audio engine time to smoothly transition.

**Instrument reuse pattern** - Maintains a Map of loaded instruments keyed by GM program number. When multiple tracks use the same instrument (e.g., piano on tracks 1 and 3), they share the same instrument instance. This reduces memory usage and improves performance.

**Module-level state** - NoteScheduler uses module-level variables (`scheduledParts`, `loadedInstruments`) instead of class instances. This ensures a single source of truth for scheduled notes across the application while maintaining cleanup capabilities.

**Tempo event handling** - Converts MIDI tempo events to Tone.js time using `ticksToSeconds` with tempo interpolation. Initial tempo set via `Transport.bpm.value`, subsequent changes via `Transport.bpm.setValueAtTime(timeInSeconds)` for accurate tempo automation.

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Consumes:**
- `AudioEngine` (02-01): Handles Tone.start() for autoplay policy
- `InstrumentFactory` (02-01): Creates instruments for each GM program
- `HaydnProject` types (01-01): Source data structure for scheduling

**Provides:**
- `getPlaybackController()`: Singleton access for UI components
- `ticksToSeconds()`, `formatTime()`: Time utilities for display components
- State/position/end event listeners: Observer pattern for React components

**Next Steps:**
- Plan 02-03 will build Transport UI using PlaybackController
- Plan 02-04 will add visual feedback (playhead, note highlighting) using position updates
- Plans 02-05/02-06 will add tempo controls and metronome using setTempo()

## Files Changed

**Created:**
- `src/audio/utils/timeConversion.ts` (128 lines) - Time conversion utilities
- `src/audio/playback/NoteScheduler.ts` (121 lines) - Note scheduling logic
- `src/audio/playback/PlaybackController.ts` (254 lines) - Playback state management

**Modified:** None

## Success Criteria

- [x] Time conversion utilities handle tempo events correctly
- [x] NoteScheduler schedules all notes from HaydnProject to Tone.Transport
- [x] PlaybackController provides play/pause/stop/seekTo with state management
- [x] Tempo can be adjusted during playback (40-240 BPM range)
- [x] Position tracking updates at 20fps for smooth UI
- [x] End-of-track behavior stops and resets to start
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] Build succeeds (`npm run build`)

## Testing Notes

**Manual testing ready for next plan:**
- Transport UI (Plan 02-03) will enable user interaction testing
- Verify play/pause/stop transitions
- Test tempo adjustment during playback (40-240 BPM range)
- Verify end-of-track auto-stop behavior
- Test position tracking accuracy

**Known limitations:**
- Position tracking uses approximate tick calculation (simplified, doesn't account for tempo changes during position queries)
- This is acceptable for UI display but may need refinement for precise beat-synchronized effects in future phases

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 139483f | Create time conversion utilities |
| 2 | 384cd32 | Create NoteScheduler for note scheduling |
| 3 | 2b13ccf | Create PlaybackController for playback control |
