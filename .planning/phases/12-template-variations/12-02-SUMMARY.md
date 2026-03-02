---
phase: 12-template-variations
plan: 02
subsystem: generation
tags: [midi, genre-templates, chord-progressions, drum-fills, typescript, randomization]

# Dependency graph
requires:
  - phase: 12-template-variations/12-01
    provides: GenreTemplate interface with drumFills field; 4+ chord progressions per section; 8 drum fills per genre
  - phase: 06-generation
    provides: chordGenerator.ts and rhythmGenerator.ts with existing generation pipeline
provides:
  - Per-section random chord progression selection in chordGenerator.ts
  - Drum fill injection at last bar of each multi-bar section in rhythmGenerator.ts
  - End-to-end wired template variation pipeline (data from 12-01 is now consumed)
affects:
  - Any future plan consuming chordGenerator or rhythmGenerator (variation is now default behavior)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-section Math.random() selection — each section call independently draws from all progressions"
    - "isLastBarOfSection guard with section.bars >= 2 minimum — single-bar sections always use standard pattern"
    - "activePattern local variable — replaces pattern reference inside bar loop, zero overhead when no fill used"

key-files:
  created: []
  modified:
    - src/lib/nl-generation/chordGenerator.ts
    - src/lib/nl-generation/rhythmGenerator.ts

key-decisions:
  - "Replace entire progressionIndex if/else-if block with single Math.random() line — simpler and complete"
  - "activePattern pattern replaces pattern inside the bar loop — outer pattern variable unchanged as fallback"
  - "section.bars >= 2 guard prevents fills on single-bar sections — musically correct (no fill needed)"
  - "Math.random() in rhythmGenerator at bar render time (not per-section setup) — random fill chosen per-bar boundary"

patterns-established:
  - "activePattern substitution: declare at top of inner loop, use everywhere pattern was used — clean swap without structural changes"
  - "isLastBarOfSection: bar === section.bars - 1 — idiomatic check for boundary injection"

requirements-completed: [TMPL-04, TMPL-05]

# Metrics
duration: ~5min (task execution) + human verification
completed: 2026-03-02
---

# Phase 12 Plan 02: Template Variations Logic Summary

**Per-section random chord progression selection and last-bar drum fill injection wired into chordGenerator.ts and rhythmGenerator.ts, making all 12-01 template data reachable and audibly distinct across generations.**

## Performance

- **Duration:** ~5 min (task execution) + human verification checkpoint
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Replaced hard-coded `progressionIndex` if/else-if block in `chordGenerator.ts` with single `Math.floor(Math.random() * progressions.length)` call applied per-section
- Added `isLastBarOfSection` / `useFill` / `activePattern` logic in `rhythmGenerator.ts` bar loop; all `pattern.*` references inside bar loop updated to `activePattern.*`
- Human verified audible variation: 5+ same-genre generations produce distinct chord progressions and drum fills while maintaining genre identity

## Task Commits

Each task was committed atomically:

1. **Task 1: Randomize chord progression selection in chordGenerator.ts** - `33344cf` (feat)
2. **Task 2: Inject drum fills at section boundaries in rhythmGenerator.ts** - `59c48ce` (feat)
3. **Task 3: Verify audible variation across template generations** - human-verify checkpoint, approved by user

## Files Created/Modified

- `src/lib/nl-generation/chordGenerator.ts` - Progressive selection block replaced; each section now independently draws a random progression from all available variants
- `src/lib/nl-generation/rhythmGenerator.ts` - `activePattern` variable added to bar loop; fill injected at last bar of multi-bar sections; all `pattern.*` references inside loop replaced with `activePattern.*`

## Decisions Made

- Replaced entire `progressionIndex` if/else-if block rather than just patching the verse case — simpler code, correct uniform behavior across all section types
- `activePattern` declared per-bar inside the loop (not per-section) — correctly scoped since fills are a per-bar boundary decision
- `section.bars >= 2` guard kept as minimum threshold — single-bar intros/outros do not warrant a fill pattern
- `pattern` variable (outer, set before bar loop) left unchanged as the non-fill baseline — `activePattern` falls back to it when `useFill` is false

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Template variation pipeline is fully wired end-to-end: data (12-01) + logic (12-02) complete
- chordGenerator and rhythmGenerator will produce audibly varied output on every generation call
- Phase 12 complete; Phase 13 (timeline scrubber / UX improvements) can proceed

---
*Phase: 12-template-variations*
*Completed: 2026-03-02*
