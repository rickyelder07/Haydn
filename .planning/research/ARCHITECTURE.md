# Architecture Research: MIDI Editing Web Applications

**Domain:** Web-based MIDI Editing and Music Production with LLM Integration
**Researched:** 2026-01-23
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   UI     │  │  Editor  │  │ Timeline │  │ Controls │  │  Export  │ │
│  │  Shell   │  │Component │  │  View    │  │  Panel   │  │  Dialog  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │             │             │             │             │        │
├───────┴─────────────┴─────────────┴─────────────┴─────────────┴────────┤
│                     STATE MANAGEMENT LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐│
│  │   MIDI Data Store   │  │ Conversation Store  │  │  Playback State ││
│  │  (parsed structure) │  │  (chat history)     │  │  (transport)    ││
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────┬────────┘│
│             │                        │                       │         │
├─────────────┴────────────────────────┴───────────────────────┴─────────┤
│                     PROCESSING LAYER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐│
│  │  MIDI Parser    │  │  MIDI Manipulator│ │   Audio Engine          ││
│  │  (parse/export) │  │  (structure-aware│ │   (AudioWorklet +       ││
│  │                 │  │   editing)       │ │    Synthesizer)         ││
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────┤
│                     BACKEND API LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              LLM Integration Service                                 ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  ││
│  │  │ Conversation │  │ Prompt       │  │ Response Parser          │  ││
│  │  │ Orchestrator │  │ Engineering  │  │ (structured output)      │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **MIDI Parser** | Parse MIDI/MusicXML files to structured JSON; export back to standard formats | @tonejs/midi or midi-parser-js for MIDI; musicxml-interfaces for MusicXML |
| **MIDI Manipulator** | Structure-aware editing operations (transpose, quantize, extract sections, merge tracks) | Custom logic built on parsed JSON structure |
| **Audio Engine** | Real-time MIDI playback with soundfont synthesis | AudioWorklet + SpessaSynth or WebAudioFont |
| **LLM Integration Service** | Orchestrate GPT-4o API calls, manage context, parse structured responses | Next.js API routes or Express backend |
| **Conversation Orchestrator** | Maintain conversational state across multi-turn interactions | Server-side session storage or database |
| **State Management** | Centralized state for MIDI data, conversation history, playback | Zustand, Redux, or React Context API |
| **UI Components** | Render piano roll, timeline, controls, chat interface | React/Vue components with Canvas API for rendering |

## Recommended Project Structure

```
haydn/
├── app/                      # Frontend application
│   ├── components/           # React components
│   │   ├── editor/           # Piano roll, timeline, track list
│   │   ├── chat/             # Conversational interface
│   │   ├── playback/         # Transport controls, volume
│   │   └── dialogs/          # Import/export, settings
│   ├── lib/                  # Frontend utilities
│   │   ├── midi/             # MIDI parsing and manipulation
│   │   │   ├── parser.ts     # Parse MIDI/MusicXML to JSON
│   │   │   ├── exporter.ts   # Export JSON back to MIDI
│   │   │   └── manipulator.ts # Structure-aware operations
│   │   ├── audio/            # Audio engine
│   │   │   ├── worklet.ts    # AudioWorklet processor
│   │   │   ├── synth.ts      # Soundfont synthesizer wrapper
│   │   │   └── transport.ts  # Playback timing engine
│   │   └── state/            # State management
│   │       ├── midiStore.ts  # MIDI data state
│   │       ├── chatStore.ts  # Conversation state
│   │       └── playbackStore.ts # Transport state
│   └── pages/                # Next.js pages or routes
├── api/                      # Backend API (Next.js routes or Express)
│   ├── chat/                 # LLM integration endpoints
│   │   ├── completion.ts     # Single-shot edit mode
│   │   └── conversation.ts   # Multi-turn conversational mode
│   ├── session/              # Session management
│   │   └── [sessionId].ts    # CRUD for conversation sessions
│   └── middleware/           # Auth, rate limiting, error handling
├── workers/                  # Audio worklet files
│   └── synth-worklet.js      # AudioWorklet processor
├── public/                   # Static assets
│   └── soundfonts/           # SF2 files for synthesis
└── shared/                   # Shared types and utilities
    └── types/                # TypeScript interfaces
        ├── midi.ts           # MIDI data structures
        ├── chat.ts           # Chat message types
        └── llm.ts            # LLM request/response types
```

### Structure Rationale

- **app/lib/midi/**: MIDI processing stays client-side for instant feedback and offline capability
- **app/lib/audio/**: AudioWorklet runs off-main-thread for smooth playback without blocking UI
- **api/chat/**: LLM calls require backend to protect API keys and manage token optimization
- **shared/types/**: TypeScript interfaces shared between frontend and backend ensure type safety
- **workers/**: AudioWorklet files must be separate modules loaded via `audioWorklet.addModule()`

## Architectural Patterns

### Pattern 1: Client-Side MIDI Processing

**What:** All MIDI parsing, manipulation, and export happens in the browser, not on the server.

**When to use:** This is the standard pattern for web-based MIDI editors. MIDI operations are fast enough to run client-side, and keeping data local provides offline capability and instant feedback.

**Trade-offs:**
- **Pro:** No server processing costs, works offline, instant response
- **Pro:** Privacy - MIDI data never leaves user's device
- **Con:** Browser memory limitations for very large MIDI files (10,000+ notes)
- **Con:** Client must handle file format compatibility

**Example:**
```typescript
// lib/midi/parser.ts
import { Midi } from '@tonejs/midi';

export async function parseMidiFile(file: File): Promise<MidiData> {
  const arrayBuffer = await file.arrayBuffer();
  const midi = new Midi(arrayBuffer);

  // Convert to app-specific structure
  return {
    header: {
      ppq: midi.header.ppq,
      tempos: midi.header.tempos,
      timeSignatures: midi.header.timeSignatures,
    },
    tracks: midi.tracks.map(track => ({
      name: track.name,
      instrument: track.instrument,
      notes: track.notes.map(note => ({
        midi: note.midi,
        time: note.time,
        duration: note.duration,
        velocity: note.velocity,
      })),
      controlChanges: track.controlChanges,
    })),
  };
}
```

### Pattern 2: Backend LLM Orchestration with Structured Output

**What:** Backend API layer handles GPT-4o integration with structured output to minimize token usage and ensure parseable responses.

**When to use:** Always, for both single-shot and conversational modes. Backend protects API keys and enables token optimization strategies.

**Trade-offs:**
- **Pro:** API key security (never exposed to client)
- **Pro:** Token optimization through structured output and prompt engineering
- **Pro:** Server-side conversation state management
- **Con:** Requires network round-trip (adds latency)
- **Con:** Server costs for API calls

**Example:**
```typescript
// api/chat/completion.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { userPrompt, midiContext } = await req.json();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a MIDI editing assistant. Respond with structured JSON operations.'
      },
      {
        role: 'user',
        content: `MIDI context: ${JSON.stringify(midiContext)}\n\nUser request: ${userPrompt}`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'midi_operations',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            operations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['transpose', 'quantize', 'delete', 'insert'] },
                  target: { type: 'string' },
                  params: { type: 'object' }
                },
                required: ['type', 'target', 'params'],
                additionalProperties: false
              }
            },
            explanation: { type: 'string' }
          },
          required: ['operations', 'explanation'],
          additionalProperties: false
        }
      }
    }
  });

  return Response.json(completion.choices[0].message.content);
}
```

**Why structured output:** OpenAI's structured output mode (with `strict: true`) ensures guaranteed-valid JSON and reduces token usage by ~30% compared to asking for JSON in the prompt.

### Pattern 3: AudioWorklet for Real-Time Synthesis

**What:** Use AudioWorklet to run MIDI synthesis off the main thread, preventing UI blocking during playback.

**When to use:** Required for smooth playback. ScriptProcessorNode (deprecated) ran on main thread and caused janky UI.

**Trade-offs:**
- **Pro:** Non-blocking, smooth 60fps UI during playback
- **Pro:** Low latency (~3ms vs ~100ms for main-thread processing)
- **Con:** More complex setup (separate module file, message passing)
- **Con:** Limited API surface in AudioWorkletGlobalScope

**Example:**
```typescript
// app/lib/audio/transport.ts
export class MidiTransport {
  private audioContext: AudioContext;
  private synthNode: AudioWorkletNode;

  async initialize() {
    this.audioContext = new AudioContext();

    // Load the worklet processor
    await this.audioContext.audioWorklet.addModule('/workers/synth-worklet.js');

    // Create worklet node
    this.synthNode = new AudioWorkletNode(this.audioContext, 'midi-synth');
    this.synthNode.connect(this.audioContext.destination);

    // Load soundfont
    const soundfontData = await fetch('/soundfonts/default.sf2').then(r => r.arrayBuffer());
    this.synthNode.port.postMessage({ type: 'loadSoundfont', data: soundfontData });
  }

  play(midiData: MidiData) {
    this.synthNode.port.postMessage({ type: 'play', data: midiData });
  }
}

// workers/synth-worklet.js
class MidiSynthProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Real-time MIDI synthesis
    // Runs off main thread, doesn't block UI
    return true;
  }
}
registerProcessor('midi-synth', MidiSynthProcessor);
```

### Pattern 4: Sliding Window Context Management for Conversational Mode

**What:** Maintain a fixed-size conversation history that slides forward, keeping recent context while discarding old messages to prevent token overflow.

**When to use:** Conversational mode with multiple turns. Prevents hitting GPT-4o's 128k token limit while maintaining coherent context.

**Trade-offs:**
- **Pro:** Predictable token usage (never exceeds window size)
- **Pro:** Conversation can continue indefinitely
- **Con:** May lose important context from early in conversation
- **Con:** Requires summarization strategy for long sessions

**Example:**
```typescript
// api/chat/conversation.ts
const MAX_CONTEXT_MESSAGES = 10; // Keep last 10 messages

export async function POST(req: Request) {
  const { sessionId, userMessage } = await req.json();

  // Retrieve conversation history from database
  const session = await getSession(sessionId);
  const messages = session.messages;

  // Sliding window: keep only recent messages
  const contextMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

  // Add new user message
  contextMessages.push({ role: 'user', content: userMessage });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      { role: 'system', content: systemPrompt },
      ...contextMessages
    ],
    response_format: { type: 'json_schema', ... }
  });

  // Save to session
  await updateSession(sessionId, {
    messages: [...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: completion.choices[0].message.content }
    ]
  });

  return Response.json(completion.choices[0].message.content);
}
```

### Pattern 5: Optimistic MIDI Updates with LLM Confirmation

**What:** Apply MIDI edits client-side immediately (optimistic update), then reconcile with LLM response.

**When to use:** Improves perceived performance for operations where the user intent is clear.

**Trade-offs:**
- **Pro:** Instant UI feedback
- **Pro:** Better UX during network latency
- **Con:** May need to rollback if LLM response differs from optimistic update
- **Con:** More complex state management

**Example:**
```typescript
// app/lib/state/midiStore.ts
import { create } from 'zustand';

export const useMidiStore = create((set, get) => ({
  midiData: null,
  pendingOperations: [],

  applyOperationOptimistically: (operation) => {
    // Apply immediately to UI
    const newData = applyOperation(get().midiData, operation);
    set({
      midiData: newData,
      pendingOperations: [...get().pendingOperations, operation]
    });
  },

  confirmOperations: (llmResponse) => {
    // Reconcile with LLM response
    if (llmResponse.operations !== get().pendingOperations) {
      // Rollback and apply LLM operations
      const freshData = applyOperations(get().originalMidiData, llmResponse.operations);
      set({ midiData: freshData, pendingOperations: [] });
    } else {
      // Operations matched, just clear pending
      set({ pendingOperations: [] });
    }
  }
}));
```

## Data Flow

### Request Flow: Single-Shot Edit Mode

```
[User uploads MIDI file]
    ↓
[Frontend Parser] → Parse to JSON → [MIDI Store]
    ↓
[User types natural language edit request]
    ↓
[Frontend] → POST /api/chat/completion
    {
      userPrompt: "transpose up 2 semitones",
      midiContext: { simplified MIDI structure }
    }
    ↓
[Backend LLM Service]
    ↓ GPT-4o API call with structured output
    ↓
[Response Parser] ← JSON operations + explanation
    ↓
[Frontend] ← Apply operations to MIDI data
    ↓
[MIDI Store updated] → UI re-renders
    ↓
[User clicks play]
    ↓
[Audio Engine] → AudioWorklet synthesis → Speakers
```

### Request Flow: Conversational Mode

```
[User starts conversation]
    ↓
[Frontend] → POST /api/session/create → [Backend creates session]
    ↓
[Chat UI shows session ID]
    ↓
[User sends message 1]
    ↓
[Frontend] → POST /api/chat/conversation
    {
      sessionId: "abc123",
      userMessage: "Make the piano brighter",
      midiContext: { ... }
    }
    ↓
[Backend Conversation Orchestrator]
    ├─ Load session history
    ├─ Apply sliding window context
    ├─ Call GPT-4o with conversation history
    └─ Save message pair to session
    ↓
[Frontend] ← Operations + explanation
    ↓
[Apply to MIDI] → [Update chat history UI]
    ↓
[User sends message 2] (context maintained)
    ↓
[Repeat with accumulated context...]
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     State Stores                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │  MIDI Store      │  │ Conversation     │  │ Playback  │ │
│  │                  │  │ Store            │  │ Store     │ │
│  │ - tracks[]       │  │ - sessionId      │  │ - playing │ │
│  │ - notes[]        │  │ - messages[]     │  │ - position│ │
│  │ - tempos[]       │  │ - mode           │  │ - tempo   │ │
│  │ - timeSignatures │  │                  │  │           │ │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬─────┘ │
│           │                     │                   │       │
│           ↓                     ↓                   ↓       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Components (subscribe)                    │ │
│  │  - Editor, Timeline, Chat, Transport Controls          │ │
│  └────────────────────────────────────────────────────────┘ │
│           ↓                     ↓                   ↓       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Actions (mutations)                       │ │
│  │  - updateNotes(), addMessage(), setPlaying()           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**State management library recommendation:** Use Zustand for lightweight, minimal-boilerplate state management, or Redux Toolkit for more complex state with time-travel debugging needs.

### Key Data Flows

1. **File Upload Flow:** User uploads → Parse to JSON → Store in MIDI state → Render in editor UI
2. **Edit Request Flow:** User prompt → Backend LLM API → Structured operations → Apply to MIDI state → Re-render
3. **Playback Flow:** MIDI data → Audio Engine → AudioWorklet synthesis → Web Audio API → Speakers
4. **Export Flow:** MIDI state → Export to MIDI binary → Download to user's device

## Client vs Server Responsibilities

### Client-Side Processing (Browser)

| Responsibility | Rationale |
|----------------|-----------|
| **MIDI Parsing** | Fast, runs offline, no server load |
| **MIDI Manipulation** | Instant feedback, privacy (data never sent to server) |
| **MIDI Export** | No round-trip latency, works offline |
| **Audio Synthesis** | Web Audio API only runs in browser, low-latency playback |
| **UI Rendering** | Canvas/DOM rendering must be client-side |
| **State Management** | React state, Zustand/Redux for local data |

**Key principle:** Keep all MIDI data processing client-side. Only send minimal context to LLM backend.

### Server-Side Processing (Backend)

| Responsibility | Rationale |
|----------------|-----------|
| **LLM API Calls** | API key security (never expose to client) |
| **Conversation State** | Persistent storage across sessions |
| **Token Optimization** | Structured output configuration, prompt engineering |
| **Session Management** | CRUD operations for conversation history |
| **Rate Limiting** | Prevent API abuse |
| **Authentication** | User management if multi-user |

**Key principle:** Backend is orchestration layer for LLM, not for MIDI processing.

### What to Send to Backend

**DO send:**
- User's natural language prompt
- Minimal MIDI context (e.g., track names, note count, key signature)
- Session ID for conversational mode

**DO NOT send:**
- Full MIDI binary data
- Complete note arrays (thousands of notes)
- Audio data

**Token optimization strategy:**
```typescript
// Bad: sending full MIDI data (wastes tokens)
const context = JSON.stringify(midiData); // 50,000+ tokens

// Good: sending minimal context (saves tokens)
const context = {
  trackCount: midiData.tracks.length,
  tracks: midiData.tracks.map(t => ({
    name: t.name,
    instrument: t.instrument,
    noteCount: t.notes.length,
    range: { lowest: Math.min(...t.notes.map(n => n.midi)),
             highest: Math.max(...t.notes.map(n => n.midi)) }
  })),
  duration: midiData.duration,
  tempo: midiData.header.tempos[0]?.bpm
}; // ~500 tokens
```

## LLM Integration Layer Architecture

### Prompt Engineering Pattern

**System prompt structure:**
```
You are a MIDI editing assistant. The user will provide a natural language
request to modify a MIDI file. Respond with a JSON array of operations.

Available operations:
- transpose: { semitones: number, tracks?: string[] }
- quantize: { grid: '1/4' | '1/8' | '1/16', tracks?: string[] }
- delete: { tracks: string[], noteRange?: { min: number, max: number } }
- insert: { track: string, notes: Array<{ midi: number, time: number, duration: number }> }
- setTempo: { bpm: number, time?: number }

MIDI context will be provided as: { tracks, tempo, duration }

Respond with: { operations: [...], explanation: "..." }
```

### Structured Output Schema

```typescript
// shared/types/llm.ts
export interface MidiOperation {
  type: 'transpose' | 'quantize' | 'delete' | 'insert' | 'setTempo';
  target: string; // track name or 'all'
  params: Record<string, unknown>;
}

export interface LLMResponse {
  operations: MidiOperation[];
  explanation: string;
}

// API route validation
const operationSchema = {
  type: 'object',
  properties: {
    operations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['transpose', 'quantize', 'delete', 'insert', 'setTempo'] },
          target: { type: 'string' },
          params: { type: 'object' }
        },
        required: ['type', 'target', 'params'],
        additionalProperties: false
      }
    },
    explanation: { type: 'string' }
  },
  required: ['operations', 'explanation'],
  additionalProperties: false
};
```

**Why this schema:** Strict mode ensures 100% valid JSON responses, no parsing errors, and reduces token usage vs. prompt-based JSON generation.

### Token Usage Optimization Strategies

1. **Minimal Context:** Send summary statistics instead of full MIDI data
2. **Structured Output:** Use OpenAI's JSON schema mode (saves ~30% tokens)
3. **Streaming Responses:** Stream operations as they're generated (improves perceived latency)
4. **Conversation Summarization:** After N turns, summarize history to compress context
5. **Single-Shot Mode:** Default to stateless mode unless user explicitly wants conversation

### Conversation State Management

**Session storage schema:**
```typescript
interface ConversationSession {
  id: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  midiSnapshot?: MidiData; // Original MIDI state at session start
  mode: 'single-shot' | 'conversational';
}
```

**Storage options:**
- **Development:** In-memory Map or Redis
- **Production:** PostgreSQL (for persistence) or Firestore (serverless)
- **Hybrid:** Redis for active sessions + PostgreSQL for long-term storage

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Monolith is fine. Next.js with Vercel or single Node server. Client-side MIDI processing scales perfectly (each user uses their own CPU). Simple session storage in Redis or database. |
| **1k-100k users** | Optimize LLM API costs (biggest bottleneck). Add caching layer for common prompts. Consider streaming responses for better UX. Rate limiting per user. CDN for soundfont files. |
| **100k+ users** | Implement prompt caching (OpenAI feature to reduce costs). Consider fine-tuning a smaller model for common operations. Horizontal scaling of API servers (stateless design enables this). Consider edge functions for lower latency. |

### Scaling Priorities

1. **First bottleneck: LLM API costs**
   - **Solution:** Prompt caching, structured output, minimal context strategy
   - **Metric to watch:** Average tokens per request (target: <1000 tokens)

2. **Second bottleneck: Soundfont file size**
   - **Solution:** CDN distribution, lazy loading, compressed SF3 format
   - **Metric to watch:** Time to first playback (target: <3 seconds)

3. **Third bottleneck: Session storage**
   - **Solution:** Redis for active sessions, archive old sessions to cold storage
   - **Metric to watch:** Session DB size, query latency

**What does NOT bottleneck:** Client-side MIDI processing (each user's browser handles their own files), Audio synthesis (AudioWorklet is highly efficient), UI rendering (React is fast enough for MIDI editors)

## Anti-Patterns

### Anti-Pattern 1: Server-Side MIDI Processing

**What people do:** Send MIDI files to server, process there, send back
**Why it's wrong:**
- Wastes server resources on trivial computation
- Adds network latency for no benefit
- Prevents offline usage
- Privacy concerns (user data leaves device)

**Do this instead:** Keep all MIDI parsing, manipulation, and export client-side. Only send minimal context to LLM backend.

### Anti-Pattern 2: ScriptProcessorNode for Audio

**What people do:** Use deprecated ScriptProcessorNode for MIDI synthesis
**Why it's wrong:**
- Runs on main thread, blocks UI (janky scrolling, dropped frames)
- High latency (~100ms vs ~3ms for AudioWorklet)
- Deprecated, will be removed from browsers

**Do this instead:** Use AudioWorklet for all real-time audio processing. Accept the slightly more complex setup for massive UX benefits.

### Anti-Pattern 3: Sending Full MIDI Data to LLM

**What people do:** `JSON.stringify(entireMidiFile)` in API request
**Why it's wrong:**
- Wastes tokens (costs money, hits limits)
- Slow (large payloads)
- Unnecessary (LLM only needs summary to understand intent)

**Do this instead:** Send minimal context (track names, counts, ranges). LLM doesn't need every note to understand "transpose piano up 2 semitones."

### Anti-Pattern 4: No Structured Output Validation

**What people do:** Ask LLM for JSON in prompt, parse with `JSON.parse()`, hope for the best
**Why it's wrong:**
- ~20% failure rate on complex responses
- Wasted tokens on retry attempts
- Poor UX when parsing fails

**Do this instead:** Use OpenAI's structured output with `strict: true` for guaranteed-valid JSON. Zero parsing errors, lower token costs.

### Anti-Pattern 5: Unbounded Conversation Context

**What people do:** Send entire conversation history on every turn
**Why it's wrong:**
- Token usage grows linearly with conversation length
- Eventually hits context limit (128k tokens for GPT-4o)
- Wastes money on old context that doesn't matter

**Do this instead:** Sliding window (keep last N messages) or summarization (compress old context). For MIDI editing, last 10 messages is usually sufficient context.

### Anti-Pattern 6: Synchronous LLM Calls Blocking UI

**What people do:** `await fetch('/api/llm')` with loading spinner, entire UI frozen
**Why it's wrong:**
- Poor UX during 2-5 second LLM response time
- User can't continue working while waiting

**Do this instead:** Optimistic updates (apply predicted edit immediately) + streaming responses. Let user continue editing while LLM processes in background.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenAI GPT-4o API** | Backend REST API calls via official SDK | Protect API key on server, use structured output |
| **Web MIDI API** | Browser API for MIDI device I/O | Optional: allow recording from MIDI keyboard |
| **Web Audio API** | Browser API for audio synthesis | Required for playback, use AudioWorklet |
| **File System Access API** | Browser API for file import/export | Provides better UX than `<input type="file">` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Frontend ↔ MIDI Parser** | Function calls, synchronous | Parsing is fast (<100ms for typical MIDI file) |
| **Frontend ↔ Backend API** | HTTP/HTTPS with JSON | Use POST for LLM requests, GET for session retrieval |
| **Frontend ↔ AudioWorklet** | `postMessage()` with structured clones | Asynchronous, main thread → audio thread |
| **State Store ↔ Components** | Subscriptions (Zustand) or selectors (Redux) | Reactive updates when state changes |
| **Backend ↔ Database** | ORM (Prisma) or query builder (Kysely) | For session storage |

### AudioWorklet Communication Pattern

```typescript
// Main thread → AudioWorklet
synthNode.port.postMessage({
  type: 'noteOn',
  data: { midi: 60, velocity: 100, time: audioContext.currentTime }
});

// AudioWorklet → Main thread
synthNode.port.onmessage = (event) => {
  if (event.data.type === 'playbackPosition') {
    updateTransportUI(event.data.position);
  }
};

// Why this pattern: postMessage is the only way to communicate with AudioWorklet
// from main thread. It's asynchronous and uses structured clone algorithm.
```

## Build Order Recommendations

Suggested dependency order for implementation:

**Phase 1: Core MIDI Infrastructure**
1. MIDI parser (client-side, @tonejs/midi or midi-parser-js)
2. MIDI data store (Zustand state management)
3. Basic export functionality (MIDI binary export)

**Phase 2: LLM Integration**
4. Backend API setup (Next.js API routes)
5. Single-shot completion endpoint
6. Structured output schema and validation
7. MIDI operation executor (apply LLM operations to state)

**Phase 3: Audio Playback**
8. AudioWorklet processor setup
9. Soundfont loader (SpessaSynth integration)
10. Transport controls (play/pause/stop)
11. Playback timing engine

**Phase 4: UI Layer**
12. Basic editor UI (track list, simple note display)
13. Chat interface for LLM interaction
14. Playback controls UI
15. Import/export dialogs

**Phase 5: Conversational Mode**
16. Session management (backend CRUD)
17. Conversation store (frontend state)
18. Sliding window context implementation
19. Multi-turn conversation UI

**Phase 6: Advanced Features**
20. MusicXML import support
21. Advanced editor features (piano roll, timeline)
22. Optimistic updates
23. Streaming LLM responses

**Why this order:**
- MIDI infrastructure first enables testing with real data
- LLM integration second provides core value prop
- Audio playback enables validation of edits
- UI can be built once data layer is stable
- Conversational mode builds on single-shot foundation

## Sources

**Web MIDI API & Audio Processing:**
- [Getting Started With The Web MIDI API — Smashing Magazine](https://www.smashingmagazine.com/2018/03/web-midi-api/)
- [MIDI Tutorial: Creating Browser-Based Audio Applications | Toptal](https://www.toptal.com/web/creating-browser-based-audio-applications-controlled-by-midi-hardware)
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Background audio processing using AudioWorklet - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet)
- [Audio worklet design pattern | Chrome for Developers](https://developer.chrome.com/blog/audio-worklet-design-pattern)

**MIDI Libraries:**
- [MidiPlayerJS - GitHub](https://github.com/grimmdude/MidiPlayerJS)
- [Tonejs/Midi - GitHub](https://github.com/Tonejs/Midi)
- [midi-parser-js - GitHub](https://github.com/colxi/midi-parser-js)
- [SpessaSynth - GitHub](https://github.com/spessasus/SpessaSynth)
- [musicxml-interfaces - GitHub](https://github.com/jocelyn-stericker/musicxml-interfaces)

**DAW Architecture:**
- [Architecture of a Digital Audio Workstation | UKEssays](https://www.ukessays.com/essays/music/architecture-digital-audio-workstation-5625.php)
- [Lets talk DAW/Sequencer design and architecture - KVR Audio](https://www.kvraudio.com/forum/viewtopic.php?t=478572)

**Real-World Example:**
- [Signal - Online MIDI Editor](https://signalmidi.app/)
- [Signal GitHub Repository](https://github.com/ryohey/signal)

**LLM Integration Patterns:**
- [Next.js Backend for Conversational AI in 2026](https://www.sashido.io/en/blog/nextjs-backend-conversational-ai-2026)
- [A Deep Dive into OpenAI's Conversation State Management | Medium](https://medium.com/aimonks/a-deep-dive-into-openais-conversation-state-management-d2f34bdc09bd)
- [Structured outputs in LLMs | LeewayHertz](https://www.leewayhertz.com/structured-outputs-in-llms/)
- [Token efficiency with structured output | Microsoft Data Science + AI](https://medium.com/data-science-at-microsoft/token-efficiency-with-structured-output-from-language-models-be2e51d3d9d5)
- [Context Window Management Strategies | Maxim AI](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)

---
*Architecture research for: Haydn - Natural Language MIDI Editor*
*Researched: 2026-01-23*
*Confidence: HIGH (verified with official docs, real-world examples, and authoritative sources)*
