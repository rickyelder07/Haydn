# Haydn

A browser-based MIDI editor that understands natural language. Describe what you want — generate a lofi beat, transpose a melody, add swing to the drums — and Haydn translates your words into musical edits using GPT-4o.

---

## What It Does

Haydn bridges the gap between musical intent and MIDI production. Instead of clicking through menus and adjusting parameters, you type what you hear in your head.

**Import or generate.** Drag in a MIDI or MusicXML file, or generate a full multi-track arrangement from a text prompt. Describe the genre, mood, and feel — Haydn builds the drums, bass, chords, and melody.

**Edit with words.** Select a track and describe a change: "make this more syncopated", "shift everything up a fifth", "add a jazz feel to the chord voicings". GPT-4o interprets the intent and applies targeted edits to the MIDI data.

**Converse and refine.** Switch to conversation mode for iterative editing. Haydn remembers context across turns, so you can build on previous instructions without repeating yourself.

**See and hear.** A canvas-based piano roll gives you a precise visual of every note. Edit manually by dragging, or let the AI do it. Play back in real-time with Tone.js synthesis.

**Export anywhere.** Download your work as a standard MIDI file and bring it into any DAW.

---

## Features

- **Natural language generation** — Full multi-track arrangements from a single text prompt, with genre templates (lofi, trap, boom-bap, jazz, classical, pop)
- **Natural language editing** — Single-shot edits to individual tracks using conversational instructions
- **Conversational editing mode** — Multi-turn refinement with persistent context across the session
- **Floating AI editor panel** — Draggable, resizable panel for accessing all AI editing modes without leaving the piano roll
- **Music theory validation** — Real-time scale and chord validation with visual feedback; edits are checked before applying
- **Piano roll editor** — Canvas-based note editor with drag-to-create, drag-to-move, zoom controls, and undo/redo
- **Multi-track support** — Up to 32 tracks with drag-to-reorder, mute, solo, and per-track instrument assignment
- **MIDI import/export** — Import standard MIDI (.mid) and MusicXML (.xml/.mxl) files; export to standard MIDI
- **Real-time playback** — Tone.js synthesis with transport controls, tempo adjustment, loop, and metronome
- **MIDI hardware support** — Connect a MIDI controller or keyboard for step recording and live input
- **Token transparency** — Shows estimated GPT-4o token usage and cost before and after generation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.7 |
| UI | React 19 |
| Styling | Tailwind CSS |
| State | Zustand 5 |
| Audio | Tone.js 15 (Web Audio API) |
| MIDI | @tonejs/midi |
| MusicXML | musicxml-interfaces |
| Music Theory | Tonal |
| AI | OpenAI SDK 6 (GPT-4o) |
| Validation | Zod |
| Drag & Drop | dnd-kit |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main editor UI
│   └── api/
│       ├── nl-generate/      # POST: text prompt → generation params via GPT-4o
│       ├── nl-edit/          # POST: edit instruction → MIDI operations via GPT-4o
│       ├── nl-conversation/  # POST: multi-turn conversation handler
│       └── ai-compose/       # POST: AI composition endpoint
│
├── components/
│   ├── PianoRoll/            # Canvas-based note editor
│   ├── FloatingEditPanel/    # Draggable/resizable AI editor panel
│   ├── TrackList/            # Drag-and-drop track management
│   ├── TimelineRuler/        # Transport controls, playhead, timeline
│   ├── Sidebar/              # Resizable sidebar
│   ├── ConversationPanel/    # Multi-turn editing UI
│   ├── NewProjectButton/     # File import with confirm dialog
│   └── ExportButton/         # MIDI export
│
├── state/                    # Zustand stores
│   ├── projectStore.ts       # Active project and track data
│   ├── playbackStore.ts      # Playback position and controls
│   ├── editStore.ts          # Selected track/note state
│   ├── conversationStore.ts  # Multi-turn conversation history
│   ├── nlEditStore.ts        # Natural language edit state
│   ├── nlGenerationStore.ts  # Generation state
│   ├── validationStore.ts    # Music theory validation results
│   ├── uiStore.ts            # UI state (sidebar width, panel visibility)
│   └── historyManager.ts     # Undo/redo stack
│
└── audio/                    # Custom audio engine (Tone.js integration)
```

**AI pipeline (generation):**
1. User prompt → GPT-4o structured output → `GenerationParams` (genre, key, tempo, instrumentation, structure)
2. `GenerationParams` → track assemblers → individual `HaydnTrack` objects with notes
3. Tracks → `ValidationPipeline` → music theory check → load into app

**AI pipeline (editing):**
1. User instruction + current track context → GPT-4o → structured edit operations
2. Edit operations → `editExecutor` → mutated MIDI data
3. Music theory validation → apply or reject with feedback

---

## Getting Started

**Prerequisites:** Node.js 18+, an OpenAI API key

```bash
# Clone the repository
git clone https://github.com/rickyelder07/haydn.git
cd haydn

# Install dependencies
npm install

# Add your OpenAI API key
echo "OPENAI_API_KEY=your_key_here" > .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge (Web Audio API required).

---

## Usage

**To generate music:**
1. Type a description in the generation input — e.g., *"melancholic lofi beat in D minor, 85bpm, with piano and muted guitar"*
2. Click Generate — a full arrangement loads into the piano roll

**To edit a track:**
1. Select a track from the track list
2. Open the floating AI editor panel and type an instruction — e.g., *"make the bass line more walking, jazz style"*
3. The edit applies immediately with undo available

**To import a file:**
1. Click New Project or drag a `.mid` or `.xml` file onto the upload area
2. Tracks parse automatically and load into the editor

**To export:**
1. Click Export in the header
2. Downloads as a standard `.mid` file compatible with any DAW

---

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | GPT-4o API key for generation and editing |

**Browser support:** Chrome, Edge, Opera (Web Audio API). Firefox and Safari are not supported due to Web MIDI API limitations.

---

## Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
```

---

## Name

Named after Joseph Haydn, who systematized the sonata form — bringing structure and clarity to musical ideas. The app tries to do the same for the gap between musical intuition and MIDI production.
