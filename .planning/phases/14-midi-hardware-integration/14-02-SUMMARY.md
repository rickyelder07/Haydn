---
phase: 14-midi-hardware-integration
plan: 02
subsystem: audio
tags: [midi, tone.js, zustand, typescript, live-play, recording, sustain-pedal]

# Dependency graph
requires:
  - phase: 14-01
    provides: MidiInputEngine singleton, midiInputStore foundation, InstrumentInstance live-play interface extension
provides:
  - SamplerInstrument.triggerAttack/triggerRelease (Tone.Sampler live-play)
  - SynthInstrument.triggerAttack/triggerRelease (Tone.PolySynth live-play)
  - NoteScheduler.getInstrumentForTrack() accessor for live MIDI routing
  - midiInputStore.handleMidiEvent() full MIDI routing with CC64 sustain, live play, recording accumulation
  - midiInputStore.startRecordingWithCountIn() with 1-bar count-in from stopped state
  - midiInputStore.commitRecording() merges accumulated notes via applyBatchEdit (single undo step)
affects:
  - 14-03 (MIDI UI components use midiInputStore.isArmed/isRecording/startRecordingWithCountIn/commitRecording)
  - 14-04 (live playback verification depends on full pipeline working)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MIDI message decoding via module-level decodeMidiMessage() — keeps store action pure
    - Timing offset via performance.now()/AudioContext.currentTime delta — aligns MIDI and audio domains
    - CC64 sustain pedal deferred release pattern — sustainedNoteOffs Set accumulates, released on pedal-up
    - Two-phase note recording: pendingNotes Map (open) + completedNotes array (closed) merged at commitRecording

key-files:
  created: []
  modified:
    - src/audio/instruments/SamplerInstrument.ts
    - src/audio/instruments/SynthInstrument.ts
    - src/audio/playback/NoteScheduler.ts
    - src/state/midiInputStore.ts

key-decisions:
  - "Remove id field from HaydnNote literals — HaydnNote type has no id field; plan code sample was incorrect"
  - "Message handler registered inside connect() action (not at module load) — avoids handler leaks if MIDI access is never requested"
  - "pendingNotes + completedNotes two-phase design — allows real-time note-on recording without blocking until noteOff"
  - "commitRecording caps held notes at ppq*8 (2 bars) — prevents monster notes from notes held across stop boundary"
  - "startRecordingWithCountIn silently catches count-in cancellation, disarms instead of throwing — graceful UX on ESC/interrupt"

patterns-established:
  - "Module-level decode/timing helpers keep Zustand actions focused on state transitions"
  - "getInstrumentForTrack reads from loadedInstruments Map directly — zero-latency live play, no async lookup"
  - "Two-store access pattern: handleMidiEvent reads useProjectStore + usePlaybackStore + useEditStore inline"

requirements-completed: [MIDI-05, MIDI-06, MIDI-07, MIDI-09, MIDI-10, MIDI-11, MIDI-12]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 14 Plan 02: MIDI Event Processing Pipeline Summary

**MIDI event routing pipeline with CC64 sustain pedal, live instrument triggering, two-phase recording accumulation, and applyBatchEdit commit via triggerAttack/Release on SamplerInstrument + SynthInstrument**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-04T18:23:45Z
- **Completed:** 2026-03-04T18:26:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- SamplerInstrument and SynthInstrument now implement triggerAttack/triggerRelease for Tone.Sampler and PolySynth live-play via hardware keyboard
- NoteScheduler exports getInstrumentForTrack() giving zero-latency access to the already-loaded instrument for a given track index
- midiInputStore.handleMidiEvent() decodes raw MIDIMessageEvent bytes and routes: CC64 sustain (deferred release), noteOn (live feedback + pending record), noteOff (release or defer + close pending note)
- startRecordingWithCountIn(): 1-bar playCountIn from stopped state, immediate start if already playing
- commitRecording(): merges completedNotes + still-held pendingNotes into existing track notes via applyBatchEdit (single undo step); caps held notes at 2 bars; clears all recording state

## Task Commits

Each task was committed atomically:

1. **Task 1: SamplerInstrument + SynthInstrument triggerAttack/Release + NoteScheduler accessor** - `9ccff60` (feat)
2. **Task 2: midiInputStore event handling, live play, recording pipeline** - `04daf5d` (feat)

## Files Created/Modified

- `src/audio/instruments/SamplerInstrument.ts` - Added triggerAttack/triggerRelease using Tone.Sampler methods with optional chaining
- `src/audio/instruments/SynthInstrument.ts` - Added triggerAttack/triggerRelease using PolySynth methods
- `src/audio/playback/NoteScheduler.ts` - Added getInstrumentForTrack() exported function reading loadedInstruments Map
- `src/state/midiInputStore.ts` - Extended with imports, module-level decode/timing helpers, completedNotes state, handleMidiEvent/startRecordingWithCountIn/commitRecording actions, message handler registration in connect()

## Decisions Made

- **Removed id from HaydnNote literals** — The plan's code samples included an `id` field on completedNote objects, but `HaydnNote` type (src/lib/midi/types.ts) only has `midi`, `ticks`, `durationTicks`, `velocity`. Auto-fixed by dropping the id field.
- **Message handler registered in connect()** — Not at module evaluation time, so no handler is ever registered if MIDI access is never requested by the user. Prevents duplicate registrations.
- **Two-phase note recording** — pendingNotes Map accumulates open note-on events; completedNotes array stores closed note-on/off pairs. Only on commitRecording are they merged into the project.
- **2-bar cap on held pending notes** — Notes still open when recording stops get capped at `ppq * 8` ticks to avoid unreasonably long notes from keyboard keys held across the stop event.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed non-existent `id` field from HaydnNote literal objects**
- **Found during:** Task 2 (midiInputStore event handling)
- **Issue:** Plan's code samples included `id: \`rec-${midi}-${startTicks}\`` in HaydnNote object literals, but the `HaydnNote` interface in `src/lib/midi/types.ts` does not have an `id` field — TypeScript TS2353 error
- **Fix:** Removed `id` field from both HaydnNote literal objects (completedNote in handleMidiEvent, and pending note in commitRecording)
- **Files modified:** src/state/midiInputStore.ts
- **Verification:** `npx tsc --noEmit` passes with 0 errors
- **Committed in:** 04daf5d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 type error)
**Impact on plan:** Necessary fix — plan code sample was slightly out of sync with actual HaydnNote type. Fix has no behavioral impact; IDs were only cosmetic and HaydnNote doesn't use them.

## Issues Encountered

None beyond the auto-fixed type error above.

## User Setup Required

None - no external service configuration required. Browser MIDI permission prompt appears at runtime when connect() is called.

## Next Phase Readiness

- Plan 14-03 (MIDI UI) can now import `useMidiInputStore` for connection status, armed state, and trigger `startRecordingWithCountIn()`/`commitRecording()`
- Plan 14-04 (live playback verification) can exercise the full pipeline: connect → arm → play note on hardware → hear audio → record → stop → see notes in piano roll
- No blockers

---
*Phase: 14-midi-hardware-integration*
*Completed: 2026-03-04*
