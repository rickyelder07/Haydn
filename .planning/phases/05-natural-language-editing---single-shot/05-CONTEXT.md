# Phase 5: Natural Language Editing - Single-Shot - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users edit MIDI using natural language prompts without conversational context. The system translates text commands into structured edit operations that respect music theory validation (Phase 4). This is single-shot editing (no conversation history) optimized for token efficiency. Generation from scratch (Phase 6) and multi-turn conversations (Phase 8) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Prompt input experience
- Input appears **above piano roll** (always visible, fixed position)
- Submission via **both Enter key and button click** (flexibility)
- **Tooltip with examples** on hover/info icon (not inline placeholder cycling)
- **Character/content limits**: Claude's discretion (balance token costs with expressiveness)

### GPT-4o integration pattern
- Context sent to GPT: **Complete current track + summary of other tracks** (note counts, ranges, track names)
- **Include theory state only when validation enabled** (current key, genre, rules when toggle is on)
- Response format: **Claude's discretion** (choose most reliable structured parsing approach)
- API failure handling: **Retry with exponential backoff** (2-3 attempts with increasing delays)

### Edit execution feedback
- **Text summary + highlight changed notes** in piano roll (dual feedback: what changed + where)
- **Immediate execution** (trust + undo model, no preview confirmation step)
- Theory violations: **Apply edit with warning banner** (don't block, but inform user of rule breaks)
- Message persistence: **Success fades (3-4s auto-dismiss), errors persist** (manual dismiss required)

### Token/cost transparency
- Display **both tokens and estimated USD cost** with feedback message (e.g., "450 tokens (~$0.003)")
- **Note:** Cost display is temporary — plan to remove in production (post-Phase 8)
- **No session total tracking** (only per-edit costs shown)
- Cost appears **with feedback message** (integrated with success/error text)
- **Block prompts expected to cost >$0.50** (show warning, ask user to confirm before proceeding)

### Claude's Discretion
- Exact character limit strategy for prompts (balance UX and token costs)
- GPT-4o response format structure (JSON, function calling, or hybrid)
- Specific retry backoff timings (2s, 5s, 10s intervals or similar)
- Note highlight duration/animation style for changed notes
- Cost calculation logic and price-per-token constants

</decisions>

<specifics>
## Specific Ideas

- Input should feel like a command palette — quick, unobtrusive, always accessible
- "Make melody happier" and "Speed up to 140 BPM" should be canonical examples in tooltip
- Cost display is explicitly temporary (remove when project moves to production)
- Immediate execution mirrors manual piano roll editing (undo is safety net)
- Theory warnings don't block (different from Phase 4 manual editing behavior)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. No new capabilities suggested beyond single-shot NL editing.

</deferred>

---

*Phase: 05-natural-language-editing---single-shot*
*Context gathered: 2026-02-02*
