---
phase: 14-midi-hardware-integration
plan: 01
subsystem: audio
tags: [midi, web-midi-api, zustand, typescript, singleton, ssr]

# Dependency graph
requires:
  - phase: 13-advanced-piano-roll
    provides: PianoRollEditor foundation that MIDI recording will feed notes into
provides:
  - MidiInputEngine singleton (src/audio/midi/MidiInputEngine.ts) with SSR-guarded Web MIDI API wrapper
  - midiInputStore Zustand store (src/state/midiInputStore.ts) with connect/disconnect/recording state
  - InstrumentInstance interface extended with optional triggerAttack?/triggerRelease? for live play
affects:
  - 14-02 (recording pipeline consumes midiInputStore + MidiInputEngine message handlers)
  - 14-03 (MIDI UI components consume useMidiInputStore)
  - 14-04 (live playback uses InstrumentInstance.triggerAttack/triggerRelease)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-level singleton factory (getMidiInputEngine) mirrors AudioEngine.getInstance() pattern
    - Late-binding dynamic import resolves circular dep between MidiInputEngine and midiInputStore
    - SSR guard via typeof window/navigator/requestMIDIAccess checks on all browser API access
    - getMidiInputStore() as non-React accessor mirrors existing store patterns

key-files:
  created:
    - src/audio/midi/MidiInputEngine.ts
    - src/state/midiInputStore.ts
  modified:
    - src/audio/instruments/PianoSampler.ts

key-decisions:
  - "Inline MIDI type declarations in MidiInputEngine.ts — avoids @types/webmidi conflict with tsconfig lib"
  - "Dynamic import for getMidiInputStore inside onstatechange callback — resolves circular dep without shared types file"
  - "refreshDevices() ignores MIDIAccess parameter, re-reads from getMidiInputEngine().getInputDevices() — keeps device-name logic in one place"
  - "InstrumentInstance triggerAttack?/triggerRelease? optional — existing instruments compile unmodified"

patterns-established:
  - "MIDI engine uses module-level singleton (let instance = null) matching AudioEngine pattern"
  - "All navigator/window access wrapped in typeof guards for SSR safety"
  - "Store exports both useMidiInputStore (React hook) and getMidiInputStore() (non-React accessor)"

requirements-completed: [MIDI-01, MIDI-02, MIDI-03, MIDI-04]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 14 Plan 01: MIDI Hardware Integration Foundation Summary

**Web MIDI API singleton with SSR guards, Zustand midiInputStore with connect/arm/record lifecycle, and InstrumentInstance extended with optional live-play methods**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-04T18:19:20Z
- **Completed:** 2026-03-04T18:21:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- MidiInputEngine singleton wraps navigator.requestMIDIAccess with SSR guards, typed error handling, and hot-plug support via onstatechange
- midiInputStore provides complete MIDI hardware state (connection + recording lifecycle) with connect/disconnect/arm/record actions
- InstrumentInstance interface extended with optional triggerAttack?/triggerRelease? — existing instrument implementations require no changes
- All TypeScript compiles with zero errors; circular dependency between engine and store resolved via late-binding dynamic import

## Task Commits

Each task was committed atomically:

1. **Task 1: MidiInputEngine singleton with Web MIDI API wrapper** - `00c638b` (feat)
2. **Task 2: midiInputStore Zustand store + InstrumentInstance interface extension** - `b53b258` (feat)

## Files Created/Modified

- `src/audio/midi/MidiInputEngine.ts` - Web MIDI API singleton: requestAccess, attachInputListeners, getInputDevices, addMessageHandler, dispose
- `src/state/midiInputStore.ts` - Zustand store: isSupported/isConnected/devices/error/isArmed/isRecording state + connect/disconnect/refreshDevices/setArmed/startRecording/stopRecording actions
- `src/audio/instruments/PianoSampler.ts` - InstrumentInstance interface extended with optional triggerAttack?/triggerRelease?

## Decisions Made

- **Inline MIDI type declarations** — @types/webmidi conflicts with the project's tsconfig lib settings; declaring minimal interfaces inline avoids that conflict
- **Dynamic import for store reference in engine** — MidiInputEngine calls `import('@/state/midiInputStore')` inside the onstatechange callback, not at module load time, eliminating the circular dependency TypeScript error
- **refreshDevices ignores MIDIAccess param** — The parameter is accepted to satisfy the interface contract but the implementation re-reads via `getMidiInputEngine().getInputDevices()` to keep device-name logic centralized
- **Optional triggerAttack/Release** — Making them optional means all existing InstrumentInstance implementors (PolySynth, PianoSampler, percussion) compile without modification

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Browser MIDI permission prompt will appear at runtime when connect() is called.

## Next Phase Readiness

- Plan 14-02 (recording pipeline) can now import useMidiInputStore and getMidiInputEngine
- Plan 14-03 (MIDI UI) can now import useMidiInputStore for connection status display
- Plan 14-04 (live playback) can now use InstrumentInstance.triggerAttack?/triggerRelease?
- No blockers

---
*Phase: 14-midi-hardware-integration*
*Completed: 2026-03-04*
