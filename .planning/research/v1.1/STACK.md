# Stack Research: v1.1 Polish & Enhancement

**Research Date:** 2026-02-12
**Focus:** Stack additions for UI redesign, synthesis improvements, AI composition, MIDI hardware

---

## Overview

v1.1 builds on v1.0's validated stack (Next.js 15, Tone.js 15.1.22, Tonal.js 6.0, @tonejs/midi, OpenAI SDK, Zustand, Canvas API). This research identifies **minimal additions** needed for new features without bloat.

---

## 1. UI Redesign (Resizable Sidebar, Timeline Scrubber)

### react-resizable-panels (v2.1.7)

**Purpose:** Professional resizable panel layout for sidebar/piano roll split.

**Why this library:**
- 2.7M weekly downloads, battle-tested ([npm](https://www.npmjs.com/package/react-resizable-panels))
- Built by Brian Vaughn (React core team)
- Keyboard accessibility built-in (meets WCAG requirements)
- Supports min/max constraints, collapsed states, layout persistence
- Zero additional dependencies beyond React

**Integration points:**
- Replaces current vertical stack layout
- PanelGroup wraps sidebar + piano roll
- PanelResizeHandle for drag interaction
- Integrates with existing Zustand stores (no state conflicts)

**Bundle impact:** ~15KB gzipped (acceptable for UX improvement)

**Alternatives considered:**
- react-split-pane: unmaintained since 2020
- react-mosaic: overkill (grid layouts, we need simple left/right)
- Custom CSS resize: reinventing wheel, accessibility gaps

**Decision:** Use react-resizable-panels. Proven, lightweight, accessible.

---

## 2. Synthesis Quality Improvements

### NO NEW LIBRARIES NEEDED

**Approach:** Parameter tuning of existing Tone.js 15.1.22 PolySynth.

**Research findings** ([MDN Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques), [Tone.js docs](https://tonejs.github.io/docs/PolySynth)):

**Current problem:** Harsh, robotic sound from default PolySynth settings.

**Solutions within existing stack:**

1. **ADSR Envelope Refinement**
   - Current: Default envelope (attack 0.01, decay 0.1, sustain 0.5, release 1.0)
   - Improved: Per-instrument family envelopes
     - Piano: attack 0.005, decay 0.2, sustain 0.3, release 0.5 (percussive)
     - Strings: attack 0.1, decay 0.3, sustain 0.8, release 0.6 (sustained)
     - Brass: attack 0.05, decay 0.1, sustain 0.7, release 0.4 (punchy)
   - Reduces abrupt note onsets (harsh attack)

2. **Oscillator Selection**
   - Current: Square/sawtooth for all (harsh harmonics)
   - Improved: Waveform matching per instrument
     - Piano/guitar: triangle (mellower than sawtooth)
     - Strings: sawtooth with lowpass filter
     - Brass: square with bandpass filter
     - Synth: pulse (PWM modulation for richness)

3. **Filtering** ([Web Audio filters](https://dobrian.github.io/cmp/topics/building-a-synthesizer-with-web-audio-api/3.filters.html))
   - Add BiquadFilterNode (lowpass) to synth chain
   - Cutoff frequency: 2000-5000 Hz (removes harsh high frequencies)
   - Q factor: 0.5-1.0 (gentle slope)
   - Applied per instrument category

4. **Vibrato/Modulation**
   - Slight LFO on frequency (0.1-0.3 Hz) for "alive" sound
   - Depth: 5-10 cents (subtle)
   - Prevents static, lifeless tone

**Why not SoundFont/samples:**
- File size: 5-50MB per instrument bank (unacceptable for web)
- Loading time: async sample fetching breaks UX
- Complexity: sample management, loop points, velocity layers
- v1.1 bar: "good enough to compose with," not "production ready"

**Decision:** Tune PolySynth parameters within existing Tone.js. Zero new dependencies.

---

## 3. AI Composition Mode

### NO NEW LIBRARIES NEEDED

**Approach:** Enhanced GPT-4o usage within existing OpenAI SDK.

**Research findings** ([GPT-4-To-MIDI](https://github.com/d3n7/GPT-4-To-MIDI), [MIDI-GPT paper](https://arxiv.org/html/2501.17011v1)):

**Current v1.0 approach:**
- User prompt → GPT-4o → structured parameters (tempo, key, genre) → template generation

**v1.1 "AI Composition Mode" approach:**
- User prompt → GPT-4o asks follow-up questions (max 3) → GPT-4o generates MIDI JSON directly

**JSON schema for direct generation:**
```typescript
{
  tracks: [
    {
      name: string,
      instrument: number, // GM 0-127
      channel: number,
      notes: [
        { midi: number, ticks: number, durationTicks: number, velocity: number }
      ]
    }
  ],
  tempoChanges: [{ ticks: number, bpm: number }],
  timeSignatures: [{ ticks: number, numerator: number, denominator: number }]
}
```

**Tokenization alternatives** (from [M6(GPT)3 paper](https://arxiv.org/html/2409.12638v1)):
- **Option A:** Direct JSON (our choice)
  - Pros: Human-readable, Zod validation, existing projectStore format
  - Cons: Verbose (higher tokens)
- **Option B:** MIDI tokens (BAR_START, TRACK_START, INSTRUMENT_128, NOTE_60)
  - Pros: Compact (lower tokens)
  - Cons: Requires miditok library (6MB), detokenization complexity, debugging nightmare

**Decision:** Stick with JSON format. Token cost acceptable for "expensive mode" (user opts in). Simpler validation, debugging, integration.

**Conversational flow:**
- Use existing OpenAI SDK chat completions
- New API route: `/api/nl-generation-ai` (separate from template mode)
- State management: Extend nlGenerationStore with conversational mode
- Max 3 follow-up questions (prevent endless loops)

**Integration:**
- Toggle UI component (template vs AI mode)
- Reuse existing ValidationPipeline after generation
- Cost transparency: Display token usage

---

## 4. Template Generation Enhancements

### NO NEW LIBRARIES NEEDED

**Approach:** Extend existing genre templates with variation logic.

**Implementation:**
- Multiple pattern arrays per genre (verse patterns: [A, B, C], chorus patterns: [X, Y, Z])
- Random selection: `patterns[Math.floor(Math.random() * patterns.length)]`
- Drum fill variations: 8 fills per genre, randomly selected at section boundaries
- Seed-based randomness for reproducibility: `seedrandom` (already in dependencies via @tonejs/midi)

**No new dependencies required.**

---

## 5. Advanced Editing UI

### NO NEW LIBRARIES NEEDED

**Velocity Editor:**
- Canvas-based velocity lane (similar to piano roll approach)
- Render below piano roll (velocity stalks visualization)
- Click-drag interaction for editing

**Quantization Controls:**
- UI components: Sliders for strength (0-100%), grid selector (1/4, 1/8, 1/16, etc.)
- Logic in lib/quantization.ts (new file)
- No library needed (simple math: `Math.round(ticks / gridTicks) * gridTicks`)

**Chord Symbol Display:**
- Tonal.js already in stack (Chord.detect() functionality)
- Overlay on piano roll (SVG text elements above note grid)
- Detect chords per bar from note clusters

**Decision:** Build with existing tools. Canvas, Tonal.js, React components.

---

## 6. MIDI Hardware Support

### NO NEW LIBRARIES NEEDED

**Browser API:** Web MIDI API ([W3C spec](https://www.w3.org/TR/webmidi/), [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API))

**Browser support 2026:**
- ✅ Chrome, Edge, Opera, Brave (full support)
- ⚠️ Firefox: Behind flag (bugzilla #836897)
- ❌ Safari: Not supported
- Solution: Feature detection, graceful degradation

**Implementation:**
```typescript
if (navigator.requestMIDIAccess) {
  const midiAccess = await navigator.requestMIDIAccess();
  // ... handle inputs
}
```

**Integration:**
- New hook: `useMIDIInput()` (similar to existing audio hooks)
- State: midiInputStore (Zustand)
- Recording: Extend playbackStore with `isRecording` state

**Library alternatives considered:**
- WebMidi.js ([djipco/webmidi](https://github.com/djipco/webmidi)): Wrapper around Web MIDI API
  - Pros: Cleaner API, event handling
  - Cons: 50KB bundle, abstracts away native API
- **Decision:** Use native Web MIDI API. Smaller bundle, one less dependency, sufficient for our needs.

---

## Stack Summary

| Feature Area | Library Addition | Version | Bundle Impact | Rationale |
|--------------|------------------|---------|---------------|-----------|
| Resizable UI | react-resizable-panels | 2.1.7 | ~15KB | Industry standard, accessible, maintained by React core team |
| Synthesis | *(none)* | — | 0KB | Tune existing Tone.js PolySynth parameters |
| AI Composition | *(none)* | — | 0KB | Extend existing OpenAI SDK usage |
| Template Variation | *(none)* | — | 0KB | Logic changes in existing generators |
| Advanced Editing | *(none)* | — | 0KB | Canvas + Tonal.js (already in stack) |
| MIDI Hardware | *(none)* | — | 0KB | Native Web MIDI API |

**Total new dependencies:** 1
**Total bundle increase:** ~15KB gzipped

---

## Installation Commands

```bash
npm install react-resizable-panels@^2.1.7
```

---

## Integration Risk Assessment

**Low risk:**
- react-resizable-panels: Pure UI, no state coupling
- Synthesis parameter tuning: Backwards compatible
- Web MIDI API: Feature detection, graceful degradation

**Medium risk:**
- AI composition JSON schema: Requires validation testing
- Template variations: Randomness could break genre consistency (needs validation)

**Mitigation:**
- Comprehensive testing phase for synthesis parameters
- ValidationPipeline blocks invalid AI-generated MIDI
- Template variations tested across all genres

---

## Sources

- [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels)
- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels)
- [Web Audio API Advanced Techniques - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- [Tone.js PolySynth docs](https://tonejs.github.io/docs/PolySynth)
- [Web Audio Filters](https://dobrian.github.io/cmp/topics/building-a-synthesizer-with-web-audio-api/3.filters.html)
- [Synthesis with Envelopes](https://chrislowis.co.uk/2013/06/17/synthesis-web-audio-api-envelopes)
- [GPT-4-To-MIDI GitHub](https://github.com/d3n7/GPT-4-To-MIDI)
- [MIDI-GPT paper](https://arxiv.org/html/2501.17011v1)
- [M6(GPT)3 paper](https://arxiv.org/html/2409.12638v1)
- [Web MIDI API spec](https://www.w3.org/TR/webmidi/)
- [Web MIDI API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [Web MIDI API browser support](https://caniuse.com/midi)
