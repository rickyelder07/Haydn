---
phase: 04-music-theory-validation-layer
plan: 02
subsystem: music-theory
tags: [tonal, validation, scale-theory, tdd, vitest]

# Dependency graph
requires:
  - phase: 04-01
    provides: Validation types, pitch class utilities, key signature lookup

provides:
  - ScaleValidator for enforcing scale constraints
  - TransitionValidator for context-aware warnings
  - Comprehensive test suite with 20 test cases
  - Vitest testing infrastructure

affects: [04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: [vitest]
  patterns:
    - "TDD RED-GREEN-REFACTOR cycle for core validators"
    - "Enharmonic-safe comparison using Note.chroma()"
    - "Common scale filtering to avoid exotic scale false positives"
    - "Major/minor prioritization over modes for transition detection"

key-files:
  created:
    - vitest.config.ts
    - src/lib/music-theory/validators/ScaleValidator.ts
    - src/lib/music-theory/validators/TransitionValidator.ts
    - src/lib/music-theory/validators/__tests__/ScaleValidator.test.ts
    - src/lib/music-theory/validators/__tests__/TransitionValidator.test.ts
  modified:
    - package.json

key-decisions:
  - "Vitest for testing framework - modern, fast, ESM-native"
  - "Enharmonic equivalence via Note.chroma() - F# and Gb both resolve to chroma 6"
  - "Permissive defaults - return ok:true when no key signature or invalid scale data"
  - "Filter exotic scales from Scale.detect() - prevents false positives from obscure scales"
  - "Prioritize major/minor over modes - more musically intuitive validation"
  - "3-note minimum for context detection - insufficient data returns permissive"
  - "Error vs warning severity - scale violations are errors, transition clashes are warnings"

patterns-established:
  - "TDD pattern: write failing tests (RED), implement (GREEN), refactor if needed"
  - "Mock factory functions in tests for creating ValidationContext"
  - "Scale type filtering using scale.type exact matching (not substring)"

# Metrics
duration: 6 min
completed: 2026-01-31
---

# Phase 4 Plan 02: ScaleValidator and TransitionValidator Summary

**TDD implementation of scale membership and transition smoothness validators with enharmonic-safe comparison and intelligent scale detection filtering**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-31T03:30:31Z
- **Completed:** 2026-01-31T03:37:03Z
- **Tasks:** 2 (RED + GREEN phases, no refactoring needed)
- **Files modified:** 6
- **Test coverage:** 20 test cases (11 ScaleValidator + 9 TransitionValidator)

## Accomplishments

- **ScaleValidator** validates note membership in the current key signature's scale with time-aware lookup and enharmonic safety
- **TransitionValidator** detects surrounding musical context and warns about jarring transitions
- **Vitest testing infrastructure** configured with path aliases and test scripts
- **Comprehensive test suite** covering normal cases, edge cases, enharmonics, key changes, and permissive defaults
- **All tests green** - 100% pass rate with TypeScript type safety

## Task Commits

Each TDD phase was committed atomically:

1. **Task 1 (RED):** Write failing tests - `688de9d` (test)
   - Install Vitest and configure with path aliases
   - Create stub validators that throw "Not implemented"
   - Write 20 comprehensive test cases (11 + 9)
   - All tests fail as expected

2. **Task 2 (GREEN):** Implement validators - `14ab63c` (feat)
   - ScaleValidator uses getCurrentKeySignature and Note.chroma()
   - TransitionValidator with ppq * 2 tick neighborhood window
   - Filter exotic scales from Scale.detect() results
   - Prioritize major/minor over modes
   - All 20 tests pass

**No REFACTOR commit needed** - code is clean and clear without obvious improvements

## Files Created/Modified

- `vitest.config.ts` - Vitest configuration with path alias support
- `package.json` - Added vitest dev dependency and test scripts
- `src/lib/music-theory/validators/ScaleValidator.ts` - Scale membership validation
- `src/lib/music-theory/validators/TransitionValidator.ts` - Transition smoothness validation
- `src/lib/music-theory/validators/__tests__/ScaleValidator.test.ts` - 11 test cases
- `src/lib/music-theory/validators/__tests__/TransitionValidator.test.ts` - 9 test cases

## Decisions Made

**Vitest for testing framework**
- Modern, fast, ESM-native test runner
- Better Next.js/React integration than Jest
- Simpler configuration

**Enharmonic-safe comparison using Note.chroma()**
- F# (MIDI 66) and Gb (MIDI 66) are the same pitch (chroma 6)
- Using string comparison would fail enharmonic tests
- Note.chroma() provides consistent pitch class matching

**Permissive when no key signature or invalid scale**
- Return `{ ok: true }` when keySignatures array is empty
- Return `{ ok: true }` when Scale.get() returns invalid/empty scale
- Prevents blocking edits when metadata is missing or malformed

**Filter Scale.detect() to common scales only**
- Scale.detect() returns ALL possible scales including exotic ones
- "C, D, E, F" matches 13 scales including "locrian major" and "ichikosucho"
- Filter to major, minor, harmonic minor, melodic minor, and standard modes
- Use exact `scale.type` matching to avoid substring collisions

**Prioritize major/minor over modes**
- When both major and lydian are detected, validate against major only
- More musically intuitive - users expect major/minor context
- Modes are validated only when major/minor don't fit

**3-note minimum for transition detection**
- Scale.detect() is unreliable with fewer than 3 notes
- Return permissive `{ ok: true }` when insufficient context
- Prevents false positives from sparse tracks

**Error vs warning severity**
- ScaleValidator returns `severity: 'error'` - violates explicit key signature
- TransitionValidator returns `severity: 'warning'` - contextual suggestion only
- Allows UI to differentiate blocking errors from helpful hints

## Deviations from Plan

None - plan executed exactly as written through RED-GREEN-REFACTOR TDD cycle.

## Issues Encountered

**Scale.detect() includes exotic scales**
- Initial implementation accepted any detected scale
- Tests failed because "locrian major" includes F# while C major doesn't
- Fixed by filtering to common scale types only (major, minor, modes)
- Added major/minor prioritization for more intuitive validation

**Test type mismatches**
- Initial tests imported HaydnNote/Track/Project from wrong module
- Fixed by importing from `@/lib/midi/types` not `@/lib/music-theory/types`
- Updated mock factories to match actual HaydnProject structure (originalFileName, sourceFormat, durationTicks)

## Next Phase Readiness

**Ready for 04-03** - Validator registry and composition
- Two validators fully implemented and tested
- Clean Validator interface for composability
- Validation types ready for orchestration

**No blockers** - All tests pass, TypeScript compiles clean, enharmonic edge cases handled

---
*Phase: 04-music-theory-validation-layer*
*Completed: 2026-01-31*
