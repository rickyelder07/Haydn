# Architecture Research: v1.1 Polish & Enhancement

**Research Date:** 2026-02-12
**Focus:** Integration points for UI redesign, synthesis improvements, AI composition, MIDI hardware

---

## Existing v1.0 Architecture

**Component Structure:**
```
src/
├── app/
│   ├── page.tsx (main layout - vertical stack)
│   └── api/ (nl-edit, nl-generation, nl-conversation routes)
├── components/
│   ├── PianoRollCanvas.tsx (Canvas rendering, 60fps)
│   ├── TrackList/ (TrackItem, TrackControls)
│   ├── TransportControls/ (play/pause/stop)
│   ├── GenerationInput.tsx (template generation UI)
│   ├── CommandInput.tsx (single-shot editing)
│   └── ConversationPanel.tsx (conversational editing)
├── lib/
│   ├── audio/ (NoteScheduler, instrument factories)
│   ├── midi/ (parsing, export)
│   ├── validation/ (ScaleValidator, GenreValidator, etc.)
│   └── generation/ (genre templates, assembler)
└── store/
    ├── projectStore.ts (MIDI data, tracks, tempo)
    ├── playbackStore.ts (audio state, position)
    ├── editStore.ts (history, selection)
    ├── trackUIStore.ts (mute/solo, colors)
    └── nlGenerationStore.ts (generation state, cost)
```

**Data Flow:**
1. User action → Component
2. Component → Store update (Zustand)
3. Store → Other components (subscribers)
4. Store → Audio/MIDI libraries (side effects)

---

## v1.1 Architectural Changes

### 1. UI Redesign: Layout Restructure

#### Before (v1.0):
```tsx
// page.tsx
<div className="vertical-stack">
  <GenerationInput />
  <UploadSection />
  <MetadataDisplay />
  <TrackList />
  <TransportControls />
  <PianoRollEditor />
</div>
```

#### After (v1.1):
```tsx
// page.tsx with react-resizable-panels
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

<PanelGroup direction="horizontal">
  <Panel defaultSize={20} minSize={15} maxSize={30}>
    <Sidebar>
      <TrackList />
      <MetadataDisplay />
    </Sidebar>
  </Panel>

  <PanelResizeHandle />

  <Panel>
    <MainArea>
      <TopBar>
        <GenerationInput />
        <TransportControls />
      </TopBar>
      <PianoRollWithTimeline>
        <TimelineRuler /> {/* NEW */}
        <PianoRollCanvas />
        <VelocityLane /> {/* NEW */}
      </PianoRollWithTimeline>
      <RightInspector>
        <NoteInspector />
      </RightInspector>
    </MainArea>
  </Panel>
</PanelGroup>
```

**Component Changes:**
- **NEW:** `Sidebar.tsx` (collapsible container)
- **NEW:** `TimelineRuler.tsx` (scrubber + measure ticks)
- **NEW:** `VelocityLane.tsx` (canvas-based velocity editor)
- **MODIFY:** `page.tsx` (layout restructure)
- **MODIFY:** `PianoRollEditor.tsx` (integrate timeline + velocity lane)
- **MODIFY:** `TrackItem.tsx` (inline name editing)
- **MODIFY:** `MetadataDisplay.tsx` (inline name editing)

**State Changes:**
- **NEW:** `uiLayoutStore.ts` (sidebar width, collapsed state)
- **MODIFY:** `playbackStore.ts` (add playhead drag state)

**No breaking changes:** Existing stores remain compatible.

---

### 2. Synthesis Quality: Audio Engine Enhancement

#### Integration Points:

**File:** `lib/audio/instrument-factory.ts`
```typescript
// Before (v1.0):
export function createInstrument(program: number) {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: getOscillatorType(program) },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 1.0 }
  })
}

// After (v1.1):
export function createInstrument(program: number) {
  const family = getInstrumentFamily(program) // piano, strings, brass, etc.
  const config = INSTRUMENT_CONFIGS[family] // NEW: per-family config

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: config.oscillator,
    envelope: config.envelope,
    filter: config.filter, // NEW
    filterEnvelope: config.filterEnvelope // NEW
  })

  if (config.vibrato) { // NEW
    synth.set({ vibrato: config.vibrato })
  }

  return synth
}
```

**File:** `lib/audio/instrument-configs.ts` (NEW)
```typescript
export const INSTRUMENT_CONFIGS = {
  piano: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.5 },
    filter: { type: 'lowpass', frequency: 3000, Q: 0.7 },
    vibrato: null
  },
  strings: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.6 },
    filter: { type: 'lowpass', frequency: 2500, Q: 0.5 },
    vibrato: { frequency: 4, depth: 0.1 }
  },
  // ... other families
}
```

**Component Changes:**
- **NEW:** `lib/audio/instrument-configs.ts`
- **MODIFY:** `lib/audio/instrument-factory.ts`
- **MODIFY:** `lib/audio/NoteScheduler.ts` (use new factory)

**No state changes:** Audio improvements are transparent to stores.

**Backwards compatible:** Existing MIDI files sound better, no format changes.

---

### 3. AI Composition Mode

#### Integration Points:

**NEW API Route:** `app/api/nl-generation-ai/route.ts`
```typescript
// Conversational generation flow
export async function POST(request: Request) {
  const { prompt, conversationHistory } = await request.json()

  // Phase 1: Ask up to 3 clarifying questions
  if (conversationHistory.length < 6) { // 3 questions = 6 messages (Q+A pairs)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: QUESTION_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: prompt }
      ]
    })
    return { type: 'question', content: response.choices[0].message.content }
  }

  // Phase 2: Generate MIDI JSON directly
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: GENERATION_SYSTEM_PROMPT },
      ...conversationHistory
    ],
    response_format: { type: 'json_schema', json_schema: MIDIProjectSchema }
  })

  const midiJSON = JSON.parse(completion.choices[0].message.content)

  // Phase 3: Validate with existing pipeline
  const validationResult = validateProject(midiJSON)
  if (!validationResult.ok) {
    // Retry logic or fallback to template mode
  }

  return { type: 'midi', data: midiJSON, tokens: completion.usage }
}
```

**State Management:**
```typescript
// store/nlGenerationStore.ts (MODIFY)
interface NLGenerationStore {
  // ... existing fields
  mode: 'template' | 'ai' // NEW
  conversationHistory: Array<{ role: string, content: string }> // NEW
  isQuestioning: boolean // NEW

  generateWithAI: (prompt: string) => Promise<void> // NEW
  answerQuestion: (answer: string) => Promise<void> // NEW
  switchMode: (mode: 'template' | 'ai') => void // NEW
}
```

**Component Changes:**
- **NEW:** `app/api/nl-generation-ai/route.ts`
- **NEW:** `components/GenerationModeToggle.tsx`
- **NEW:** `components/AIQuestionFlow.tsx`
- **MODIFY:** `components/GenerationInput.tsx` (add mode toggle, question UI)
- **MODIFY:** `store/nlGenerationStore.ts` (add AI mode state)

**Data Flow:**
1. User toggles AI mode
2. User enters prompt → nlGenerationStore.generateWithAI()
3. API asks questions → store updates conversationHistory
4. User answers → API generates MIDI JSON
5. Validation → projectStore.setProject()

**Integration with existing:**
- Reuses ValidationPipeline (no bypass)
- Same projectStore format (transparent to rest of app)
- Token counting (js-tiktoken already in use)

---

### 4. Template Generation Enhancements

#### Integration Points:

**File:** `lib/generation/genre-templates.ts` (MODIFY)
```typescript
// Before (v1.0):
export const GENRE_TEMPLATES = {
  jazz: {
    versePattern: [/* single pattern */],
    chorusPattern: [/* single pattern */],
    drumFill: [/* single fill */]
  }
}

// After (v1.1):
export const GENRE_TEMPLATES = {
  jazz: {
    versePatterns: [
      [/* pattern A */],
      [/* pattern B */],
      [/* pattern C */]
    ],
    chorusPatterns: [
      [/* pattern X */],
      [/* pattern Y */],
      [/* pattern Z */]
    ],
    drumFills: [
      [/* fill 1 */], [/* fill 2 */], // ... 8 fills total
    ]
  }
}
```

**File:** `lib/generation/pattern-selector.ts` (NEW)
```typescript
export function selectPattern(patterns: Pattern[], sectionIndex: number, seed?: string): Pattern {
  const rng = seed ? seedrandom(seed) : Math.random
  const index = Math.floor(rng() * patterns.length)
  return patterns[index]
}
```

**Component Changes:**
- **MODIFY:** `lib/generation/genre-templates.ts` (add pattern variations)
- **NEW:** `lib/generation/pattern-selector.ts`
- **MODIFY:** `lib/generation/assembler.ts` (use pattern selector)

**No state changes:** Transparent to stores.

**Backwards compatible:** Same output format, different content.

---

### 5. Advanced Editing UI

#### 5.1: Velocity Lane

**Component:** `components/VelocityLane.tsx` (NEW)
```typescript
// Canvas-based, similar to PianoRollCanvas
export function VelocityLane() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { selectedTrack } = useProjectStore()
  const { selectNote, updateNote } = useEditStore()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Render velocity stalks for all notes
    selectedTrack?.notes.forEach(note => {
      const height = (note.velocity / 127) * LANE_HEIGHT
      ctx.fillRect(ticksToX(note.ticks), LANE_HEIGHT - height, NOTE_WIDTH, height)
    })
  }, [selectedTrack])

  const handleMouseDown = (e: MouseEvent) => {
    // Find note at click position, start drag
  }

  const handleMouseMove = (e: MouseEvent) => {
    // Update velocity as user drags
    updateNote(noteId, { velocity: newVelocity })
  }

  return <canvas ref={canvasRef} onMouseDown={handleMouseDown} />
}
```

**Integration:**
- Renders below PianoRollCanvas (same width, synchronized scroll)
- Shares editStore (selection state, update methods)
- Same coordinate system (ticks → pixels)

#### 5.2: Quantization Controls

**Component:** `components/QuantizationPanel.tsx` (NEW)
```tsx
export function QuantizationPanel() {
  const [strength, setStrength] = useState(100)
  const [grid, setGrid] = useState('1/16')
  const [swing, setSwing] = useState(50)
  const { quantizeSelection } = useEditStore()

  return (
    <div>
      <Slider label="Strength" value={strength} onChange={setStrength} />
      <Select label="Grid" value={grid} options={GRID_OPTIONS} />
      <Slider label="Swing" value={swing} onChange={setSwing} />
      <Button onClick={() => quantizeSelection(strength, grid, swing)}>Apply</Button>
    </div>
  )
}
```

**Store:** `editStore.ts` (MODIFY)
```typescript
quantizeSelection: (strength: number, grid: string, swing: number) => {
  const gridTicks = parseGrid(grid) // '1/16' → ticks per 16th note
  const selectedNotes = get().getSelectedNotes()

  selectedNotes.forEach(note => {
    const quantizedTicks = quantize(note.ticks, gridTicks, strength, swing)
    updateNote(note.id, { ticks: quantizedTicks })
  })

  saveHistory() // Undo/redo support
}
```

#### 5.3: Chord Symbol Display

**Component:** `components/ChordSymbolOverlay.tsx` (NEW)
```tsx
export function ChordSymbolOverlay() {
  const { selectedTrack } = useProjectStore()
  const chords = useMemo(() => detectChords(selectedTrack), [selectedTrack])

  return (
    <svg className="absolute inset-0 pointer-events-none">
      {chords.map(chord => (
        <text x={ticksToX(chord.ticks)} y={20} key={chord.ticks}>
          {chord.symbol}
        </text>
      ))}
    </svg>
  )
}

function detectChords(track: Track): Chord[] {
  // Group notes by bar, detect chord per bar
  const bars = groupNotesByBar(track.notes)
  return bars.map(bar => {
    const pitches = bar.notes.map(n => n.midi)
    const detected = Chord.detect(pitches) // Tonal.js
    return { ticks: bar.startTicks, symbol: detected[0] || '' }
  })
}
```

**Integration:**
- SVG overlay on top of PianoRollCanvas (absolute positioning)
- Uses Tonal.js (already in stack)
- No state changes (computed from projectStore)

---

### 6. MIDI Hardware Support

#### Integration Points:

**Hook:** `hooks/useMIDIInput.ts` (NEW)
```typescript
export function useMIDIInput() {
  const [midiAccess, setMIDIAccess] = useState<MIDIAccess | null>(null)
  const [connectedDevices, setConnectedDevices] = useState<MIDIInput[]>([])

  useEffect(() => {
    if (!navigator.requestMIDIAccess) return

    navigator.requestMIDIAccess().then(access => {
      setMIDIAccess(access)
      setConnectedDevices(Array.from(access.inputs.values()))

      access.addEventListener('statechange', e => {
        // Handle device connect/disconnect
      })
    })
  }, [])

  const startListening = (callback: (note: MIDINoteEvent) => void) => {
    connectedDevices.forEach(input => {
      input.onmidimessage = (message) => {
        const [command, note, velocity] = message.data
        if (command === 144) callback({ note, velocity }) // Note on
      }
    })
  }

  return { connectedDevices, startListening }
}
```

**Store:** `midiInputStore.ts` (NEW)
```typescript
interface MIDIInputStore {
  isListening: boolean
  isRecording: boolean
  recordedNotes: Note[]

  startListening: () => void
  stopListening: () => void
  startRecording: (trackId: number) => void
  stopRecording: () => void
  addRecordedNote: (note: Note) => void
}
```

**Integration with playback:**
```typescript
// When paused: useMIDIInput plays notes via playbackStore
useMIDIInput().startListening(({ note, velocity }) => {
  playbackStore.playNote(note, velocity)
})

// When recording: useMIDIInput adds notes to midiInputStore
useMIDIInput().startListening(({ note, velocity }) => {
  const ticks = playbackStore.currentTicks
  midiInputStore.addRecordedNote({ midi: note, ticks, velocity, durationTicks: 480 })
})

// On recording stop: transfer notes to projectStore
midiInputStore.stopRecording()
projectStore.addNotesToTrack(trackId, midiInputStore.recordedNotes)
```

**Component Changes:**
- **NEW:** `hooks/useMIDIInput.ts`
- **NEW:** `store/midiInputStore.ts`
- **NEW:** `components/MIDIIndicator.tsx` (connection status)
- **NEW:** `components/RecordButton.tsx` (transport controls)
- **MODIFY:** `components/TransportControls.tsx` (add record button)

---

## Build Order Recommendation

Based on dependencies and complexity:

1. **Phase 1: UI Redesign** (foundation for everything else)
   - Install react-resizable-panels
   - Restructure page.tsx layout
   - Sidebar with resizing
   - Timeline scrubber in piano roll
   - Inline name editing
   - *No dependencies on other features*

2. **Phase 2: Synthesis Quality** (improves all audio output)
   - Create instrument-configs.ts
   - Modify instrument-factory.ts
   - Test with existing playback
   - *Benefits all subsequent features that use audio*

3. **Phase 3: Generation Improvements** (parallel tracks)
   - **3a. Template Enhancements**
     - Add pattern variations to templates
     - Implement pattern selector
     - Test randomness
   - **3b. AI Composition Mode**
     - Create nl-generation-ai API route
     - Add mode toggle UI
     - Implement question flow
     - Test validation integration
   - *Both can be built in parallel, different code paths*

4. **Phase 4: Advanced Editing** (builds on UI foundation)
   - Velocity lane (canvas below piano roll)
   - Quantization controls + logic
   - Chord symbol overlay
   - *Requires Phase 1 (UI) complete*

5. **Phase 5: MIDI Hardware** (most complex, least dependencies)
   - Web MIDI hook
   - MIDI input store
   - Keyboard input while paused
   - Recording during playback
   - *Can be built independently, integrates at end*

---

## Data Flow Diagrams

### Template Generation (v1.0 vs v1.1)

**v1.0:**
```
User prompt → GenerationInput → nl-generation API
  → GPT-4o (parameters only)
  → template assembler (deterministic)
  → projectStore.setProject()
```

**v1.1 (Template Mode with Variations):**
```
User prompt → GenerationInput → nl-generation API
  → GPT-4o (parameters only)
  → template assembler (random pattern selection)
  → projectStore.setProject()
```

**v1.1 (AI Mode):**
```
User prompt → GenerationInput → nl-generation-ai API
  → GPT-4o (question 1)
  → User answer
  → GPT-4o (question 2)
  → User answer
  → GPT-4o (question 3)
  → User answer
  → GPT-4o (MIDI JSON generation)
  → ValidationPipeline
  → projectStore.setProject()
```

### MIDI Recording Data Flow

```
MIDI Keyboard → Web MIDI API → useMIDIInput hook
  → midiInputStore.addRecordedNote()
  → (on stop) projectStore.addNotesToTrack()
  → editStore.saveHistory() (undo support)
  → PianoRollCanvas re-renders
```

---

## Component Tree (v1.1)

```
page.tsx
├── PanelGroup (horizontal)
│   ├── Panel (sidebar)
│   │   └── Sidebar
│   │       ├── TrackList
│   │       │   └── TrackItem (inline editing)
│   │       └── MetadataDisplay (inline editing)
│   ├── PanelResizeHandle
│   └── Panel (main)
│       ├── TopBar
│       │   ├── GenerationSection
│       │   │   ├── GenerationModeToggle (template/AI)
│       │   │   ├── GenerationInput (template)
│       │   │   └── AIQuestionFlow (AI mode)
│       │   └── TransportControls
│       │       ├── PlayPauseStop
│       │       ├── RecordButton (NEW)
│       │       └── MIDIIndicator (NEW)
│       ├── PianoRollWithTimeline
│       │   ├── TimelineRuler (NEW - scrubber)
│       │   ├── PianoRollCanvas
│       │   ├── ChordSymbolOverlay (NEW)
│       │   └── VelocityLane (NEW)
│       └── RightInspector
│           ├── NoteInspector
│           └── QuantizationPanel (NEW)
```

---

## Risk Assessment

**Low Risk:**
- Synthesis parameter tuning (backwards compatible)
- Template variations (same output format)
- Inline editing (isolated component changes)

**Medium Risk:**
- Layout restructure (affects all components)
- Timeline scrubber (complex mouse interaction)
- Velocity lane (new canvas rendering logic)

**High Risk:**
- AI composition mode (validation bypass potential)
- MIDI recording (timing synchronization complexity)

**Mitigation:**
- Incremental rollout (UI first, features second)
- Comprehensive validation testing (AI mode)
- Latency testing (MIDI recording)
