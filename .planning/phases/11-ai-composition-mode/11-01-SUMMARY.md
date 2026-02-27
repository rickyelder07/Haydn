---
phase: 11-ai-composition-mode
plan: "01"
subsystem: ai
tags: [zod, zustand, openai, midi, gpt-4o, state-machine]

# Dependency graph
requires:
  - phase: 06-generation
    provides: assembleProject() fallback and GenerationParams type
  - phase: 04-validation
    provides: createDefaultPipeline() for post-generate validation
  - phase: 05-nl-editing
    provides: tokenCounter utilities (estimateTokensAndCost, calculateActualCost)
provides:
  - MidiCompositionSchema Zod schema + QuestionsSchema for /api/ai-compose API route
  - compositionToHaydnProject() converter from AI output to HaydnProject
  - useAiCompositionStore Zustand state machine for full AI composition orchestration
  - AiCompositionPhase type covering all 8 phases of the composition flow
affects: [11-ai-composition-mode, GenerationInput UI, /api/ai-compose API route]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State machine via Zustand with explicit phase enum type (idle/questioning/answering/generating/retrying/success/fallback/error)"
    - "Internal async helper (_runGenerate) outside Zustand state, called from actions"
    - "fixOverlappingNotes post-processing applied inside converter before returning HaydnProject"
    - "Validation uses createDefaultPipeline() with no args (Scale + Transition only, no GenreValidator)"

key-files:
  created:
    - src/lib/openai/aiComposeSchema.ts
    - src/state/aiCompositionStore.ts
  modified: []

key-decisions:
  - "fixOverlappingNotes called inside compositionToHaydnProject() — guarantees all callers get overlap-free projects"
  - "_runGenerate is a plain async function (not Zustand action) — avoids stale closure issues with the retry loop"
  - "Validation blocks only on error severity (not warnings) and deduplicates via Set before passing to retry"
  - "extractGenreFromPrompt detects 6 genres from free-form text, defaults to 'pop' — covers all MidiCompositionSchema genres"
  - "clarifyTokens accumulated before generate phase so totalCost is correct across the full session"
  - "buildHistory returns [] for null turn — clean interface: API callers never need to check for undefined"

patterns-established:
  - "Schema-first: Zod schema defined in lib/openai/, types inferred with z.infer<>, converter co-located in same file"
  - "Store orchestrates async flow but delegates project loading to useProjectStore.getState().loadNewProject()"

requirements-completed: [AI-05, AI-06, AI-07, AI-08]

# Metrics
duration: 1min
completed: 2026-02-27
---

# Phase 11 Plan 01: AI Composition Schema and State Machine Summary

**Zod MidiCompositionSchema contracts + Zustand 8-phase state machine with clarify/generate/retry/fallback orchestration for GPT-4o MIDI composition**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-27T21:25:03Z
- **Completed:** 2026-02-27T21:26:30Z
- **Tasks:** 2
- **Files modified:** 2 (created)

## Accomplishments
- Defined MidiCompositionSchema (genre/tempo/key/scale/tracks) and QuestionsSchema as Zod contracts for /api/ai-compose route
- Implemented compositionToHaydnProject() converter with fixOverlappingNotes post-processing
- Built useAiCompositionStore state machine covering all 8 phases (idle/questioning/answering/generating/retrying/success/fallback/error)
- Implemented 3-attempt generate loop with validation-gated retry and assembleProject() fallback
- Token usage accumulates correctly across clarify and generate API calls

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MidiCompositionSchema and converter** - `ca5e4eb` (feat)
2. **Task 2: Create aiCompositionStore state machine** - `87291af` (feat)

## Files Created/Modified
- `src/lib/openai/aiComposeSchema.ts` — QuestionsSchema, MidiCompositionSchema, AiNote/AiTrack/MidiComposition types, compositionToHaydnProject() converter, fixOverlappingNotes() helper
- `src/state/aiCompositionStore.ts` — useAiCompositionStore, AiCompositionPhase, ClarifyingTurn, CumulativeTokenUsage, full state machine with startClarification/submitAnswers/skipQuestions/reset

## Decisions Made
- `fixOverlappingNotes` called inside `compositionToHaydnProject()` rather than as a separate step — guarantees all callers get overlap-free projects without needing to remember to call it
- `_runGenerate` is a plain TypeScript async function rather than a Zustand action — avoids stale closure issues in the 3-attempt retry loop where `set`/`get` need to be current on each iteration
- Validation blocks only on `error` severity (ignores warnings) and deduplicates error messages with `[...new Set(errors)]` before sending to retry — consistent with nlGenerationStore pattern
- `extractGenreFromPrompt` detects all 6 genres (lofi/trap/boom-bap/jazz/classical/pop) from free-form text, defaults to 'pop' — ensures fallback always produces a valid GenerationParams
- `buildHistory(null)` returns `[]` — clean default so API call sites never need to null-check

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Both files compile cleanly (tsc --noEmit: zero errors)
- MidiCompositionSchema is ready for /api/ai-compose API route implementation (Plan 02)
- useAiCompositionStore is ready for GenerationInput UI component (Plan 03)
- All exports match the plan's required artifact list exactly

---
*Phase: 11-ai-composition-mode*
*Completed: 2026-02-27*

## Self-Check: PASSED

- FOUND: src/lib/openai/aiComposeSchema.ts
- FOUND: src/state/aiCompositionStore.ts
- FOUND: .planning/phases/11-ai-composition-mode/11-01-SUMMARY.md
- FOUND: ca5e4eb (Task 1 commit)
- FOUND: 87291af (Task 2 commit)
