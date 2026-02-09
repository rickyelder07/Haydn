# Phase 8: Conversational Editing Mode - Research

**Researched:** 2026-02-09
**Domain:** Conversational AI, Multi-Turn Context Management, Chat UI Patterns
**Confidence:** HIGH

## Summary

Phase 8 extends the single-shot NL editing from Phase 5 into a multi-turn conversational experience. The research reveals that conversational AI in 2026 has consolidated around several key patterns: manual message history management (OpenAI Chat Completions API), streaming responses for perceived performance, and specialized React component libraries for chat UI.

The OpenAI Assistants API has been deprecated (shutdown August 26, 2026) in favor of the simpler Responses API, which means server-side conversation state management is the recommended approach. For this phase, we'll extend the existing `/api/nl-edit` route with conversation history tracking, add a chat UI component, and integrate with the existing undo/redo history manager.

**Primary recommendation:** Build a conversational layer on top of existing Phase 5 infrastructure by adding message history to API calls, creating a chat UI component, and maintaining conversation state in a new Zustand store. Use manual message array management (not deprecated Assistants API) and leverage existing token counting and retry logic.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| openai | 6.17.0 (current) | OpenAI API client with structured outputs | Already in use for Phase 5; supports `chat.completions.parse()` with Zod schemas |
| zod | 4.3.6 (current) | Schema validation for structured outputs | Already in use; `zodResponseFormat()` helper for GPT-4o structured outputs |
| zustand | 5.0.10 (current) | Conversation state management | Already in use; lightweight, excellent for chat history |
| js-tiktoken | 1.0.21 (current) | Token counting for cost estimation | Already in use for Phase 5 prompt validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui AI components | Latest | Pre-built chat UI components | If rapid UI development needed; copy-paste philosophy matches project style |
| react-chrono | Latest | Timeline visualization for edit history | If visual timeline of conversation turns needed |
| Vercel AI SDK | 5.x | useChat hook, streaming helpers | NOT RECOMMENDED - adds dependency for features we can build ourselves |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual message array | OpenAI Responses API | Responses API is newer but requires migration; manual arrays work fine for our use case |
| Manual message array | OpenAI Assistants API (deprecated) | Assistants API shuts down August 26, 2026 - DO NOT USE |
| Custom chat UI | Vercel AI SDK useChat | AI SDK adds dependency and abstracts away control; our needs are simple enough for custom implementation |
| Zustand for conversation | React Context | Zustand already in use project-wide; Context adds no benefits here |

**Installation:**
```bash
# No new dependencies required - Phase 5 stack sufficient
# Optional: shadcn/ui AI components if chat UI components desired
npx shadcn@latest add ai-message ai-prompt-input ai-conversation
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── nl-conversation/
│       ├── types.ts              # Message types, ConversationTurn interface
│       ├── messageBuilder.ts     # Build OpenAI message arrays from conversation history
│       └── contextCompactor.ts   # (Optional) Summarize old turns if context grows too large
├── state/
│   └── conversationStore.ts      # Zustand store for conversation history
├── components/
│   └── ConversationPanel/
│       ├── ConversationPanel.tsx     # Main chat UI container
│       ├── MessageList.tsx           # Scrollable message history
│       ├── MessageItem.tsx           # Individual message bubble
│       ├── PromptInput.tsx           # Text input for new prompts
│       └── ConversationTimeline.tsx  # (Optional) Visual timeline of edits
└── app/api/
    └── nl-conversation/
        └── route.ts              # New API route for conversational editing
```

### Pattern 1: Message History Management
**What:** Maintain client-side conversation history, send full message array to OpenAI on each turn
**When to use:** Multi-turn conversations where context from previous turns is needed
**Example:**
```typescript
// Source: OpenAI official docs + Phase 5 implementation pattern
interface ConversationTurn {
  id: string;                    // Unique turn ID (nanoid or uuid)
  timestamp: number;             // Unix timestamp
  userPrompt: string;            // User's natural language prompt
  assistantResponse: EditResponse; // GPT-4o parsed response
  executionResult: {             // Whether edits were applied successfully
    success: boolean;
    errors: string[];
  };
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

interface ConversationState {
  conversationId: string | null;  // Session identifier
  turns: ConversationTurn[];      // Full conversation history
  isLoading: boolean;
  error: string | null;
}

// Build OpenAI messages array from conversation history
function buildMessagesArray(
  systemPrompt: string,
  turns: ConversationTurn[],
  newUserPrompt: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add all previous turns
  for (const turn of turns) {
    messages.push({ role: 'user', content: turn.userPrompt });
    messages.push({
      role: 'assistant',
      content: JSON.stringify(turn.assistantResponse)
    });
  }

  // Add new user prompt
  messages.push({ role: 'user', content: newUserPrompt });

  return messages;
}
```

### Pattern 2: Conversation Session Management
**What:** Create new conversation sessions, persist to localStorage, allow resuming/clearing
**When to use:** When users need to manage multiple conversation threads or resume later
**Example:**
```typescript
// Source: Research on conversation ID patterns + existing Zustand patterns
interface ConversationSession {
  id: string;
  createdAt: number;
  lastUpdatedAt: number;
  turns: ConversationTurn[];
  title: string; // Auto-generated from first prompt
}

// Zustand store pattern
interface ConversationStore {
  // Active conversation
  activeSession: ConversationSession | null;

  // Session management
  startNewSession: () => void;
  loadSession: (id: string) => void;
  clearSession: () => void;

  // Turn management
  addTurn: (turn: ConversationTurn) => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => ConversationSession[];
}
```

### Pattern 3: Context Window Management
**What:** Monitor token usage across conversation, optionally compact/summarize old turns
**When to use:** Long conversations approaching context window limits (128k tokens for GPT-4o)
**Example:**
```typescript
// Source: Research on context window management best practices 2026
const MAX_CONVERSATION_TOKENS = 100000; // Leave headroom for GPT-4o's 128k limit

function shouldCompactHistory(turns: ConversationTurn[]): boolean {
  const totalTokens = turns.reduce(
    (sum, turn) => sum + turn.tokenUsage.totalTokens,
    0
  );
  return totalTokens > MAX_CONVERSATION_TOKENS;
}

// Strategy: Keep first turn (for context) + last N turns (for recency)
function compactHistory(turns: ConversationTurn[]): ConversationTurn[] {
  const KEEP_RECENT_TURNS = 10;

  if (turns.length <= KEEP_RECENT_TURNS + 1) {
    return turns;
  }

  return [
    turns[0], // First turn for context
    ...turns.slice(-KEEP_RECENT_TURNS) // Last N turns
  ];
}
```

### Pattern 4: Reference Resolution in Prompts
**What:** GPT-4o automatically resolves pronouns like "it", "them", "the melody" using conversation context
**When to use:** Multi-turn conversations where users reference previous operations
**Example:**
```typescript
// Source: Coreference resolution research + OpenAI best practices
// User prompt sequence:
// Turn 1: "Add a drum beat"
// Turn 2: "Make it louder"  <- GPT-4o resolves "it" to drum track
// Turn 3: "Add swing to the hi-hats" <- GPT-4o understands "the hi-hats" from drum context

// System prompt includes conversation context automatically via message history
// No special handling needed - GPT-4o's transformer architecture handles coreference resolution
```

### Pattern 5: Edit History Integration
**What:** Separate conversation history (user prompts + GPT responses) from undo/redo history (MIDI state snapshots)
**When to use:** Users need both conversation replay AND standard undo/redo
**Example:**
```typescript
// Source: Existing historyManager.ts + undo/redo research
// Conversation history: Chat transcript (immutable once created)
conversationStore.turns // Array of conversation turns

// Undo/redo history: MIDI state snapshots (mutable via undo/redo)
historyManager.push(newProjectState) // After each edit execution

// User can:
// 1. Undo last edit (reverts MIDI, conversation history unchanged)
// 2. Retry conversation turn (re-sends prompt, adds new turn)
// 3. View conversation timeline (shows what was requested, not current state)
```

### Anti-Patterns to Avoid
- **Don't use OpenAI Assistants API:** Deprecated, shuts down August 26, 2026. Use manual message array management instead.
- **Don't send entire MIDI context on every turn:** Build context once at conversation start, only send deltas/references in subsequent turns (future optimization).
- **Don't couple conversation UI to undo/redo:** Conversation history is immutable transcript; undo/redo operates on MIDI state. Keep separate.
- **Don't store conversation history server-side:** Client-side Zustand store with localStorage persistence is simpler and sufficient for this use case.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chat UI components | Custom message bubbles from scratch | shadcn/ui AI components OR copy patterns from existing chat apps | Chat UI has many edge cases: auto-scroll, timestamps, loading states, streaming, accessibility |
| Token counting | Manual string length estimation | js-tiktoken (already in Phase 5) | OpenAI's tokenizer is model-specific; manual counting will be inaccurate |
| Message array management | Complex state logic for turn tracking | Zustand store with immutable turn history | Conversation state is append-only; Zustand's simple API is perfect |
| Conversation compaction | Custom summarization logic | Keep first + last N turns, OR use GPT-4o summarization | Context rot research shows middle content performs worst; simple truncation is effective |
| Pronoun resolution | Custom NLP for "it", "them" references | Rely on GPT-4o's built-in coreference resolution | GPT-4o's transformer architecture handles this natively via message history context |

**Key insight:** Conversational AI in 2026 is mature but NOT fully abstracted. The "right" level of abstraction is manual message array management (not Assistants API, not heavy frameworks like Vercel AI SDK for this use case). Build thin layers over OpenAI primitives.

## Common Pitfalls

### Pitfall 1: Treating Conversation History Like Undo/Redo Stack
**What goes wrong:** Developers confuse conversation transcript (immutable, chronological) with undo/redo history (mutable, tree-like)
**Why it happens:** Both involve "history" and "going back in time"
**How to avoid:** Maintain two separate histories:
  - Conversation: Append-only log of user prompts + GPT responses (conversationStore)
  - Undo/Redo: Mutable MIDI state snapshots (historyManager)
**Warning signs:** Users expect "undo" to remove conversation turns, OR expect "retry prompt" to undo previous edits

### Pitfall 2: Context Window Overflow
**What goes wrong:** Long conversations exceed GPT-4o's 128k token limit, causing API errors
**Why it happens:** Each turn adds prompt + response tokens; context grows linearly
**How to avoid:**
  - Track cumulative token usage across turns
  - Warn user when approaching limit (e.g., >100k tokens)
  - Implement conversation compaction (keep first + last N turns)
  - Offer "Start New Conversation" button to reset context
**Warning signs:** API returns 400 errors with "context_length_exceeded" message

### Pitfall 3: Ignoring Cost Accumulation
**What goes wrong:** Multi-turn conversations cost significantly more than single-shot edits (context re-sent each turn)
**Why it happens:** Each turn sends full message history; token costs multiply
**How to avoid:**
  - Display cumulative cost for conversation session prominently
  - Warn user before expensive operations (e.g., "This conversation has used $0.50 so far")
  - Limit conversation length (e.g., max 20 turns before requiring new session)
**Warning signs:** User surprises at API costs; conversations with 50+ turns

### Pitfall 4: Streaming Response Confusion
**What goes wrong:** Implementing streaming adds complexity with minimal UX benefit for structured output use case
**Why it happens:** Research emphasizes streaming for chat apps, but structured outputs don't stream well
**How to avoid:**
  - Use non-streaming GPT-4o calls (like Phase 5)
  - Show loading spinner, not character-by-character display
  - Structured outputs (Zod schemas) require full response before parsing
**Warning signs:** Complex streaming implementation for responses that appear instantly anyway (<2s API call)

### Pitfall 5: Not Handling Failed Edit Execution
**What goes wrong:** GPT-4o returns valid operations, but execution fails (e.g., invalid note index); conversation continues with stale context
**Why it happens:** Conversation history records GPT response, not execution result
**How to avoid:**
  - Store execution result in conversation turn
  - If execution fails, append system message explaining failure to next API call
  - Allow user to "retry" failed turns
**Warning signs:** User says "make the melody higher" but melody was never added because previous turn failed

### Pitfall 6: Mobile Input Challenges
**What goes wrong:** Conversational UI doesn't work well on mobile (keyboard covering input, no screen space for history)
**Why it happens:** Chat interfaces are desktop-first in design
**How to avoid:**
  - Test on mobile early
  - Consider collapsible conversation history panel
  - Use bottom-sheet pattern for mobile input
  - Ensure auto-scroll to latest message works on mobile viewports
**Warning signs:** User complaints about mobile UX; conversation panel overlaps piano roll

## Code Examples

Verified patterns from official sources and existing Phase 5 implementation:

### Conversation Store (Zustand)
```typescript
// Source: Existing Phase 5 nlEditStore.ts + Zustand best practices
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConversationTurn {
  id: string;
  timestamp: number;
  userPrompt: string;
  assistantResponse: EditResponse;
  executionResult: { success: boolean; errors: string[] };
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

interface ConversationSession {
  id: string;
  createdAt: number;
  lastUpdatedAt: number;
  turns: ConversationTurn[];
  title: string;
}

interface ConversationStore {
  activeSession: ConversationSession | null;
  isLoading: boolean;
  error: string | null;

  startNewSession: () => void;
  clearSession: () => void;
  submitPrompt: (prompt: string) => Promise<void>;
  getTotalTokens: () => number;
  getTotalCost: () => number;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isLoading: false,
      error: null,

      startNewSession: () => {
        const newSession: ConversationSession = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          lastUpdatedAt: Date.now(),
          turns: [],
          title: 'New Conversation',
        };
        set({ activeSession: newSession, error: null });
      },

      clearSession: () => {
        set({ activeSession: null, error: null });
      },

      submitPrompt: async (prompt: string) => {
        const session = get().activeSession;
        if (!session) {
          set({ error: 'No active conversation session' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Build message history from previous turns
          const messages = buildMessagesFromTurns(session.turns);

          // Call API with conversation history
          const response = await fetch('/api/nl-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              conversationHistory: messages,
              context: buildMIDIContext(), // From Phase 5
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API error');
          }

          const data = await response.json();
          const { result, usage, executionResult } = data;

          // Create new turn
          const turn: ConversationTurn = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            userPrompt: prompt,
            assistantResponse: result,
            executionResult,
            tokenUsage: {
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens,
              estimatedCost: calculateCost(usage.promptTokens, usage.completionTokens),
            },
          };

          // Update session
          const updatedSession = {
            ...session,
            lastUpdatedAt: Date.now(),
            turns: [...session.turns, turn],
            title: session.turns.length === 0
              ? prompt.slice(0, 50) // Use first prompt as title
              : session.title,
          };

          set({ activeSession: updatedSession, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({ error: message, isLoading: false });
        }
      },

      getTotalTokens: () => {
        const session = get().activeSession;
        if (!session) return 0;
        return session.turns.reduce((sum, turn) => sum + turn.tokenUsage.totalTokens, 0);
      },

      getTotalCost: () => {
        const session = get().activeSession;
        if (!session) return 0;
        return session.turns.reduce((sum, turn) => sum + turn.tokenUsage.estimatedCost, 0);
      },
    }),
    {
      name: 'conversation-storage',
      partialize: (state) => ({ activeSession: state.activeSession }),
    }
  )
);
```

### API Route with Conversation History
```typescript
// Source: Existing Phase 5 /api/nl-edit/route.ts + OpenAI conversation patterns
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai/client';
import { EditResponseSchema } from '@/lib/openai/schemas';
import { zodResponseFormat } from 'openai/helpers/zod';
import { withExponentialBackoff } from '@/lib/openai/retry';
import { executeEditOperations } from '@/lib/nl-edit/editExecutor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, conversationHistory, context } = body as {
      prompt: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      context: MIDIContext;
    };

    // Validate inputs
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    // Build system prompt from MIDI context (same as Phase 5)
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if present
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add new user prompt
    messages.push({ role: 'user', content: prompt });

    // Call GPT-4o with retry logic (same as Phase 5)
    const completion = await withExponentialBackoff(() =>
      openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages,
        response_format: zodResponseFormat(EditResponseSchema, 'edit_response'),
      })
    );

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }

    // Execute operations (same as Phase 5)
    const executionResult = executeEditOperations(parsed.operations);

    // Extract usage stats
    const usage = {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };

    return NextResponse.json({
      result: parsed,
      usage,
      executionResult, // Include execution result in response
    });
  } catch (error) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    );
  }
}
```

### Chat UI Component
```typescript
// Source: Research on shadcn/ui patterns + existing UI patterns
import { useState, useRef, useEffect } from 'react';
import { useConversationStore } from '@/state/conversationStore';

export function ConversationPanel() {
  const {
    activeSession,
    isLoading,
    error,
    startNewSession,
    clearSession,
    submitPrompt,
    getTotalCost,
  } = useConversationStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.turns.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await submitPrompt(input);
    setInput('');
  };

  const handleNewSession = () => {
    if (activeSession && activeSession.turns.length > 0) {
      if (!confirm('Start new conversation? Current conversation will be saved.')) {
        return;
      }
    }
    startNewSession();
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {activeSession ? activeSession.title : 'No Active Conversation'}
        </h2>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500">
            Cost: ${getTotalCost().toFixed(4)}
          </span>
          <button
            onClick={handleNewSession}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New
          </button>
          <button
            onClick={clearSession}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            disabled={!activeSession}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeSession && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a new conversation to begin editing with AI</p>
            <button
              onClick={startNewSession}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Conversation
            </button>
          </div>
        )}

        {activeSession?.turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-blue-500 text-white rounded-lg p-3">
                <p>{turn.userPrompt}</p>
                <span className="text-xs opacity-75">
                  {new Date(turn.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Assistant response */}
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-gray-100 rounded-lg p-3">
                <p className="text-sm font-medium mb-2">
                  {turn.executionResult.success
                    ? '✓ Applied edits'
                    : '✗ Failed to apply edits'}
                </p>
                <p className="text-sm text-gray-600">
                  {turn.assistantResponse.summary}
                </p>
                {turn.assistantResponse.warnings.length > 0 && (
                  <div className="mt-2 text-sm text-orange-600">
                    ⚠ {turn.assistantResponse.warnings.join(', ')}
                  </div>
                )}
                {!turn.executionResult.success && (
                  <div className="mt-2 text-sm text-red-600">
                    Errors: {turn.executionResult.errors.join(', ')}
                  </div>
                )}
                <span className="text-xs text-gray-500">
                  {turn.tokenUsage.totalTokens} tokens · ${turn.tokenUsage.estimatedCost.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your edit..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!activeSession || isLoading}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!activeSession || isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {input.length}/500 characters
        </p>
      </form>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OpenAI Assistants API with server-managed threads | Manual message array management with client-side state | Assistants deprecated ~2025, shutdown August 26, 2026 | Must manage conversation history client-side; simpler mental model |
| Heavy frameworks (Vercel AI SDK) for all chat apps | Lightweight manual implementation for simple use cases | Ongoing trend in 2026 | AI SDK still valuable for streaming/complex features, but overkill for structured output chat |
| Context summarization for all long conversations | Keep first + last N turns (simpler strategy) | Research on "context rot" (2025-2026) | Middle content performs 15-30% worse; simple truncation is effective |
| Single conversation history store | Separate conversation transcript vs. undo/redo stacks | Learned from multi-agent system research (2025) | Clearer separation of concerns; users understand difference |
| Streaming for all AI responses | Streaming only for truly long-running responses | Structured outputs don't stream well (2024+) | Simpler implementation; structured outputs require full response anyway |

**Deprecated/outdated:**
- OpenAI Assistants API: Shuts down August 26, 2026 - use manual message management
- GPT-4 (non-turbo): Use GPT-4o-2024-08-06 for structured outputs
- Legacy `functions` parameter: Use `response_format` with Zod schemas instead

## Open Questions

1. **Should conversation history persist across page reloads?**
   - What we know: Zustand persist middleware can save to localStorage
   - What's unclear: Does this create privacy concerns? How much storage is reasonable?
   - Recommendation: Start with session persistence only (cleared on page reload), add localStorage persistence in follow-up if users request it

2. **How many conversation turns before requiring new session?**
   - What we know: Context window is 128k tokens; typical turn is 5-10k tokens including MIDI context
   - What's unclear: User expectations for conversation length; cost tolerance
   - Recommendation: Start with soft limit of 20 turns (show warning), hard limit of 30 turns (require new session)

3. **Should conversation UI be modal or panel?**
   - What we know: Desktop app has screen real estate for side panel; mobile is constrained
   - What's unclear: User workflow - do they alternate between conversation and piano roll editing?
   - Recommendation: Start with collapsible side panel (desktop) that becomes bottom sheet (mobile)

4. **Should failed edit executions be retryable?**
   - What we know: Execution can fail even with valid GPT response (e.g., invalid note index)
   - What's unclear: How to surface retry UX; should retry use same or modified prompt?
   - Recommendation: Add "Retry" button on failed turns; re-send same prompt with error context appended to system message

5. **How to visualize conversation vs. project undo/redo history?**
   - What we know: Conversation history is immutable transcript; undo/redo is mutable state tree
   - What's unclear: Do users want visual timeline showing both?
   - Recommendation: Start with conversation UI showing only conversation; keep undo/redo keyboard shortcuts separate

## Sources

### Primary (HIGH confidence)
- [OpenAI Conversation State Guide](https://platform.openai.com/docs/guides/conversation-state) - Official patterns for multi-turn conversations
- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs) - Zod schema integration
- [OpenAI Assistants Migration Guide](https://platform.openai.com/docs/assistants/migration) - Deprecation timeline and alternatives
- Existing Phase 5 implementation: `/src/lib/openai/client.ts`, `/src/app/api/nl-edit/route.ts`, `/src/state/nlEditStore.ts`

### Secondary (MEDIUM confidence)
- [Context Window Management Strategies (2026)](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - Best practices for long conversations
- [Vercel AI SDK 5 Release](https://vercel.com/blog/ai-sdk-5) - Modern chat UI patterns and hooks
- [shadcn/ui AI Components](https://www.shadcn.io/ai) - Pre-built React chat components
- [React useOptimistic Hook](https://react.dev/reference/react/useOptimistic) - Optimistic UI patterns for chat
- [Token Counting with js-tiktoken](https://www.propelcode.ai/blog/token-counting-tiktoken-anthropic-gemini-guide-2025) - Accurate cost estimation

### Tertiary (LOW confidence)
- [Coreference Resolution in NLP](https://www.flowhunt.io/glossary/coreference-resolution/) - How GPT handles pronouns
- [Multi-Turn Conversation Best Practices - OpenAI Community](https://community.openai.com/t/multi-turn-conversation-best-practice/282349) - Community discussions
- [Undo/Redo in Multi-Agent Systems](https://www.nilsjacobsen.me/blog/agent-ux-undo-redo) - Challenges with linear undo in AI context
- [React Timeline Components](https://github.com/prabhuignoto/react-chrono) - UI options for conversation visualization

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Phase 5 already has all required dependencies; no new libraries needed
- Architecture: HIGH - Research converges on manual message array management; patterns are well-established
- API approach: HIGH - OpenAI official docs clearly recommend Chat Completions over deprecated Assistants API
- UI patterns: MEDIUM - Many library options; custom implementation vs. shadcn components is discretionary
- Context management: MEDIUM - Best practices established but need validation with real usage patterns
- Mobile UX: LOW - Research focused on desktop; mobile conversation UX needs prototyping

**Research date:** 2026-02-09
**Valid until:** 2026-04-09 (60 days - reasonably stable domain; OpenAI APIs evolving slowly)

**Key decisions for planner:**
1. Extend Phase 5 infrastructure (no new dependencies required)
2. Create separate `/api/nl-conversation` route OR extend `/api/nl-edit` to handle conversation history
3. New Zustand store `conversationStore` for conversation state (separate from `nlEditStore`)
4. Custom chat UI components (start simple, optionally migrate to shadcn/ui later)
5. Manual message array management (NOT Assistants API, NOT Vercel AI SDK)
6. Non-streaming responses (consistent with Phase 5 structured output approach)
7. Context window monitoring with soft/hard limits (20/30 turns)
8. Separate conversation history from undo/redo history (architectural principle)
