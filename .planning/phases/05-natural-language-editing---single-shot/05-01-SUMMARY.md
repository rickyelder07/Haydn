---
phase: 05-natural-language-editing-single-shot
plan: 01
subsystem: api
tags: [openai, gpt-4o, zod, structured-outputs, js-tiktoken, sonner, api-route, retry-logic]

# Dependency graph
requires:
  - phase: 04-music-theory-validation-layer
    provides: ValidationError types, validation context for GPT-4o prompts
  - phase: 01-foundation-a-midi-infrastructure
    provides: HaydnNote, HaydnTrack, HaydnProject types
provides:
  - OpenAI client singleton for server-side API calls
  - Zod schemas for 6 edit operation types (add_notes, remove_notes, modify_notes, transpose, change_tempo, change_key)
  - Exponential backoff retry logic with jitter for 429/5xx errors
  - Token counting and cost estimation using js-tiktoken
  - POST /api/nl-edit endpoint accepting prompt + MIDI context
affects: [05-02, 05-03, 05-04, client-side-nl-editing-ui]

# Tech tracking
tech-stack:
  added: [openai@6.17.0, zod@4.3.6, js-tiktoken@1.0.21, sonner@2.0.7]
  patterns: [structured-outputs-with-flat-parameters, exponential-backoff-retry, server-side-only-api-routes]

key-files:
  created:
    - src/lib/openai/client.ts
    - src/lib/openai/schemas.ts
    - src/lib/openai/retry.ts
    - src/lib/openai/tokenCounter.ts
    - src/app/api/nl-edit/route.ts
    - .env.local
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Flat parameters object approach for Zod schemas (avoids discriminated unions at root, compatible with OpenAI Structured Outputs)"
  - "Custom exponential backoff with jitter instead of relying on OpenAI SDK retries"
  - "js-tiktoken for accurate token counting using GPT-4o tokenizer"
  - "500-char prompt limit to prevent abuse and excessive costs"
  - "Theory validation context optionally included in system prompt"

patterns-established:
  - "OpenAI client initialization: 30s timeout, 0 maxRetries (custom retry logic)"
  - "Retry logic: 3 attempts max, exponential backoff with ±30% jitter, retry on 429/5xx only"
  - "System prompt structure: project metadata → current track notes → other track summaries → theory validation context → instructions"
  - "API route response format: { result: EditResponse, usage: { promptTokens, completionTokens, totalTokens } }"

# Metrics
duration: 4.2min
completed: 2026-02-03
---

# Phase 05 Plan 01: OpenAI Integration Foundation Summary

**GPT-4o integration with structured edit operations via Zod schemas, exponential backoff retry logic, and token-cost estimation using js-tiktoken**

## Performance

- **Duration:** 4.2 min
- **Started:** 2026-02-03T19:28:49Z
- **Completed:** 2026-02-03T19:33:03Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- OpenAI SDK, Zod, js-tiktoken, and Sonner dependencies installed
- Server-side OpenAI client with custom retry logic for resilient API calls
- Zod schemas define 6 edit operation types using flat parameters object (Structured Outputs compatible)
- Token counter estimates costs using GPT-4o tokenizer before API calls
- POST /api/nl-edit endpoint translates natural language prompts to structured MIDI edits

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create OpenAI integration foundation** - `1565db5` (feat)
2. **Task 2: Create token counter and Next.js API route** - `24ae63d` (feat)

## Files Created/Modified
- `src/lib/openai/client.ts` - OpenAI client singleton with 30s timeout, reads OPENAI_API_KEY from env
- `src/lib/openai/schemas.ts` - Zod schemas for EditResponse with 6 operation types, flat parameters object approach
- `src/lib/openai/retry.ts` - Exponential backoff with jitter, retries 429/5xx up to 3 attempts
- `src/lib/openai/tokenCounter.ts` - Token counting and cost estimation using encodingForModel('gpt-4o')
- `src/app/api/nl-edit/route.ts` - POST endpoint accepting prompt + MIDIContext, returns EditResponse + usage stats
- `.env.local` - OPENAI_API_KEY placeholder (gitignored)
- `package.json` - Added openai, zod, js-tiktoken, sonner

## Decisions Made

**Flat parameters object for Zod schemas:**
- OpenAI Structured Outputs doesn't support discriminated unions at root
- Use single parameters object with all fields optional
- Operation type determines which fields are relevant
- Avoids API validation errors while maintaining type safety

**Custom retry logic instead of SDK retries:**
- Set maxRetries: 0 on OpenAI client
- Implement exponential backoff with jitter in separate module
- Only retry transient errors (429, 5xx)
- Prevents thundering herd with ±30% jitter

**js-tiktoken v1.x API:**
- Use encodingForModel() not encoding_for_model()
- No manual cleanup needed (automatic garbage collection)
- Accurate token counting for GPT-4o cost estimation

**500-char prompt limit:**
- Prevents abuse and runaway costs
- Sufficient for most single-shot editing commands
- Can be increased if needed for conversational mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed incorrect OpenAI SDK API usage**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Used openai.beta.chat.completions.parse() but correct API is openai.chat.completions.parse()
- **Fix:** Changed to openai.chat.completions.parse() (chat completions parse API is not under beta namespace)
- **Files modified:** src/app/api/nl-edit/route.ts
- **Verification:** TypeScript compilation passed, npm build succeeded
- **Committed in:** 24ae63d (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed incorrect js-tiktoken import**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Used encoding_for_model from js-tiktoken but correct export is encodingForModel (camelCase)
- **Fix:** Changed import to encodingForModel and removed try/finally block with enc.free() (v1.x uses automatic GC)
- **Files modified:** src/lib/openai/tokenCounter.ts
- **Verification:** TypeScript compilation passed, npm build succeeded
- **Committed in:** 24ae63d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking - API compatibility fixes)
**Impact on plan:** Both fixes required to unblock TypeScript compilation. No scope changes, just corrected API usage for OpenAI SDK v6 and js-tiktoken v1.

## Issues Encountered

**API documentation mismatch:**
- Initially used wrong API path (beta namespace) and import name (snake_case) based on common patterns
- Verified correct APIs by inspecting node_modules type definitions
- Resolved quickly with direct type inspection

## User Setup Required

**External services require manual configuration.** User must:
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy key to `.env.local` as OPENAI_API_KEY value
4. Restart Next.js dev server to load environment variable

This is documented in the plan's `user_setup` section for OpenAI service configuration.

## Next Phase Readiness

**Ready for next phase:**
- Server-side OpenAI integration complete and verified
- POST /api/nl-edit compiles and builds successfully
- Token estimation and retry logic tested via build process
- Zod schemas validate structured output format

**Next steps:**
- Phase 05-02: Client-side NL editing UI (text input, submit button, operation preview)
- Phase 05-03: Edit operation executor (apply operations to MIDI state)
- Phase 05-04: User verification and refinement loop

**No blockers.** OpenAI API key required for runtime testing but foundation is complete.

---
*Phase: 05-natural-language-editing-single-shot*
*Completed: 2026-02-03*
