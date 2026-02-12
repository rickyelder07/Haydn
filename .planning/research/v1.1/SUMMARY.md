# Research Summary: v1.1 Polish & Enhancement

**Date:** 2026-02-12
**Milestone:** v1.1 Polish & Enhancement
**Goal:** Transform MVP into polished, production-ready tool with professional UI/UX, improved audio quality, more creative MIDI generation, and advanced editing capabilities

---

## Executive Summary

v1.1 focuses on **polish over features**. Most improvements require **minimal new dependencies** (only react-resizable-panels added). Key approach: tune existing stack (Tone.js parameters, GPT-4o usage, Canvas rendering) rather than adding libraries.

**Build order:** UI → Audio → Generation → Editing → MIDI Hardware (phased approach minimizes risk)

---

## Key Findings

### 1. Stack: Minimal Additions

**Only 1 new dependency:**
- `react-resizable-panels@2.1.7` (~15KB) for resizable sidebar

**Everything else uses existing stack:**
- Synthesis: Tune Tone.js PolySynth parameters (ADSR, filters, vibrato)
- AI composition: Extend OpenAI SDK usage (no new library)
- Template variations: Logic changes in generators (no library)
- Advanced editing: Canvas + Tonal.js (already present)
- MIDI hardware: Native Web MIDI API (browser built-in)

**Rationale:** v1.0 stack is sufficient. Adding libraries increases bundle size, maintenance burden, and integration complexity. Parameter tuning and architectural refinement yield better ROI.

---

### 2. Features: Professional DAW Patterns

**UI Redesign** (Priority 1):
- Resizable sidebar (track list + metadata) — matches Logic Pro, Ableton
- Integrated timeline scrubber at top of piano roll — drag playhead, click to jump
- Inline name editing (track/project names) — reduce friction

**Synthesis Quality** (Priority 2):
- Per-instrument ADSR envelopes (piano: percussive, strings: sustained)
- Filtered oscillators (lowpass 2-5kHz removes harsh highs)
- Subtle vibrato (5-10 cents depth) for "alive" sound
- **Target:** "Good enough to compose with" (not production-ready samples)

**Generation Improvements** (Priority 3):
- **AI Composition Mode:** GPT-4o generates MIDI JSON directly (not parameters)
  - Conversational flow: up to 3 clarifying questions
  - Token cost transparency (display estimate before generation)
  - Validation enforced (no bypass for AI mode)
- **Template Enhancements:** Multiple patterns per genre, random selection, drum fill variations

**Advanced Editing** (Priority 4):
- Velocity editor lane (canvas-based, stalks below piano roll)
- Quantization controls (strength 0-100%, grid selection, swing parameter)
- Chord symbol display (Tonal.js detect, SVG overlay)

**MIDI Hardware** (Priority 5):
- Web MIDI API integration (Chrome/Edge/Opera supported, Firefox/Safari graceful degradation)
- Keyboard input while paused (play current track)
- Live recording during playback (record button, count-in, timing sync)

---

### 3. Architecture: Surgical Integration

**Layout Restructure:**
```
Before: Vertical stack (Generation → Upload → Metadata → Tracks → Transport → Piano Roll)
After: Horizontal panels (Sidebar [Tracks + Metadata] | Main [Top bar + Piano roll + Inspector])
```

**Component Changes:**
- **NEW:** 11 components (Sidebar, TimelineRuler, VelocityLane, AIQuestionFlow, etc.)
- **MODIFY:** 8 components (page.tsx, PianoRollEditor, TrackItem, etc.)
- **UNCHANGED:** Core logic (stores, MIDI/audio libraries, validation)

**Data Flow:** No breaking changes to stores. New features extend existing stores (nlGenerationStore adds AI mode, playbackStore adds recording state).

**Build Order:**
1. UI Redesign (foundation, no dependencies)
2. Synthesis Quality (improves all audio, minimal risk)
3. Generation (parallel tracks: templates + AI mode)
4. Advanced Editing (requires UI complete)
5. MIDI Hardware (independent, integrates last)

---

### 4. Pitfalls: Critical Risks

**High-severity risks:**
1. **Breaking existing MIDI playback** (Phase 2): New synthesis parameters could make v1.0 files sound worse
   - Mitigation: A/B test with v1.0 files, conservative parameter changes
2. **ValidationPipeline bypass** (Phase 3): AI mode might skip music theory validation
   - Mitigation: ALWAYS validate AI output, retry on failure, fallback to template
3. **Timeline scrubber performance** (Phase 1): Mousemove events → audio glitches
   - Mitigation: Throttle updates (16ms), use RAF for visuals, update audio only on mouseup
4. **Token cost explosion** (Phase 3): Conversation history → $5+ per generation
   - Mitigation: Hard limit 3 questions, show cost estimate, require confirmation if >$1
5. **Recording timing drift** (Phase 5): Web MIDI latency → notes off-beat
   - Mitigation: Latency compensation, high-res timestamps, test with metronome

**Medium-severity risks:**
- Panel width state conflicts, inline editing keyboard traps, velocity lane desync, quantization destroying nuance, sustain pedal issues

**All pitfalls documented with detection methods, prevention strategies, and phase assignment.**

---

## Recommended Approaches

### Synthesis Quality

**Approach:** Per-instrument family configuration (not global settings).

**Example configuration:**
```typescript
INSTRUMENT_CONFIGS = {
  piano: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.5 },
    filter: { type: 'lowpass', frequency: 3000, Q: 0.7 }
  },
  strings: {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.6 },
    filter: { type: 'lowpass', frequency: 2500, Q: 0.5 },
    vibrato: { frequency: 4, depth: 0.1 }
  },
  // ... brass, percussion, etc.
}
```

**Why not SoundFont:** 5-50MB file size, async loading, loop point complexity. Bar is "good enough to compose" not "production samples."

---

### AI Composition vs Templates

**Template Mode (default):**
- Fast, cheap (<1,000 tokens)
- Predictable, genre-consistent
- Enhanced with pattern variations + drum fills

**AI Mode (opt-in toggle):**
- Expensive (~5,000+ tokens, $0.50+)
- Creative, unique per generation
- Conversational flow (up to 3 questions)
- Validation enforced (retry on failure)

**User chooses based on use case:**
- Quick iteration → Templates
- Unique compositions → AI mode

---

### Timeline Scrubber Interaction

**Pattern:** Logic Pro / Ableton style

**Implementation:**
- Timeline ruler at top of piano roll (not separate component)
- Playhead: Draggable triangle + vertical line
- Click timeline anywhere → jump playhead
- Drag playhead → scrub (visual feedback)
- Measure/beat ticks along ruler

**Performance:**
- Throttle mousemove (16ms max)
- Local state for visual position
- Commit to store on mouseup only

---

### MIDI Recording Timing

**Challenge:** Web MIDI latency (10-20ms) causes notes to record early/late.

**Solution:**
- Measure round-trip latency (send MIDI, receive echo, calculate delay)
- Compensate in recording: `ticks = playbackTicks + latencyTicks`
- Use `performance.now()` for high-resolution timestamps
- Test with metronome (clicks must align with grid)

---

## Dependencies & Integration

### Installation

```bash
npm install react-resizable-panels@^2.1.7
```

**No other dependencies required.**

---

### Integration Points

**UI Redesign:**
- Affects: `page.tsx` (layout), all child components (parent structure changes)
- Risk: Medium (layout shift can break CSS, sizing)
- Mitigation: Test all components after layout change

**Synthesis:**
- Affects: `lib/audio/instrument-factory.ts`, `lib/audio/NoteScheduler.ts`
- Risk: Low (backwards compatible parameter tuning)
- Mitigation: A/B test with v1.0 MIDI files

**AI Composition:**
- Affects: `app/api/nl-generation-ai/route.ts` (new), `store/nlGenerationStore.ts` (extend), `components/GenerationInput.tsx` (UI)
- Risk: Medium (validation bypass potential, token costs)
- Mitigation: Strict validation enforcement, cost warnings

**Template Enhancements:**
- Affects: `lib/generation/genre-templates.ts` (pattern arrays), `lib/generation/assembler.ts` (selection logic)
- Risk: Low (same output format, different content)
- Mitigation: Test genre consistency across variations

**Advanced Editing:**
- Affects: `components/VelocityLane.tsx` (new), `components/QuantizationPanel.tsx` (new), `components/ChordSymbolOverlay.tsx` (new)
- Risk: Low (additive features, no breaking changes)
- Mitigation: Test sync between velocity lane and piano roll

**MIDI Hardware:**
- Affects: `hooks/useMIDIInput.ts` (new), `store/midiInputStore.ts` (new), `components/TransportControls.tsx` (record button)
- Risk: Medium (timing synchronization, browser compatibility)
- Mitigation: Feature detection, latency compensation, graceful degradation

---

## Research Gaps

**None identified.** All feature areas researched with:
- Stack recommendations (libraries, versions, integration)
- Feature patterns (DAW references, user expectations)
- Architectural integration points (components, stores, data flow)
- Pitfalls documentation (failure modes, prevention, testing)

**Ready to proceed to requirements definition.**

---

## Success Criteria

v1.1 succeeds if:

1. **UI feels professional** — matches DAW layout patterns (resizable sidebar, integrated timeline)
2. **Audio sounds better** — "good enough to compose with" vs v1.0 "harsh and robotic"
3. **Generation is more creative** — AI mode for unique compositions, template variations for consistency
4. **Editing is more powerful** — velocity editing, quantization, chord symbols (table stakes features)
5. **MIDI hardware works** — keyboard input, live recording (expands user workflows)
6. **No regressions** — v1.0 features still work, MIDI files still sound good, no performance degradation

---

## Next Steps

1. **Define Requirements** — translate research into v1.1 REQUIREMENTS.md
2. **Create Roadmap** — break requirements into phases (9-15 based on last milestone numbering)
3. **Plan phases** — detailed PLAN.md per phase
4. **Execute** — implement with atomic commits, testing, verification

---

## Sources

**Stack:**
- [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels)
- [Tone.js docs](https://tonejs.github.io/docs/PolySynth)
- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- [Web MIDI API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)

**Features:**
- [Hooktheory Piano Roll Guide](https://www.hooktheory.com/blog/piano-roll/)
- [Logic Pro Overview](https://support.apple.com/guide/logicpro/overview-lgcpa9111b0d/mac)
- [GPT-4-To-MIDI](https://github.com/d3n7/GPT-4-To-MIDI)
- [MIDI-GPT paper](https://arxiv.org/html/2501.17011v1)
- [LANDR Quantization Guide](https://blog.landr.com/quantization-in-music/)

**Architecture:**
- [Tone.js Instruments Wiki](https://github.com/Tonejs/Tone.js/wiki/Instruments)
- [Web MIDI Tutorial](https://www.smashingmagazine.com/2018/03/web-midi-api/)

**Pitfalls:**
- [Synthesis with Envelopes](https://chrislowis.co.uk/2013/06/17/synthesis-web-audio-api-envelopes)
- [Web Audio Filters](https://dobrian.github.io/cmp/topics/building-a-synthesizer-with-web-audio-api/3.filters.html)
- [Can I Use - Web MIDI](https://caniuse.com/midi)
