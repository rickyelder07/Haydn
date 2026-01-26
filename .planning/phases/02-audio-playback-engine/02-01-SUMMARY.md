---
phase: 02-audio-playback-engine
plan: 01
subsystem: audio
tags: [tone.js, @tonejs/piano, web-audio, synthesis, sampling]

# Dependency graph
requires:
  - phase: 01-foundation-a-midi-infrastructure
    provides: MIDI types, GM instrument mapping
provides:
  - AudioEngine singleton for Web Audio context management
  - Instrument factory creating Piano samplers and oscillator synths
  - InstrumentInstance interface for uniform playback API
affects: [02-02-playback-controller, 02-03-transport-controls, future audio features]

# Tech tracking
tech-stack:
  added: [tone@15.1.22, @tonejs/piano@0.2.1]
  patterns: [singleton pattern for AudioContext, factory pattern for instruments, strategy pattern for synthesis]

key-files:
  created: [src/audio/AudioEngine.ts, src/audio/instruments/PianoSampler.ts, src/audio/instruments/SynthInstrument.ts, src/audio/instruments/InstrumentFactory.ts]
  modified: [package.json]

key-decisions:
  - "Use Tone.js 15.1.22 for Web Audio framework (handles timing and autoplay policy)"
  - "Piano tracks (GM 0-7) use @tonejs/piano samples for quality"
  - "Non-piano instruments use oscillator synthesis with GM category waveform mapping"
  - "5 velocity levels for piano (smaller download, sufficient quality for v1)"
  - "Common InstrumentInstance interface enables uniform scheduling in future PlaybackController"

patterns-established:
  - "Singleton pattern for AudioEngine to prevent multiple AudioContext instances"
  - "Factory pattern for instrument creation based on GM program number"
  - "Strategy pattern: PianoSampler vs SynthInstrument implement common interface"

# Metrics
duration: 2 min
completed: 2026-01-26
---

# Phase 2 Plan 1: Audio Infrastructure Foundation Summary

**Tone.js and @tonejs/piano installed, AudioEngine singleton managing Web Audio context, instrument factory creating Piano samplers for GM 0-7 and oscillator synths for all other instruments**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T20:33:19Z
- **Completed:** 2026-01-26T20:35:31Z
- **Tasks:** 3
- **Files modified:** 5 (package.json, package-lock.json, 4 audio files created)

## Accomplishments
- Installed Tone.js 15.1.22 and @tonejs/piano 0.2.1 for Web Audio synthesis and sampling
- Created AudioEngine singleton handling autoplay policy via Tone.start()
- Implemented PianoSampler wrapping @tonejs/piano with 5 velocity levels
- Implemented SynthInstrument with GM program to waveform mapping (triangle/sine/sawtooth/square)
- Created InstrumentFactory routing GM 0-7 to Piano, all others to Synth

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tone.js dependencies** - `f563168` (chore)
2. **Task 2: Create AudioEngine singleton** - `c220e86` (feat)
3. **Task 3: Create instrument classes and factory** - `938e8b6` (feat)

## Files Created/Modified
- `package.json` - Added tone and @tonejs/piano dependencies
- `src/audio/AudioEngine.ts` - Singleton managing AudioContext with autoplay policy handling
- `src/audio/instruments/PianoSampler.ts` - @tonejs/piano wrapper with InstrumentInstance interface
- `src/audio/instruments/SynthInstrument.ts` - PolySynth with GM program waveform mapping
- `src/audio/instruments/InstrumentFactory.ts` - Factory creating appropriate instrument for GM program

## Decisions Made
- **Tone.js version:** Use 15.1.22 (latest) despite @tonejs/piano peer dependency on ^14.6.1 - backward compatible API, RESEARCH.md recommends 15+
- **Piano velocity levels:** 5 levels for smaller download (vs 16 max) - sufficient quality for v1, can upgrade later
- **Waveform mapping:** Triangle for piano/guitar/bass/brass, sine for percussion, sawtooth for organ/strings, square for synth - based on RESEARCH.md GM category mapping
- **Interface design:** Common InstrumentInstance interface with load(), triggerAttackRelease(), releaseAll(), dispose() methods enables uniform PlaybackController implementation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully, TypeScript compilation passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Audio infrastructure ready for PlaybackController implementation in plan 02-02
- InstrumentInstance interface provides clean abstraction for scheduling
- AudioEngine singleton ensures proper autoplay policy handling
- Factory pattern makes it easy to add more instrument types later (on-demand sample downloads)

---
*Phase: 02-audio-playback-engine*
*Completed: 2026-01-26*
