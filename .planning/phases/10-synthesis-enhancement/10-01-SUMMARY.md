---
phase: 10-synthesis-enhancement
plan: "01"
subsystem: audio
tags: [tone, sampler, soundfont, gleitz, cdn, gm-instruments]

# Dependency graph
requires: []
provides:
  - GM_SOUNDFONT_NAMES array (128-entry, index = GM program number)
  - getSoundfontUrl() function for gleitz CDN URL construction
  - loadSoundfontNotes() with module-level promise cache for CDN fetch + parse
  - clearSoundfontCache() utility
  - SamplerInstrument class implementing InstrumentInstance via Tone.Sampler
affects:
  - 10-synthesis-enhancement (Plan 02 will wire these into InstrumentFactory)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Promise-level caching in module scope (Map<number, Promise<...>>) to deduplicate concurrent fetches
    - gleitz MIDI.js JS-file parsing via indexOf/lastIndexOf slice approach (midiJsToJson)
    - Tone.Sampler with onload/onerror callbacks (not Tone.loaded()) for explicit load resolution
    - No baseUrl option on Tone.Sampler to avoid bug #899 with data: URL prepending

key-files:
  created:
    - src/audio/instruments/gmInstrumentNames.ts
    - src/audio/instruments/soundfontLoader.ts
    - src/audio/instruments/SamplerInstrument.ts
  modified: []

key-decisions:
  - "Cache at Promise level (not resolved value) so concurrent callers share the same in-flight fetch"
  - "omit baseUrl from Tone.Sampler constructor — pass data URLs directly in urls object to avoid bug #899"
  - "Use onload/onerror callbacks instead of Tone.loaded() — gives per-instrument load resolution"
  - "parseSoundfontJs not exported — internal implementation detail of soundfontLoader"

patterns-established:
  - "Pattern: module-level Map<number, Promise<T>> cache stores Promise itself so parallel callers share one fetch"
  - "Pattern: gleitz JS parse — indexOf('MIDI.Soundfont.'), indexOf('=', begin)+2, lastIndexOf(','), JSON.parse(slice + '}')"

requirements-completed: [AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05]

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 10 Plan 01: CDN Sample Loading Foundation Summary

**Tone.Sampler wrapper + gleitz FluidR3_GM soundfont loader with 128-entry GM name map and promise-level fetch cache**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T01:24:03Z
- **Completed:** 2026-02-25T01:25:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created 128-entry `GM_SOUNDFONT_NAMES` array (index = GM program number) with `getSoundfontUrl()` producing gleitz FluidR3_GM CDN URLs
- Created `loadSoundfontNotes()` with module-level promise cache deduplicating concurrent fetches, `parseSoundfontJs()` using the canonical midiJsToJson algorithm, and `clearSoundfontCache()`
- Created `SamplerInstrument` class implementing all four `InstrumentInstance` methods via `Tone.Sampler` with `onload`/`onerror` callbacks and no `baseUrl`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GM name map and soundfont loader** - `eaea23f` (feat)
2. **Task 2: Create SamplerInstrument class** - `8ad8f8c` (feat)

## Files Created/Modified
- `src/audio/instruments/gmInstrumentNames.ts` - 128-entry readonly string array indexed by GM program number, getSoundfontUrl() building gleitz CDN URLs
- `src/audio/instruments/soundfontLoader.ts` - loadSoundfontNotes() with promise-level cache, parseSoundfontJs() using indexOf/lastIndexOf slice algorithm, clearSoundfontCache()
- `src/audio/instruments/SamplerInstrument.ts` - SamplerInstrument class wrapping Tone.Sampler, implements InstrumentInstance (load, triggerAttackRelease, releaseAll, dispose)

## Decisions Made
- Cache at Promise level (not resolved value) so concurrent callers for the same program share one in-flight fetch, avoiding duplicate CDN requests
- Omit `baseUrl` from `Tone.Sampler` constructor — pass data URLs directly in `urls` to avoid bug #899 where baseUrl was prepended to data: URLs
- Use `onload`/`onerror` callbacks instead of `Tone.loaded()` — gives explicit per-instrument Promise resolution control
- `parseSoundfontJs` not exported — internal implementation detail, callers only need `loadSoundfontNotes`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compiled cleanly on first attempt for all three files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All three foundation files are ready. Plan 02 will:
- Modify `InstrumentFactory.ts` to import `SamplerInstrument` and `loadSoundfontNotes`, routing all non-percussion programs to the CDN sampler path
- Modify `NoteScheduler.ts` to preload instruments in parallel with `Promise.all()`
- Clean up `PianoSampler.ts` (gut to only export `InstrumentInstance` interface)

No blockers.

---
*Phase: 10-synthesis-enhancement*
*Completed: 2026-02-25*

## Self-Check: PASSED

- FOUND: src/audio/instruments/gmInstrumentNames.ts
- FOUND: src/audio/instruments/soundfontLoader.ts
- FOUND: src/audio/instruments/SamplerInstrument.ts
- FOUND: .planning/phases/10-synthesis-enhancement/10-01-SUMMARY.md
- FOUND: commit eaea23f (Task 1)
- FOUND: commit 8ad8f8c (Task 2)
