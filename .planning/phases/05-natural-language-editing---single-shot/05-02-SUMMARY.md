---
phase: 05-natural-language-editing-single-shot
plan: 02
subsystem: nl-edit
tags: [zustand, openai, gpt-4o, midi-editing, context-building, undo-redo]

# Dependency graph
requires:
  - phase: 05-01
    provides: OpenAI API route with structured output schemas
  - phase: 03-01
    provides: Edit store with undo/redo support
  - phase: 04-01
    provides: Validation store with theory state
provides:
  - Context builder that serializes project state into compact MIDI JSON
  - Edit executor that applies 6 operation types with undo support
  - NL edit store that orchestrates the full async pipeline
affects: [05-03-ui-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Context builder serializes current track with full notes, other tracks as summaries"
    - "Edit executor uses editStore actions (not direct mutations) to preserve undo/redo"
    - "Store calculates token usage and estimated cost ($2.50/M input, $10/M output)"

key-files:
  created:
    - src/lib/nl-edit/contextBuilder.ts
    - src/lib/nl-edit/editExecutor.ts
    - src/state/nlEditStore.ts
  modified: []

key-decisions:
  - "Context builder throws errors for missing project/track (clear failures vs silent defaults)"
  - "Edit executor continues on errors (partial execution) rather than all-or-nothing"
  - "Reverse-order deletion in remove_notes to preserve indices during iteration"
  - "Token cost calculation built into store for immediate user feedback"

patterns-established:
  - "Context builder reads from multiple stores via getState() pattern"
  - "Edit executor applies operations through editStore actions to maintain history"
  - "Store handles all async error cases: context build, API call, execution"

# Metrics
duration: 1 min
completed: 2026-02-03
---

# Phase 05 Plan 02: Client-Side NL Editing Orchestration Layer Summary

**Zustand store with submitPrompt() orchestrates: context build → API call → execution → state update, preserving undo/redo**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-03T22:30:55Z
- **Completed:** 2026-02-03T22:32:49Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Context builder serializes project state into compact MIDI JSON (current track with full notes, other tracks as summaries)
- Edit executor applies all 6 operation types (add_notes, remove_notes, modify_notes, transpose, change_tempo, change_key) using editStore actions to preserve undo/redo
- NL edit store manages full async flow with error handling at each step (context build, API call, execution)
- Token usage tracked and cost calculated ($2.50/M input, $10/M output tokens)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create context builder** - `4e22ed5` (feat)
2. **Task 2: Create edit executor with undo support** - `0c44741` (feat)
3. **Task 3: Create NL edit store with async flow** - `f91bfaf` (feat)

## Files Created/Modified

- `src/lib/nl-edit/contextBuilder.ts` - Builds compact MIDI context for GPT-4o prompts
- `src/lib/nl-edit/editExecutor.ts` - Applies GPT-4o edit operations to project state with undo support
- `src/state/nlEditStore.ts` - Zustand store for NL editing async flow

## Decisions Made

**Context builder error handling:** Throw errors for missing project/track rather than returning null/undefined. Clear error messages ("No project loaded", "No track selected") make debugging easier.

**Partial execution on errors:** Edit executor continues after operation failures rather than stopping on first error. Allows user to see what succeeded and what failed.

**Reverse-order deletion:** When removing notes by index, sort indices descending before deletion to avoid index shifting. Standard pattern for bulk deletion operations.

**Token cost calculation in store:** Calculate estimated cost immediately using GPT-4o pricing ($2.50/M input, $10/M output). Provides user feedback on API usage.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 05-03:** UI integration with prompt input, loading states, and result display.

**Bridge layer complete:** Context builder produces compact JSON matching API expectations, edit executor handles all 6 operation types with undo support, store orchestrates full pipeline from prompt to state updates.

**Error handling comprehensive:** Errors caught at context build (missing project/track), API call (network/OpenAI errors), and execution (invalid operations) stages.

---
*Phase: 05-natural-language-editing-single-shot*
*Completed: 2026-02-03*
