---
phase: 12-template-variations
plan: 01
subsystem: generation
tags: [midi, genre-templates, chord-progressions, drum-fills, typescript]

# Dependency graph
requires:
  - phase: 06-generation
    provides: genreTemplates.ts with GenreTemplate interface and 6 genre objects
provides:
  - GenreTemplate interface with drumFills field
  - 4 verse + 4 chorus chord progressions for lofi, trap, boom-bap, jazz, pop
  - 3 verse + 3 chorus chord progressions for classical
  - 8 drum fill patterns per genre (lofi/trap/boom-bap/jazz/pop), empty array for classical
affects:
  - 12-02 (randomization logic reads drumFills array and expanded progressions)
  - rhythmGenerator.ts (consumers of drumFills field)
  - chordGenerator.ts (consumers of expanded chordProgressions arrays)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DrumPattern[] for fill variation storage — same shape as section patterns, selected randomly at boundaries"
    - "Empty drumFills array for drumless genres — consumers check length before accessing"

key-files:
  created: []
  modified:
    - src/lib/nl-generation/genreTemplates.ts

key-decisions:
  - "drumFills placed after drumPatterns in interface — logical grouping of all drum data"
  - "Classical drumFills: [] (empty) — generateDrumTrack returns early for classical, fills never accessed"
  - "8 fills per genre — provides enough variety for random selection without being unwieldy"
  - "Tick offset ceiling is 1919 (not 1920) — PPQ=480 bar is 1920 ticks so offset 1919 is last valid 16th"
  - "bVII7 and bIIImaj7/bVImaj7 are the only b-prefixed numerals used — known to work with Tonal.js"

patterns-established:
  - "Genre comment header: // genre: N verse progressions, N chorus progressions, N drum fills"
  - "Fill comment inline: // Fill N: description of pattern style"

requirements-completed: [TMPL-01, TMPL-02, TMPL-03, TMPL-06]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 12 Plan 01: Template Variations Data Summary

**GenreTemplate interface extended with drumFills field; all 6 genres populated with 3-5 chord progression variants per section and 8 drum fill patterns (classical: empty array), enabling random variation in Plan 02.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-02T01:49:05Z
- **Completed:** 2026-03-02T01:51:54Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Extended GenreTemplate interface with `drumFills: DrumPattern[]` field and JSDoc comment
- Expanded all 6 genres from 2 to 3-5 chord progressions per section type (verse/chorus)
- Authored 8 drum fill patterns per genre (lofi/trap/boom-bap/jazz/pop), empty array for classical
- All fill tick offsets validated within [0, 1919] (PPQ=480 bar boundary)
- TypeScript compiles clean, 863 lines total (up from 501)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend GenreTemplate interface with drumFills** - `8b3e1fc` (feat)
2. **Task 2: Author expanded chord progressions and drum fills for all 6 genres** - `ad14f9d` (feat)

## Files Created/Modified

- `src/lib/nl-generation/genreTemplates.ts` - Extended interface + 6 genres with expanded progressions and 8 drum fills each

## Decisions Made

- `drumFills: DrumPattern[]` reuses the existing DrumPattern shape — no new types needed, fills are just patterns
- Classical genre has `drumFills: []` — the existing `generateDrumTrack` returns early for classical before fills would ever be accessed, so empty array is safe
- Tick offsets cap at 1800 for 16th-note fills (last 16th in bar at PPQ=480 = 1800), never exceed 1919
- Only `bIIImaj7`, `bVImaj7`, and `bVII7` b-prefixed numerals used — proven to work with Tonal.js in existing codebase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can now implement randomization logic: `drumFills` array ready for random selection at section boundaries
- Expanded chord progression arrays ready for `randomIndex()` selection in chordGenerator
- All 6 genres structurally correct and TypeScript-verified

---
*Phase: 12-template-variations*
*Completed: 2026-03-02*
