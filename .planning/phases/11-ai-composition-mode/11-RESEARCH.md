# Phase 11: AI Composition Mode - Research

**Researched:** 2026-02-27
**Domain:** GPT-4o direct MIDI synthesis, multi-turn clarifying conversation, mode toggle UI, validation retry loop
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | User can toggle between Template and AI composition modes | Mode toggle UI pattern in GenerationInput.tsx — add tab/toggle control, store mode in local state or new store |
| AI-02 | AI mode displays token cost estimate before generation | `estimateTokensAndCost()` already exists in `tokenCounter.ts`; call before generation starts, display inline |
| AI-03 | GPT-4o asks up to 3 clarifying questions about desired composition | New `/api/ai-compose-clarify` route — uses chat.completions (not parse) to return free-form questions; store Q&A turns in new `aiCompositionStore` |
| AI-04 | User can skip questions and generate with defaults if desired | "Skip & Generate" button bypasses question flow; triggers generation with original prompt only |
| AI-05 | GPT-4o generates MIDI JSON directly (not template parameters) | New `MidiJsonSchema` Zod schema with tracks/notes arrays; new `/api/ai-compose-generate` route using Structured Outputs |
| AI-06 | AI-generated MIDI passes through ValidationPipeline (scale, genre, transition validation) | Existing `createDefaultPipeline()` + per-note `pipeline.validate()` loop already proven in `nlGenerationStore.ts` |
| AI-07 | System retries generation if validation fails (up to 3 attempts) | Retry loop in `aiCompositionStore` — pass previous validation errors back to GPT-4o in next attempt's user message |
| AI-08 | System falls back to template mode after 3 failed AI attempts | After 3 failed AI attempts: call existing `assembleProject()` with default params for genre detected from conversation |
| AI-09 | Conversation history visible during question flow | Render Q&A turns from `aiCompositionStore.clarifyingTurns` in inline message list above the prompt input |
| AI-10 | Total token usage and estimated cost displayed after generation | Sum tokens from clarify turns + generate call; render in success banner (pattern exists in `GenerationInput.tsx`) |
</phase_requirements>

---

## Summary

Phase 11 adds an "AI Composition Mode" that replaces the current single-step template generation with a two-stage GPT-4o conversation: first, GPT-4o asks up to 3 clarifying questions to better understand the user's musical intent, then it synthesizes a complete MIDI project as a JSON structure rather than template parameters. The generated MIDI is validated through the existing `ValidationPipeline`, with up to 3 retry attempts feeding previous validation errors back to GPT-4o as corrective context. After 3 failed attempts the system silently falls back to template mode.

The codebase already has nearly everything needed. The token counter (`tokenCounter.ts`), OpenAI client (`client.ts`), retry utility (`withExponentialBackoff`), ValidationPipeline (`createDefaultPipeline`), and Zod+Structured Outputs pattern are all production-proven. The main new work is: a new Zod schema for MIDI JSON output, two new API routes (clarify + generate), a new `aiCompositionStore`, a mode toggle on `GenerationInput`, and an inline Q&A display component.

The biggest design decision is the MIDI JSON schema shape. GPT-4o must output note-level MIDI data directly (not template parameters). The schema must be constrained enough to produce valid output but expressive enough to capture creative intent. The project already uses `HaydnNote` (midi, ticks, durationTicks, velocity) and `HaydnTrack` structures — the schema should mirror these so the assembler has zero transformation work.

**Primary recommendation:** Build a `MidiCompositionSchema` that maps 1:1 to `HaydnProject` tracks/notes; use a single `/api/ai-compose` route that accepts the conversation history and returns either `{type: "question", questions: string[]}` or `{type: "composition", project: MidiCompositionOutput}` — this unified response avoids two separate routes and keeps the state machine simple.

---

## Standard Stack

### Core (already in project — no new installations needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | ^6.17.0 | GPT-4o API calls + Structured Outputs | Already used in 3 routes; `zodResponseFormat` pattern established |
| zod | ^4.3.6 | Schema definition for Structured Outputs | Already used for all OpenAI schemas; `EditResponseSchema`, `GenerationParamsSchema` |
| zustand | ^5.0.10 | AI composition state store | Project standard; every feature has its own store |
| js-tiktoken | ^1.0.21 | Token counting pre-call | Already used in `tokenCounter.ts`; `estimateTokensAndCost()` ready to use |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `withExponentialBackoff` | project | OpenAI retry on 429/5xx | Wrap every OpenAI call; already handles 3 retries with jitter |
| `createDefaultPipeline` | project | ValidationPipeline with Scale+Transition validators | Call after AI generates MIDI; existing interface proven |
| `assembleProject` | project | Template-based MIDI generation | Fallback when AI fails 3 times |
| `estimateTokensAndCost` | project | Pre-call token/cost estimate | Call before user initiates AI generation flow |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Unified `/api/ai-compose` route | Separate clarify + generate routes | Two routes = cleaner separation but more client state; unified = simpler state machine |
| Storing Q&A in `aiCompositionStore` | Extending `conversationStore` | `conversationStore` is for NL editing (EditResponse turns); mixing concerns is a pitfall |
| Retrying in the store | Retrying in the API route | Store-side retry lets UI show attempt progress; API-side retry is opaque to user |

**Installation:** No new packages needed. Everything is already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 11:

```
src/
├── state/
│   └── aiCompositionStore.ts       # New: AI composition mode state + orchestration
├── lib/
│   └── openai/
│       └── aiComposeSchema.ts      # New: MidiCompositionSchema (Zod) + TypeScript types
├── app/api/
│   └── ai-compose/
│       └── route.ts                # New: unified clarify+generate endpoint
└── components/
    └── GenerationInput.tsx         # Modify: add mode toggle + Q&A display + AI mode UI
```

No new directories are required. All patterns follow existing conventions.

### Pattern 1: Mode Toggle in GenerationInput

**What:** Add a two-tab toggle (Template | AI) at the top of `GenerationInput`. Controlled by `useState<'template' | 'ai'>`. Template mode renders existing UI unchanged. AI mode renders new question flow + generate button.

**When to use:** User is on the empty-state page (no project loaded). Mode toggle is only shown in the generation section.

**Example:**
```typescript
// Source: existing GenerationInput.tsx pattern
const [mode, setMode] = useState<'template' | 'ai'>('template');

// Toggle UI
<div className="flex rounded-lg border border-white/10 bg-[#131824] p-1 gap-1 mb-4">
  {(['template', 'ai'] as const).map((m) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
        mode === m
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
          : 'text-tertiary hover:text-secondary'
      }`}
    >
      {m === 'template' ? 'Template' : 'AI Compose'}
    </button>
  ))}
</div>
```

### Pattern 2: AI Composition Store State Machine

**What:** `aiCompositionStore` manages a linear state machine: idle → estimating → questioning → generating → success/error/fallback.

**When to use:** User is in AI mode. Store owns all async operations to keep the component thin.

**Example:**
```typescript
// Source: pattern from nlGenerationStore.ts
type AiCompositionPhase =
  | 'idle'
  | 'estimating'
  | 'questioning'     // Up to 3 clarifying turns
  | 'generating'      // Calling GPT-4o for MIDI JSON
  | 'retrying'        // Validation failed, retrying (up to 3 times)
  | 'success'
  | 'fallback'        // After 3 failed AI attempts, used template
  | 'error';

interface AiCompositionState {
  phase: AiCompositionPhase;
  clarifyingTurns: Array<{ question: string; answer: string }>;
  questionCount: number;          // 0-3
  generateAttempt: number;        // 0-3
  tokenUsage: CumulativeTokenUsage | null;
  costEstimate: TokenEstimate | null;
  lastError: string | null;
}
```

### Pattern 3: MidiCompositionSchema — Direct MIDI JSON

**What:** Zod schema that instructs GPT-4o to output track-level MIDI data directly. Notes use tick-based timing (PPQ = 480, matching `GENERATED_PPQ` in `midiAssembler.ts`).

**When to use:** Only in the AI Composition generate call. NOT used for template mode or NL editing.

**Example:**
```typescript
// Source: pattern from schemas.ts + midi/types.ts
import { z } from 'zod';

const AiNoteSchema = z.object({
  midi: z.number().int().min(0).max(127).describe('MIDI note number 0-127'),
  ticks: z.number().int().min(0).describe('Start time in ticks (PPQ=480)'),
  durationTicks: z.number().int().min(1).describe('Duration in ticks'),
  velocity: z.number().min(0).max(1).describe('Note velocity 0.0-1.0'),
});

const AiTrackSchema = z.object({
  name: z.string().describe('Track name e.g. "Melody - Piano"'),
  channel: z.number().int().min(0).max(15).describe('MIDI channel (9 = drums)'),
  instrumentNumber: z.number().int().min(0).max(127).describe('GM program 0-127'),
  notes: z.array(AiNoteSchema).describe('All notes in this track'),
});

export const MidiCompositionSchema = z.object({
  genre: z.enum(['lofi', 'trap', 'boom-bap', 'jazz', 'classical', 'pop']),
  tempo: z.number().int().min(40).max(240).describe('BPM'),
  key: z.string().describe('Musical key e.g. "C", "Bb"'),
  scale: z.enum(['major', 'minor', 'harmonic minor', 'dorian', 'mixolydian']),
  tracks: z.array(AiTrackSchema).min(1).describe('All tracks in the composition'),
});

export type MidiComposition = z.infer<typeof MidiCompositionSchema>;
```

### Pattern 4: ValidationPipeline Retry Loop

**What:** After GPT-4o generates MIDI JSON, validate each non-drum track through the existing `ValidationPipeline`. If any errors are found, retry with validation errors appended to the user message. Max 3 attempts.

**When to use:** After every AI generation attempt.

**Example:**
```typescript
// Source: pattern from nlGenerationStore.ts lines 106-154
async function validateComposition(project: HaydnProject): Promise<string[]> {
  const pipeline = createDefaultPipeline();
  const allErrors: string[] = [];

  for (const track of project.tracks) {
    if (track.channel === 9) continue; // skip drums

    for (const note of track.notes) {
      const context: ValidationContext = {
        note, track, project, editType: 'add'
      };
      const result = pipeline.validate(context);
      if (!result.valid) {
        result.errors.forEach(e => allErrors.push(e.message));
      }
    }
  }
  return [...new Set(allErrors)]; // deduplicate
}

// In retry loop (inside store action):
for (let attempt = 0; attempt < 3; attempt++) {
  const composition = await callGenerateApi(conversationHistory, retryContext);
  const project = compositionToHaydnProject(composition);
  const errors = await validateComposition(project);

  if (errors.length === 0) {
    return project; // success
  }

  retryContext = `Previous attempt failed validation:\n${errors.join('\n')}\nPlease fix these issues.`;
}
// After 3 failures: fall back to template
```

### Pattern 5: Unified API Route

**What:** `/api/ai-compose` accepts `{ prompt, clarifyingHistory, generateAttempt?, validationErrors? }` and returns either `{ type: 'questions', questions: string[] }` or `{ type: 'composition', data: MidiComposition }`.

The first call (no `generateAttempt`) checks if clarification is needed and returns questions. Once the user answers all questions (or skips), the final call includes `generateAttempt: 0` to trigger composition generation.

**When to use:** Two distinct call signatures share one route — use `generateAttempt` field as discriminator.

```typescript
// Source: pattern from nl-generate/route.ts
export async function POST(request: NextRequest) {
  const { prompt, clarifyingHistory, generateAttempt, validationErrors } = await request.json();

  if (generateAttempt !== undefined) {
    // GENERATE phase: use Structured Outputs + MidiCompositionSchema
    return handleGenerate(prompt, clarifyingHistory, generateAttempt, validationErrors);
  } else {
    // CLARIFY phase: use regular chat.completions (free-form questions)
    return handleClarify(prompt, clarifyingHistory);
  }
}
```

### Assembling HaydnProject from MidiComposition

**What:** Convert GPT-4o's `MidiComposition` output into `HaydnProject` format. This is the bridge between AI output and the existing project store.

```typescript
// Source: pattern from midiAssembler.ts
function compositionToHaydnProject(comp: MidiComposition): HaydnProject {
  const ppq = 480; // Match GENERATED_PPQ
  const maxTick = Math.max(...comp.tracks.flatMap(t => t.notes.map(n => n.ticks + n.durationTicks)));

  return {
    originalFileName: null,
    sourceFormat: 'new',
    metadata: {
      name: `${comp.genre} - ${comp.key} ${comp.scale}`,
      ppq,
      tempos: [{ ticks: 0, bpm: comp.tempo }],
      timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
      keySignatures: [{ ticks: 0, key: comp.key, scale: comp.scale === 'major' ? 'major' : 'minor' }],
    },
    tracks: comp.tracks.map(t => ({
      name: t.name,
      channel: t.channel,
      instrumentNumber: t.instrumentNumber,
      instrumentName: getInstrumentName(t.instrumentNumber) || 'Unknown',
      notes: t.notes,
      controlChanges: [],
    })),
    durationTicks: maxTick,
  };
}
```

### Anti-Patterns to Avoid

- **Reusing `conversationStore` for AI composition turns:** `conversationStore` holds `ConversationTurn` objects that contain `EditResponse` (edit operations). AI composition Q&A is structurally different — mixing them breaks type safety and session management.
- **Running validation inside the API route:** Validation requires the full `HaydnProject` context. Do it in the store after assembly, not in the route handler.
- **Showing raw validation errors to GPT-4o:** Deduplicate errors before sending back. A 50-note scale violation produces 50 identical error strings; send the unique set to stay within context limits.
- **Blocking user while estimating tokens:** Token estimation is sync (tiktoken) and takes <5ms. Don't show a loading state for it — just update cost display inline.
- **Using `withExponentialBackoff` for the validation retry loop:** `withExponentialBackoff` handles transient API errors (429/5xx). The validation retry loop is a semantic retry (different prompt), not a transient error retry. Keep them separate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token counting | Custom tokenizer | `estimateTokensAndCost()` in `tokenCounter.ts` | Already uses `js-tiktoken` with gpt-4o encoder; handles system + user separately |
| OpenAI retry on 429 | Custom backoff | `withExponentialBackoff` in `retry.ts` | Already handles jitter, max delay, retryable status codes |
| MIDI validation | Custom theory rules | `createDefaultPipeline()` in `ValidationPipeline.ts` | ScaleValidator + TransitionValidator already proven in 4 phases |
| Template fallback | Custom template caller | `assembleProject(params)` in `midiAssembler.ts` | Accepts `GenerationParams`; fallback only needs genre + defaults |
| Schema typed output | Manual JSON parsing | `zodResponseFormat(MidiCompositionSchema, ...)` | Existing pattern; GPT-4o with Structured Outputs guarantees schema conformance |
| Conversation message building | Custom array builder | Pattern from `messageBuilder.ts` | Simple `{role, content}` array — inline it; don't copy the conversation builder (different message structure) |

**Key insight:** The project has 4 phases of GPT-4o integration infrastructure. Every primitive needed for Phase 11 exists and is tested in production. This phase is 80% wiring + 20% new schema design.

---

## Common Pitfalls

### Pitfall 1: MIDI JSON Token Bloat
**What goes wrong:** Asking GPT-4o to generate a full song with 500+ notes creates output tokens in the range of 5,000-15,000 tokens ($0.05-$0.15 per generation). This is acceptable for this use case but must be communicated to the user.
**Why it happens:** Each note is a JSON object with 4 fields. A 32-bar composition with 4 tracks averages 300-800 notes.
**How to avoid:** Cap composition length. The system prompt should instruct GPT-4o to generate 16-32 bars maximum. Tune `estimatedOutputSize` in `estimateTokensAndCost()` to 3000 tokens for AI mode (vs. 500 for template mode).
**Warning signs:** Response takes >15 seconds; cost estimate shows >$0.10.

### Pitfall 2: GPT-4o Tick Arithmetic Errors
**What goes wrong:** GPT-4o generates notes where `ticks` values don't align to musical grid (e.g., note at tick 1234 instead of 1920 for bar 2). These pass schema validation but sound wrong.
**Why it happens:** GPT-4o doesn't inherently understand MIDI tick math. "Bar 2, beat 1" requires knowing PPQ=480, time sig 4/4, so tick = 1 * 4 * 480 = 1920.
**How to avoid:** System prompt MUST include: PPQ value (480), tick math examples, and instruction to align notes to beats. Example: "Bar 1 beat 1 = tick 0, bar 1 beat 2 = tick 480, bar 2 beat 1 = tick 1920."
**Warning signs:** Generated notes sound rhythmically scrambled; velocities are all identical (1.0 or 0.0).

### Pitfall 3: Overlapping Notes in Same Track/Channel
**What goes wrong:** GPT-4o generates notes that overlap in time on the same pitch/channel. This is valid MIDI but sounds wrong and confuses the piano roll display.
**Why it happens:** GPT-4o doesn't simulate MIDI sequencer constraints; it treats notes as independent items.
**How to avoid:** Add post-processing step after compositionToHaydnProject: sort notes by ticks, check for overlaps on same pitch, trim `durationTicks` of overlapping note. Do this in the store, not the API route.
**Warning signs:** PianoRoll renders notes stacked on same row at same time.

### Pitfall 4: Validation False-Positive Retry Loop
**What goes wrong:** ValidationPipeline reports errors for notes that are musically intentional (e.g., a blues 7th that's technically "out of scale"). The system retries 3 times all generating the same intentional notes, then falls back to template.
**Why it happens:** `ScaleValidator` uses strict mode; blues/jazz intentionally bends scale rules.
**How to avoid:** For AI composition, call `createDefaultPipeline()` WITHOUT `GenreValidator` (the genre validator is strictest). Only check `ScaleValidator` + `TransitionValidator`. Consider using WARNING severity to log but not block. The existing code in `nlGenerationStore.ts` lines 106-154 already does this correctly — only retries on `error` severity, ignores `warning` severity. Follow the same pattern.
**Warning signs:** System always falls back to template; console shows repeated validation errors for same notes.

### Pitfall 5: Cost Estimate Shown After Questions Are Answered
**What goes wrong:** Cost estimate is shown at the start (before questions), but the actual prompt sent to GPT-4o for generation will include the full Q&A history, making the estimate inaccurate.
**Why it happens:** The system prompt + Q&A history significantly increases input token count vs. just the original prompt.
**How to avoid:** Re-estimate cost AFTER question flow completes, using the full conversation history as input. Show the updated estimate before the final "Generate" button.
**Warning signs:** Displayed cost is $0.003 but actual cost is $0.015 due to conversation context.

### Pitfall 6: State Leakage Between Modes
**What goes wrong:** User generates in Template mode, switches to AI mode, then AI mode shows stale state (previous Q&A, old errors).
**Why it happens:** `aiCompositionStore` is not reset when mode changes.
**How to avoid:** Reset `aiCompositionStore` to idle state when mode toggle changes. In `GenerationInput`: `const { reset } = useAiCompositionStore(); useEffect(() => { if (mode === 'ai') reset(); }, [mode]);`
**Warning signs:** AI mode shows questions from a previous session on first load.

---

## Code Examples

### Clarify API Route System Prompt
```typescript
// Source: pattern from nl-generate/route.ts system prompt builder
function buildClarifySystemPrompt(): string {
  return `You are a music composition assistant. A user wants you to compose original MIDI music.
Your job is to ask up to 3 clarifying questions to better understand their musical vision.

Ask ONLY questions that will meaningfully change the composition. Good questions:
- "What mood or emotion should the piece convey? (e.g., melancholic, energetic, peaceful)"
- "How long should it be? (e.g., 16 bars, 32 bars)"
- "Any specific instruments or style elements?"

Rules:
- Ask at most 3 questions
- Ask them all at once (don't wait for answers to ask more)
- If the user's prompt is already detailed, return an empty questions array
- Keep questions concise and non-technical

Respond with JSON: { "questions": ["...", "..."] }`;
}
```

### Generate API Route System Prompt
```typescript
// Source: pattern informed by nl-generate/route.ts + MIDI tick math
function buildGenerateSystemPrompt(): string {
  return `You are a MIDI composer. Generate a complete, original MIDI composition as JSON.

## Timing Rules (CRITICAL)
- PPQ (Pulses Per Quarter Note) = 480
- Beat 1 of bar 1 = tick 0
- Each beat = 480 ticks
- Bar length (4/4) = 4 * 480 = 1920 ticks
- Example: bar 3, beat 2 = (2 * 1920) + (1 * 480) = 4320 ticks

## Composition Rules
- Generate 16-32 bars maximum
- Use multiple tracks (drums on channel 9, others on 0-3)
- Velocity: 0.0-1.0 (typical notes: 0.6-0.85)
- Avoid overlapping notes on the same pitch in the same track
- Align note start times to beat grid (multiples of 480)

## Output
Return complete JSON matching the MidiCompositionSchema.
Include ALL tracks needed for the genre.`;
}
```

### Token Cost Display Pattern
```typescript
// Source: existing GenerationInput.tsx success state pattern
// After Q&A complete, before generating:
const estimate = estimateTokensAndCost(
  systemPrompt,
  fullConversationText,
  3000 // AI composition outputs ~3000 tokens
);

// Display:
<div className="text-xs text-cyan-400/60 mt-1">
  Estimated cost: ~${estimate.estimatedCost.toFixed(3)} ({estimate.totalTokens} tokens)
</div>
```

### Cumulative Token Usage Tracking
```typescript
// Source: pattern from conversationStore.ts getTotalTokens/getTotalCost
interface CumulativeTokenUsage {
  clarifyTokens: number;
  generateTokens: number;
  totalTokens: number;
  totalCost: number; // USD
}

// After generation completes, display in success banner:
<div className="mt-3 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 text-sm">
  <div className="font-medium">AI composition complete!</div>
  <div className="text-cyan-400/60 text-xs mt-0.5">
    {tokenUsage.totalTokens} tokens (clarify: {tokenUsage.clarifyTokens}, generate: {tokenUsage.generateTokens}) · ~${tokenUsage.totalCost.toFixed(4)}
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Template parameter extraction | Direct MIDI JSON synthesis | Phase 11 goal | GPT-4o generates note-level data instead of high-level params; more creative control but higher token cost |
| Single-shot generation | Multi-turn with clarifying questions | Phase 11 goal | Up to 4 API calls per generation (3 clarify + 1 generate) vs. 1 |
| Validation as warning-only | Validation with retry loop | Phase 11 goal | Generation fails fast and self-corrects instead of producing theory violations silently |
| POST /api/nl-generate | POST /api/ai-compose | Phase 11 | New route; nl-generate remains for template mode |

**Note:** Template mode (`nl-generate` + `assembleProject`) remains UNCHANGED. AI mode is additive. Both modes coexist under the same `GenerationInput` component controlled by a mode toggle.

---

## Open Questions

1. **Question schema format for clarify response**
   - What we know: The route returns free-form JSON `{ questions: string[] }`. This is NOT using Structured Outputs (response_format) — it uses regular chat completion with a JSON-instructed system prompt.
   - What's unclear: Should we use `response_format: { type: 'json_object' }` (legacy) or Structured Outputs with a `QuestionsSchema`? The latter is more reliable.
   - Recommendation: Use `zodResponseFormat(QuestionsSchema, 'questions')` for the clarify call too. Define `QuestionsSchema = z.object({ questions: z.array(z.string()).max(3) })`. Consistent with project pattern.

2. **What happens if GPT-4o skips clarification for detailed prompts?**
   - What we know: The clarify system prompt instructs GPT-4o to return `{ questions: [] }` if the prompt is detailed enough.
   - What's unclear: Should the UI auto-advance to generation when `questions.length === 0`, or show a "No questions — ready to generate" state?
   - Recommendation: Auto-advance. If `questions.length === 0` after clarify call, immediately proceed to generation phase. This makes the UX feel seamless for detailed prompts.

3. **`questionCount` vs. turn limit**
   - What we know: AI-03 says "up to 3 clarifying questions." This means 3 individual questions, not 3 turns. One turn could have 3 questions.
   - What's unclear: Should questions all be asked in a single turn or one per turn?
   - Recommendation: Ask all questions in a single API call (one clarify turn). Return up to 3 questions as an array. User answers each in a single textarea or inline inputs. This is simpler than multiple back-and-forth turns and stays within the "up to 3 questions" requirement. Eliminates the ambiguity of "question turn vs. question count."

4. **MIDI JSON size and context window**
   - What we know: GPT-4o context window is 128k tokens. A 32-bar composition generates roughly 1,500-4,000 output tokens.
   - What's unclear: Is there a risk of hitting context limits when passing validation errors + full conversation back for retry?
   - Recommendation: LOW risk. Even with 3 questions + answers + system prompt (~2,000 tokens) + validation errors (~200 tokens) = ~2,200 input tokens. Well within limits.

---

## Validation Architecture

> `workflow.nyquist_validation` is not present in `.planning/config.json` (field not set). Skip section.

---

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/lib/openai/tokenCounter.ts` — `estimateTokensAndCost()` API, GPT-4o pricing constants ($2.50/$10.00 per M)
- Project codebase: `src/lib/openai/schemas.ts` — `zodResponseFormat` pattern, `GenerationParamsSchema` structure
- Project codebase: `src/state/nlGenerationStore.ts` — validation-with-warning pattern (lines 106-154), ValidationPipeline usage
- Project codebase: `src/lib/music-theory/validators/ValidationPipeline.ts` — `createDefaultPipeline()`, `validate()` interface
- Project codebase: `src/lib/nl-generation/midiAssembler.ts` — `assembleProject()` as fallback entrypoint
- Project codebase: `src/app/api/nl-generate/route.ts` — proven route architecture for structured outputs
- Project codebase: `src/lib/midi/types.ts` — `HaydnNote`, `HaydnTrack`, `HaydnProject` structures for schema design
- Project codebase: `vitest.config.ts` — test framework confirmed (Vitest, globals: true, node environment)

### Secondary (MEDIUM confidence)
- OpenAI API pricing page (https://openai.com/api/pricing/) — confirmed $2.50/M input, $10/M output for gpt-4o (matches existing `tokenCounter.ts`)
- OpenAI Structured Outputs docs (https://platform.openai.com/docs/guides/structured-outputs) — confirmed `gpt-4o-2024-08-06` supports Structured Outputs with 100% schema adherence on evals

### Tertiary (LOW confidence)
- Estimated 1,500-4,000 output tokens for 16-32 bar MIDI composition — based on note count estimate (300-800 notes × ~5 tokens/note), not empirically measured

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entire stack is pre-existing; no new dependencies
- Architecture: HIGH — all patterns have precedent in the codebase (validated in phases 5, 6, 8)
- Schema design (MidiCompositionSchema): MEDIUM — structure is clear, but GPT-4o's ability to generate correct tick arithmetic needs empirical testing
- Pitfalls: HIGH — pitfalls are based on actual code analysis of what the ValidationPipeline does and how GPT-4o behaves with MIDI constraints

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (OpenAI pricing could change; core architecture is stable)
