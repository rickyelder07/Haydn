---
phase: 06-natural-language-generation
plan: 01
subsystem: api
tags: [openai, gpt-4o, zod, natural-language, generation, structured-outputs]

# Dependency graph
requires:
  - phase: 05-natural-language-editing-single-shot
    provides: OpenAI client, retry logic, Zod schema patterns
provides:
  - GenerationParamsSchema for structured musical parameter extraction
  - POST /api/nl-generate endpoint for parsing generation prompts
  - Genre defaults for lofi, trap, boom-bap, jazz, classical, pop
affects: [06-02-melody-generation, 06-03-chord-generation, 06-04-drum-generation, generation-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [genre-default-tables, flat-required-schema-for-generation, parameter-extraction-without-midi-context]

key-files:
  created:
    - src/app/api/nl-generate/route.ts
  modified:
    - src/lib/openai/schemas.ts

key-decisions:
  - "All GenerationParams fields required - GPT fills defaults for unspecified values"
  - "System prompt includes genre defaults table for all 6 genres"
  - "Default structure: intro(4), verse(8), chorus(8), verse(8), chorus(8), outro(4)"
  - "Emotion as valence/arousal coordinates for expressive generation"
  - "GM instrument numbers per role (drums, bass, melody, chords)"

patterns-established:
  - "Genre defaults table: Each genre has default tempo range, scale, time signature, keys, emotion coordinates, instruments"
  - "Parameter extraction without MIDI context: Much smaller prompts (~500 tokens vs 2000-5000 for editing)"
  - "Flat required schema approach: All fields required, GPT must fill in defaults"

# Metrics
duration: 1.9min
completed: 2026-02-05
---

# Phase 6 Plan 01: LLM Parameter Extraction Summary

**GPT-4o extracts structured musical parameters (genre, tempo, key, scale, structure, emotion, instrumentation) from natural language generation prompts with genre-appropriate defaults**

## Performance

- **Duration:** 1.9 min (114 seconds)
- **Started:** 2026-02-05T21:12:09Z
- **Completed:** 2026-02-05T21:14:03Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- GenerationParamsSchema defines 10 structured fields with Zod for OpenAI Structured Outputs
- POST /api/nl-generate endpoint parses prompts into GenerationParams using GPT-4o
- Genre defaults table covers all 6 genres (lofi, trap, boom-bap, jazz, classical, pop) with tempo, scale, keys, emotion, instruments
- All fields required - GPT must fill in genre-appropriate defaults for unspecified values
- Much smaller system prompts (~500 tokens) vs editing (~2000-5000) due to no MIDI context

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GenerationParamsSchema to schemas.ts** - `33bcb4c` (feat)
2. **Task 2: Create POST /api/nl-generate endpoint** - `e3035a2` (feat)

## Files Created/Modified
- `src/lib/openai/schemas.ts` - Added GenerationParamsSchema with 10 fields (genre, tempo, key, scale, timeSignature, structure, emotion, instrumentation, description), exported GenerationParams type
- `src/app/api/nl-generate/route.ts` - POST endpoint that validates prompt, builds system prompt with genre defaults, calls GPT-4o with zodResponseFormat, returns parsed GenerationParams with token usage

## Decisions Made
- **All fields required with defaults:** Unlike editing where parameters are optional, generation schema makes all fields required. GPT-4o must fill in genre-appropriate defaults for any values not explicitly specified in the user's prompt.
- **Genre defaults table in system prompt:** Includes tempo ranges, scale preferences, common keys, emotion coordinates, and GM instrument numbers for each of 6 genres. Enables GPT-4o to make musically coherent defaults.
- **Default structure provided:** If user doesn't specify structure, use intro(4), verse(8), chorus(8), verse(8), chorus(8), outro(4) as standard pop/rock song form.
- **Emotion as coordinates:** Valence (-1 sad to 1 happy) and arousal (-1 calm to 1 energetic) provide expressive guidance for algorithmic generation in later plans.
- **Instrumentation per role:** Each instrument defined by role (drums, bass, melody, chords) and GM number (0-127) for clear arrangement structure.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compilation passed, all imports resolved correctly, schema patterns followed Phase 5 conventions.

## User Setup Required

None - no external service configuration required. Uses existing OPENAI_API_KEY from Phase 5.

## Next Phase Readiness

Ready for Plan 02 (melody generation algorithms). GenerationParams provides all musical constraints needed for algorithmic MIDI generation:
- Genre, tempo, key, scale for music theory compliance
- Structure (sections with bar counts) for form
- Emotion (valence/arousal) for expressive character
- Instrumentation (role + GM number) for orchestration

No blockers. System prompt is complete and tested with all genre defaults documented.

---
*Phase: 06-natural-language-generation*
*Completed: 2026-02-05*
