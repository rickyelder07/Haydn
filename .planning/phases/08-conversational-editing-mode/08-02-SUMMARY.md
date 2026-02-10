---
phase: 08-conversational-editing-mode
plan: 02
subsystem: nl-conversation
tags: [api, message-builder, gpt4o, openai]
dependency_graph:
  requires: [nl-conversation-types, openai-client, nl-edit-schemas, messageBuilder]
  provides: [conversation-api-endpoint, message-history-management]
  affects: [future-conversation-ui]
tech_stack:
  added: [conversation-api-route, message-builder-helpers]
  patterns: [message-history-management, context-preservation, pronoun-resolution]
key_files:
  created:
    - src/lib/nl-conversation/messageBuilder.ts
    - src/app/api/nl-conversation/route.ts
  modified: []
decisions:
  - conversationHistory parameter optional (defaults to empty array for first turn)
  - System prompt includes conversation-specific instructions for pronoun resolution
  - Message array structure: system + history + new prompt
  - Edit execution remains client-side (API returns EditResponse, store handles execution)
metrics:
  duration_seconds: 702
  duration_minutes: 11.7
  tasks_completed: 2
  files_created: 2
  commits: 2
  completed_at: "2026-02-10T03:32:47Z"
---

# Phase 08 Plan 02: Conversational API Route Summary

**One-liner:** Multi-turn conversation API endpoint with message history management and GPT-4o context preservation for pronoun resolution

## What Was Built

Created API infrastructure for conversational editing with full conversation history context:

1. **Message Builder Helper** (`src/lib/nl-conversation/messageBuilder.ts`):
   - `buildMessagesFromTurns()`: Converts ConversationTurn array to OpenAI messages format
     - Each turn adds user message (turn.userPrompt) + assistant message (JSON.stringify(turn.assistantResponse))
     - Does NOT include system prompt (added separately)
   - `buildSystemPromptForConversation()`: Extends nl-edit system prompt with conversation-specific instructions
     - Copies base system prompt logic from nl-edit/route.ts
     - Adds "Conversation Context" section with pronoun resolution guidance
     - Instructs GPT to resolve "it", "them", "the melody" from conversation history
     - Warns about undo button usage instead of conversational undo requests
     - Encourages referencing previous changes in explanations

2. **Conversation API Route** (`src/app/api/nl-conversation/route.ts`):
   - POST endpoint at /api/nl-conversation
   - Request body: `{ prompt, conversationHistory?, context }`
   - conversationHistory optional (defaults to [] for first turn)
   - Message building: system prompt + history + new prompt
   - Uses same patterns as nl-edit:
     - withExponentialBackoff for retry logic
     - openai.chat.completions.parse with EditResponseSchema
     - Model: gpt-4o-2024-08-06
   - Response: `{ result: EditResponse, usage: { promptTokens, completionTokens, totalTokens } }`
   - Error handling: 400 for invalid request, 500 for OpenAI errors

## Key Decisions

**conversationHistory optional:**
Makes API flexible for both first turns (no history) and subsequent turns (with history). Client decides when to start new session vs continue existing.

**System prompt includes conversation instructions:**
Adds specific guidance for multi-turn context: pronoun resolution, undo warning, change referencing. This improves GPT-4o's ability to understand context references like "make it louder" by looking at previous assistant responses.

**Message array structure:**
System prompt first, then full history, then new prompt. This follows OpenAI best practices for conversation context preservation.

**Edit execution client-side:**
API only returns EditResponse - actual note manipulation happens in the store after API response. This keeps API stateless and allows store to handle undo/redo correctly.

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Consumes:**
- `@/app/api/nl-edit/route` - MIDIContext interface
- `@/lib/openai/client` - OpenAI client instance
- `@/lib/openai/schemas` - EditResponseSchema for structured outputs
- `@/lib/openai/retry` - withExponentialBackoff retry logic
- `@/lib/nl-conversation/types` - ConversationTurn interface
- `@/lib/nl-conversation/messageBuilder` - Message building helpers

**Provides:**
- POST /api/nl-conversation endpoint for multi-turn editing
- Message building utilities for conversation history

**Affects:**
- Next plan (08-03) will integrate this API into CommandInput UI
- Conversation store will use this endpoint for multi-turn edits

## Verification Results

All success criteria met:

- [x] API route accepts conversationHistory parameter
- [x] Message array properly includes system prompt, history, and new prompt
- [x] GPT-4o receives full conversation context for pronoun resolution
- [x] Response includes usage stats for cost tracking
- [x] Error handling consistent with existing nl-edit route
- [x] TypeScript compiles without errors (`npx tsc --noEmit` passes)
- [x] messageBuilder exports both helper functions
- [x] API route exports POST function
- [x] API route imports and uses messageBuilder functions

## Task Breakdown

| Task | Description | Commit | Duration |
|------|-------------|--------|----------|
| 1 | Create message builder helper | a885acf | ~6 min |
| 2 | Create conversation API route | 7e3d3b7 | ~6 min |

## Self-Check: PASSED

**Created files verified:**
```bash
[ -f "src/lib/nl-conversation/messageBuilder.ts" ] && echo "FOUND"
[ -f "src/app/api/nl-conversation/route.ts" ] && echo "FOUND"
```
- FOUND: src/lib/nl-conversation/messageBuilder.ts
- FOUND: src/app/api/nl-conversation/route.ts

**Commits verified:**
```bash
git log --oneline --all | grep -E "(a885acf|7e3d3b7)"
```
- FOUND: a885acf (feat: create message builder helper)
- FOUND: 7e3d3b7 (feat: create conversation API route)

**Exports verified:**
- buildMessagesFromTurns exported from messageBuilder.ts
- buildSystemPromptForConversation exported from messageBuilder.ts
- POST exported from route.ts

All verification checks passed.
