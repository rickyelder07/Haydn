---
phase: 02-audio-playback-engine
plan: 05
subsystem: audio
tags: [tone.js, metronome, count-in, click-track, transport]

# Dependency graph
requires:
  - phase: 02-03
    provides: TransportControls component with play/pause/stop UI
  - phase: 02-02
    provides: PlaybackController with Transport synchronization
provides:
  - Metronome class with downbeat accent (880Hz vs 440Hz)
  - Count-in functionality (1-4 bars) with async/Promise pattern
  - MetronomeToggle UI component for enabling/disabling click track
  - CountInSelect UI component for configuring count-in bars
  - Metronome lifecycle synced with play/pause/stop actions
affects: [02-06-page-integration, future-recording-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MembraneSynth for click track sounds with pitch-based beat differentiation"
    - "Transport.scheduleRepeat for synchronized metronome clicks"
    - "Separate synth instances for metronome vs count-in to avoid conflicts"
    - "Metronome lifecycle synced with playback state in store actions"

key-files:
  created:
    - src/audio/playback/Metronome.ts
    - src/audio/playback/CountIn.ts
    - src/components/TransportControls/MetronomeToggle.tsx
    - src/components/TransportControls/CountInSelect.tsx
  modified:
    - src/state/playbackStore.ts
    - src/components/TransportControls/TransportControls.tsx
    - src/components/TransportControls/index.ts

key-decisions:
  - "MembraneSynth for metronome clicks (better sound than simple oscillator)"
  - "880Hz downbeat vs 440Hz regular beat for audible bar boundaries"
  - "Separate synth for count-in to avoid conflicts with metronome"
  - "Metronome lifecycle synced in store actions (start with play, stop with pause/stop)"
  - "Store-based state for metronomeEnabled and countInBars for persistence across plays"
  - "-6dB metronome volume, -3dB count-in volume to not overpower music"

patterns-established:
  - "Singleton pattern for Metronome class to maintain state across plays"
  - "Store actions sync metronome lifecycle with playback state"
  - "Count-in uses async/Promise pattern with onComplete callback"

# Metrics
duration: 2.4min
completed: 2026-01-26
---

# Phase 2 Plan 5: Metronome and Count-in Summary

**Metronome click track with downbeat accent and configurable 1-4 bar count-in using MembraneSynth, integrated with transport controls**

## Performance

- **Duration:** 2.4 minutes
- **Started:** 2026-01-26T20:49:16Z
- **Completed:** 2026-01-26T20:51:54Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Metronome class with Transport.scheduleRepeat synchronization and downbeat detection (880Hz vs 440Hz)
- Count-in functionality with configurable 1-4 bars, separate synth to avoid conflicts
- UI components (MetronomeToggle, CountInSelect) integrated into TransportControls
- Metronome lifecycle fully synced with play/pause/stop actions in store
- Store state tracking for metronomeEnabled and countInBars

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Metronome class** - `dda5724` (feat)
2. **Task 2: Create CountIn function** - `600159b` (feat)
3. **Task 3: Create UI components, integrate, and sync metronome lifecycle** - `7c956c8` (feat)

## Files Created/Modified
- `src/audio/playback/Metronome.ts` - Singleton metronome with MembraneSynth, downbeat accent, Transport sync
- `src/audio/playback/CountIn.ts` - Count-in with playCountIn and startWithCountIn helpers
- `src/components/TransportControls/MetronomeToggle.tsx` - Toggle button with real-time enable/disable during playback
- `src/components/TransportControls/CountInSelect.tsx` - Dropdown for 0-4 bars count-in selection
- `src/state/playbackStore.ts` - Added countInBars/metronomeEnabled state, synced lifecycle in play/pause/stop
- `src/components/TransportControls/TransportControls.tsx` - Added bottom row with metronome and count-in controls
- `src/components/TransportControls/index.ts` - Exported new components

## Decisions Made

**1. MembraneSynth for click sound**
- Rationale: Produces better "click" quality than simple oscillators per RESEARCH.md findings

**2. 880Hz vs 440Hz pitch for downbeat accent**
- Rationale: Per CONTEXT.md requirement for audible bar boundaries during practice

**3. Separate synth instance for count-in**
- Rationale: Avoids conflicts with metronome lifecycle and ensures clean disposal after count-in completes

**4. Metronome lifecycle synced in store actions**
- Rationale: Ensures metronome starts/stops reliably with playback state changes (play starts if enabled, pause/stop always stops)

**5. -6dB metronome, -3dB count-in volume**
- Rationale: Loud enough to hear but doesn't overpower music. Count-in slightly louder for preparation phase.

**6. Store-based state vs component-only**
- Rationale: Persist metronomeEnabled and countInBars settings across play cycles without reset

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all TypeScript compilation and build steps passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Metronome and count-in ready for 02-06 page integration
- Transport controls fully featured for practice and recording workflows
- Audio playback engine complete pending track mixer implementation
- All playback features integrated and working with Transport synchronization

---
*Phase: 02-audio-playback-engine*
*Completed: 2026-01-26*
