---
phase: 11-ai-composition-mode
plan: "02"
subsystem: api
tags: [openai, gpt-4o, zod, structured-outputs, next-js, api-route]

# Dependency graph
requires:
  - phase: 11-ai-composition-mode plan 01
    provides: QuestionsSchema and MidiCompositionSchema Zod contracts
  - phase: 05-nl-editing
    provides: withExponentialBackoff retry utility and openai client pattern
provides:
  - Unified POST /api/ai-compose endpoint handling both clarify and generate phases
  - zodResponseFormat(QuestionsSchema) for clarify responses
  - zodResponseFormat(MidiCompositionSchema) for generate responses
  - Token usage returned in every response for accumulation by aiCompositionStore
affects: [11-ai-composition-mode, aiCompositionStore (Plan 01 store calls this route)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dispatch pattern: single POST handler dispatches to handleClarify or handleGenerate based on generateAttempt field presence"
    - "zodResponseFormat(Schema, 'name') for Structured Outputs on both clarify and generate paths"
    - "Retry context injection: validationErrors appended as user message when attempt > 0"
    - "Per-handler try/catch with console.error('[ai-compose]', error) prefix for log filtering"

key-files:
  created:
    - src/app/api/ai-compose/route.ts
  modified: []

key-decisions:
  - "Single endpoint dispatches on generateAttempt field presence — keeps client state machine simple (no separate /clarify and /generate routes)"
  - "ChatMessage type defined locally in route — avoids dependency on OpenAI SDK internals while keeping type safety"
  - "Validation error context injected as extra user message on retry (attempt > 0) — consistent with plan spec, preserves conversation coherence"
  - "buildClarifySystemPrompt and buildGenerateSystemPrompt as separate functions — clean separation, easy to tune prompts independently"

patterns-established:
  - "Unified route pattern: single POST with dispatch guard — reuse for future multi-phase AI endpoints"
  - "Token usage shape: { promptTokens, completionTokens, totalTokens } — consistent with nl-generate and nl-edit routes"

requirements-completed: [AI-03, AI-04, AI-05]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 11 Plan 02: AI Compose API Route Summary

**Unified POST /api/ai-compose route using zodResponseFormat for both clarify (QuestionsSchema) and generate (MidiCompositionSchema) phases with PPQ tick math in system prompt and validation error retry injection**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T22:28:45Z
- **Completed:** 2026-02-27T22:32:27Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments
- Implemented unified POST /api/ai-compose that handles both clarify and generate phases via generateAttempt field dispatch
- Clarify path uses zodResponseFormat(QuestionsSchema, 'questions') — returns { type: 'questions', data, usage }
- Generate path uses zodResponseFormat(MidiCompositionSchema, 'midi_composition') — returns { type: 'composition', data, usage }
- System prompt for generate includes explicit PPQ tick math (480 ticks/beat, 1920 ticks/bar) and 16-32 bar cap
- Validation error context injected as corrective user message when generateAttempt > 0
- Token usage returned in every response for accumulation by useAiCompositionStore

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement /api/ai-compose route** - `2955490` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/app/api/ai-compose/route.ts` — Unified clarify+generate API route with dispatch logic, system prompts, request validation, error handling, and token usage extraction

## Decisions Made
- Single endpoint with dispatch guard on `generateAttempt` field presence — keeps aiCompositionStore state machine simple, no need to track which URL to call
- Local `ChatMessage` type defined in route file for history typing — avoids coupling to OpenAI SDK's internal types while maintaining type safety
- Separate `buildClarifySystemPrompt()` and `buildGenerateSystemPrompt()` functions — clean separation makes it easy to tune each prompt without touching control flow
- Validation errors appended as an extra user message in the conversation (not system message) — preserves the conversation coherence that GPT-4o uses for context

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required. Uses existing OPENAI_API_KEY environment variable.

## Next Phase Readiness
- `/api/ai-compose` route is live and ready for integration with `useAiCompositionStore` (Plan 01 already calls this endpoint)
- Both clarify and generate paths use Structured Outputs — TypeScript types guaranteed at runtime
- Ready for GenerationInput UI component (Plan 03) which surfaces the composition flow to the user
- TypeScript compiles cleanly with zero errors

---
*Phase: 11-ai-composition-mode*
*Completed: 2026-02-27*

## Self-Check: PASSED

- FOUND: src/app/api/ai-compose/route.ts
- FOUND: .planning/phases/11-ai-composition-mode/11-02-SUMMARY.md
- FOUND: 2955490 (Task 1 commit)
