---
phase: 10-synthesis-enhancement
plan: "02"
subsystem: audio
tags: [tone.js, sampler, soundfont, cdn, instrument-factory, note-scheduler]

# Dependency graph
requires:
  - phase: 10-01
    provides: SamplerInstrument, soundfontLoader, gmInstrumentNames — CDN sample loading building blocks
provides:
  - InstrumentFactory routes all non-percussion GM programs to SamplerInstrument via CDN soundfont loading
  - PianoSampler.ts reduced to InstrumentInstance interface only (no class)
  - NoteScheduler pre-loads all unique instruments in parallel via Promise.all before scheduling
affects:
  - 10-03
  - audio-playback
  - instrument-loading

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel instrument pre-load: Promise.all() before scheduling loop, instruments cached in loadedInstruments map"
    - "Soundfont cache deduplication: soundfontLoader returns same in-flight Promise for concurrent callers"
    - "Percussion guard first: isPercussionChannel() checked before any CDN path, SynthInstrument(999) for channel 9"
    - "CDN fallback: try/catch around loadSoundfontNotes() falls back to SynthInstrument with console.warn"

key-files:
  created: []
  modified:
    - src/audio/instruments/InstrumentFactory.ts
    - src/audio/instruments/PianoSampler.ts
    - src/audio/playback/NoteScheduler.ts

key-decisions:
  - "isPercussion guard is the FIRST condition in createInstrument() — percussion never touches CDN path"
  - "Each unique GM program number is its own instrument key in NoteScheduler — no 0-7 piano grouping"
  - "Promise.all() pre-load phase separated from scheduling loop — instruments ready before any Part is created"

patterns-established:
  - "Instrument pre-loading: collect unique keys, parallel load, then schedule"
  - "Fallback pattern: try CDN samples, catch → SynthInstrument with warning"

requirements-completed: [AUDIO-06]

# Metrics
duration: 1min
completed: 2026-02-25
---

# Phase 10 Plan 02: Synthesis Enhancement — CDN Sample Wiring Summary

**SamplerInstrument wired into live audio path: InstrumentFactory routes all GM programs to CDN soundfonts, NoteScheduler pre-loads all instruments in parallel via Promise.all**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T01:28:29Z
- **Completed:** 2026-02-25T01:29:42Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- InstrumentFactory now routes all non-percussion GM programs to `SamplerInstrument` via `loadSoundfontNotes()`, with `SynthInstrument` fallback on CDN error
- `PianoSampler.ts` gutted to export only the `InstrumentInstance` interface — `PianoSampler` class and `PolySynth` imports removed
- `NoteScheduler.scheduleNotes()` now uses `Promise.all()` for parallel instrument pre-loading before the scheduling loop, eliminating the sequential waterfall

## Task Commits

Each task was committed atomically:

1. **Task 1: Update InstrumentFactory and gut PianoSampler** - `579bb03` (feat)
2. **Task 2: Parallel instrument pre-loading in NoteScheduler** - `7596053` (feat)

**Plan metadata:** (docs commit — see final commit)

## Files Created/Modified
- `src/audio/instruments/InstrumentFactory.ts` - Removed PIANO_PROGRAMS; percussion → SynthInstrument(999), all others → SamplerInstrument via CDN with SynthInstrument fallback
- `src/audio/instruments/PianoSampler.ts` - Gutted to InstrumentInstance interface only; PianoSampler class and PolySynth imports removed
- `src/audio/playback/NoteScheduler.ts` - Added parallel pre-load phase with Promise.all; removed sequential await-in-loop; removed isPiano grouping (0-7)

## Decisions Made
- `isPercussion` guard is checked FIRST in `createInstrument()` so percussion never enters the CDN path
- Each GM program number is its own instrument key in NoteScheduler — the old "0-7 share key 0" grouping is gone since real samples are distinct per instrument
- Instruments collected into `toLoad` array then loaded with `Promise.all()` before any `Tone.Part` is created — clean separation of loading and scheduling phases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CDN sample loading is fully wired into the live audio path
- MIDI import will now trigger real soundfont sample loading for all non-percussion instruments
- Parallel loading means projects with multiple unique instruments load all samples simultaneously
- Percussion tracks (channel 9) continue to use SynthInstrument(999) — no CDN fetch
- Ready for Phase 10-03 (playback loading state / spinner UX, if applicable)

## Self-Check: PASSED

- src/audio/instruments/InstrumentFactory.ts: FOUND
- src/audio/instruments/PianoSampler.ts: FOUND
- src/audio/playback/NoteScheduler.ts: FOUND
- .planning/phases/10-synthesis-enhancement/10-02-SUMMARY.md: FOUND
- Commit 579bb03 (Task 1): FOUND
- Commit 7596053 (Task 2): FOUND
- TypeScript: zero errors

---
*Phase: 10-synthesis-enhancement*
*Completed: 2026-02-25*
