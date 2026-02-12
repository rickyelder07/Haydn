# Features Research: v1.1 Polish & Enhancement

**Research Date:** 2026-02-12
**Focus:** User expectations and feature patterns for UI redesign, synthesis, AI composition, advanced editing, MIDI hardware

---

## Overview

v1.0 shipped with functional-but-basic UI, template-based generation, and manual editing. v1.1 aims to "feel like a finished product" by matching professional DAW patterns while staying focused on natural language workflows.

---

## 1. UI Redesign: Professional Layout

### Reference Products

**Logic Pro X** ([Apple Support](https://support.apple.com/guide/logicpro/overview-lgcpa9111b0d/mac)):
- Left sidebar: Track list with mixer controls
- Center: Piano roll with integrated timeline ruler at top
- Right: Inspector panel (note properties, region info)
- Playhead: Drag from triangle icon, click timeline to jump

**Ableton Live**:
- Resizable panels (device browser, clip view, arrangement)
- Drag handles between panels with visual feedback
- Double-click handle to collapse/expand quickly

**FL Studio** ([Hooktheory](https://www.hooktheory.com/blog/piano-roll/)):
- Piano roll has "best in business" reputation
- Timeline scrubber at top with measure markers
- Playhead click-drag or click-to-jump interaction

### Feature Breakdown

#### 1.1.1: Resizable Sidebar

**Table stakes:**
- Drag handle on right edge to resize
- Min width enforcement (e.g., 200px)
- Collapse/expand toggle button
- Persists width across sessions (localStorage)

**Differentiators:**
- Double-click handle to toggle collapse (Ableton pattern)
- Smooth animation on resize (vs instant jump)
- Responsive breakpoints (auto-collapse on mobile)

**Avoid:**
- Vertical resizing (unnecessary complexity)
- Nested resizable panels (v1.1 scope too large)

**Complexity:** Moderate (react-resizable-panels handles most logic)

**Dependencies:** Replaces current vertical layout, affects page.tsx structure

---

#### 1.1.2: Integrated Timeline Scrubber

**Table stakes** ([Astro UX DS Timeline](https://www.astrouxds.com/components/timeline/)):
- Timeline ruler at top of piano roll (not separate)
- Measure/beat ticks along ruler
- Playhead indicator (vertical line + triangle)
- Click timeline to jump playhead
- Drag playhead triangle to scrub

**Differentiators:**
- Visual scrubbing feedback (smooth vs jumpy)
- Snap-to-grid option for playhead positioning
- Time display follows mouse on hover

**Avoid:**
- Multiple playheads ([DaVinci Resolve](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part2670.htm) feature, overkill for MIDI editor)
- Complex zoom UI (scroll zoom sufficient)

**Complexity:** Moderate (canvas rendering + mouse interaction logic)

**Dependencies:** Extends PianoRollCanvas, integrates with playbackStore

---

#### 1.1.3: Inline Name Editing

**Table stakes:**
- Click track/project name to edit (contentEditable or input)
- Enter key to confirm, Escape to cancel
- Validation (no empty names, character limits)

**Differentiators:**
- Auto-select all text on edit start
- Visual focus state (border, background change)

**Avoid:**
- Modal dialogs for editing (interrupts flow)
- Rich text editing (MIDI names are plain text)

**Complexity:** Simple (React state + event handlers)

**Dependencies:** TrackItem, MetadataDisplay components

---

## 2. Synthesis Quality: Better Audio

### Reference Context

**Current problem:** PolySynth sounds "harsh and synthetic, hard to listen to"

**Target bar:** "Good enough to compose with" (not production-ready)

**Research findings** ([Music Theory with Tone.js](https://www.guitarland.com/MusicTheoryWithToneJS/EditSynth.html), [Native Instruments Blog](https://blog.native-instruments.com/quantization-in-music/)):

### Feature Breakdown

#### 2.1: Per-Instrument ADSR Envelopes

**Table stakes:**
- Different envelopes per instrument family (piano vs strings vs brass)
- Eliminate abrupt note onsets (soft attack)
- Natural release times (notes don't cut off instantly)

**Differentiators:**
- Velocity-sensitive attack (softer notes = longer attack)
- Family-specific decay curves (piano decays, strings sustain)

**Avoid:**
- Per-note envelope editing UI (v1.1 scope creep)
- Exponential curves (linear sufficient for v1.1)

**Complexity:** Simple (parameter configuration)

**Dependencies:** NoteScheduler, instrument factory

---

#### 2.2: Filtered Oscillators

**Table stakes:**
- Lowpass filter on all instruments (remove harsh highs)
- Per-family filter cutoff (brass brighter than strings)

**Differentiators:**
- Resonance (Q factor) for character
- Bandpass for brass (focused midrange)

**Avoid:**
- Complex filter modulation (LFO on cutoff)
- User-configurable filter UI (preset approach for v1.1)

**Complexity:** Simple (Tone.js Filter node)

**Dependencies:** Instrument creation in NoteScheduler

---

#### 2.3: Vibrato/Modulation

**Table stakes:**
- Slight pitch modulation for "alive" sound
- Depth proportional to note length (short notes = no vibrato)

**Differentiators:**
- Random vibrato onset (not all notes vibrate identically)

**Avoid:**
- User-controlled vibrato depth (preset approach)

**Complexity:** Moderate (LFO integration)

**Dependencies:** PolySynth configuration

---

## 3. AI Composition Mode

### Reference Projects

**GPT-4-To-MIDI** ([GitHub](https://github.com/d3n7/GPT-4-To-MIDI)):
- Direct prompt to MIDI JSON
- Temperature 0 for deterministic output
- System prompt defines JSON schema strictly

**MIDI-GPT** ([arXiv paper](https://arxiv.org/html/2501.17011v1)):
- Supports "infilling" (incomplete MIDI → GPT fills gaps)
- Conditioning attributes: instrument, style, note density, polyphony
- Bar-level and track-level granularity

### Feature Breakdown

#### 3.1: AI Mode Toggle

**Table stakes:**
- Radio buttons or toggle switch (Template vs AI)
- Visual distinction (AI mode different color/icon)
- Warning about token costs (AI mode more expensive)

**Differentiators:**
- Cost estimate before generation ("~5,000 tokens, $0.50")
- Mode persistence (localStorage)

**Avoid:**
- Hybrid modes (confusing UX)
- Auto-switching based on prompt complexity (unpredictable)

**Complexity:** Simple (UI component + store flag)

**Dependencies:** GenerationInput component, nlGenerationStore

---

#### 3.2: Conversational Question Flow

**Table stakes:**
- GPT asks clarifying questions (max 3)
- User answers in same interface (no mode switching)
- Questions adapt based on prior answers
- Generate button appears after questions complete

**Differentiators:**
- Skip questions option ("Just generate with defaults")
- Question history visible (user sees conversation thread)

**Avoid:**
- Infinite question loops (strict max 3 limit)
- Required answers (allow "skip" or default)

**Complexity:** Moderate (chat UI + multi-turn state management)

**Dependencies:** New conversational UI component, API route

---

#### 3.3: Direct MIDI JSON Generation

**Table stakes:**
- GPT outputs MIDI JSON matching projectStore format
- Validation against music theory rules (reuse ValidationPipeline)
- Error handling if GPT outputs invalid JSON

**Differentiators:**
- Retry logic (if validation fails, ask GPT to fix)
- Fallback to template mode on repeated failures

**Avoid:**
- Streaming generation (latency vs complete validation)
- Partial application (all-or-nothing for coherence)

**Complexity:** Complex (schema design, validation, error handling)

**Dependencies:** ValidationPipeline, projectStore, OpenAI SDK

---

## 4. Template Generation Enhancements

### Current State

v1.0 templates follow strict formulas (predictable patterns, identical drum fills per genre).

### Feature Breakdown

#### 4.1: Pattern Variations

**Table stakes:**
- Multiple verse patterns per genre (3-5 variations)
- Multiple chorus patterns per genre (3-5 variations)
- Random selection per generation

**Differentiators:**
- Section-aware variation (verse 1 vs verse 2 different patterns)
- Consistent variation ID per generation (reproducible)

**Avoid:**
- Infinite procedural generation (curated variations only)
- Cross-genre pattern mixing (jazz verse + trap chorus = bad)

**Complexity:** Simple (array of patterns, random index)

**Dependencies:** Genre templates, generation assembler

---

#### 4.2: Drum Fill Variations

**Table stakes:**
- 8 fills per genre (section transitions, endings)
- Random selection at bar boundaries
- Genre-appropriate (trap fills != jazz fills)

**Differentiators:**
- Fill intensity levels (simple, medium, complex)
- Fill placement logic (chorus → verse = bigger fill)

**Avoid:**
- User-designed fills (v1.1 scope creep)
- Fill previews before generation (over-engineering)

**Complexity:** Simple (fill array + selection logic)

**Dependencies:** Drum track generator

---

## 5. Advanced Editing: Velocity, Quantization, Chords

### Reference DAWs

**FL Studio** ([Image-Line Forums](https://forum.image-line.com/viewtopic.php?t=325279)):
- Velocity editor as separate lane below piano roll
- Velocity "stalks" (vertical bars) for each note
- Click-drag to edit individual velocities
- Paint mode for rapid edits

**Studio One** ([Sound on Sound](https://www.soundonsound.com/techniques/studio-one-4-pattern-editing)):
- Automation lanes at bottom with tabs (Velocity, Repeat, Probability)
- Per-step function editing

### Feature Breakdown

#### 5.1: Velocity Editor Lane

**Table stakes:**
- Velocity stalks rendered below piano roll
- Height represents velocity (0-127)
- Click-drag to adjust individual velocities
- Visual sync with note selection (selected note = highlighted stalk)

**Differentiators:**
- Multi-select velocity editing (adjust all selected notes)
- Velocity curves (linear ramp across selection)

**Avoid:**
- Velocity automation (continuous vs per-note)
- CC automation lanes (v1.1 scope too large)

**Complexity:** Moderate (new canvas rendering logic)

**Dependencies:** PianoRollCanvas, editStore

---

#### 5.2: Quantization Controls

**Table stakes** ([LANDR Blog](https://blog.landr.com/quantization-in-music/)):
- Strength slider (0-100%, 100% = snap to grid exactly)
- Grid selector (1/4, 1/8, 1/16, 1/32 notes)
- "Exclude within" threshold (notes already close to grid remain untouched)

**Differentiators:**
- Swing parameter (50-75%, shifts offbeat notes)
- Apply to selection vs all notes

**Avoid:**
- Automatic quantization (user must trigger)
- Complex groove templates (v1.1 too complex)

**Complexity:** Moderate (quantization math + UI controls)

**Dependencies:** Edit operations, piano roll toolbar

---

#### 5.3: Chord Symbol Display

**Table stakes** ([Chord Display tool](https://chord-display.rednet.io/)):
- Detect chords per bar from note clusters
- Display chord symbols above piano roll (C, Dm, G7, etc.)
- Update dynamically as notes change

**Differentiators:**
- Click chord symbol to highlight chord notes
- Chord quality indicators (maj, min, dim, aug)

**Avoid:**
- Automatic chord progression analysis (too complex)
- Chord entry mode (typing chords → notes)

**Complexity:** Moderate (Tonal.js Chord.detect + SVG overlay)

**Dependencies:** Tonal.js, PianoRollCanvas

---

## 6. MIDI Hardware: Keyboard Input & Recording

### Reference Resources

**Web MIDI API Tutorial** ([Smashing Magazine](https://www.smashingmagazine.com/2018/03/web-midi-api/)):
- `navigator.requestMIDIAccess()` for device enumeration
- `midimessage` event for note on/off
- Latency: 10-20ms typical (acceptable for recording)

**Browser Support** ([Can I Use](https://caniuse.com/midi)):
- Chrome/Edge/Opera: Full support
- Firefox: Experimental flag required
- Safari: Not supported (graceful degradation needed)

### Feature Breakdown

#### 6.1: Keyboard Input (Paused)

**Table stakes:**
- Detect MIDI keyboard connection
- Play notes of currently selected track when keys pressed
- Visual feedback (keyboard indicator, note highlight)

**Differentiators:**
- Sustain pedal support (CC 64)
- Velocity sensitivity (MIDI velocity → playback velocity)

**Avoid:**
- MIDI learn for controls (v1.1 scope creep)
- Multiple keyboard support (single device for v1.1)

**Complexity:** Moderate (Web MIDI integration, audio playback)

**Dependencies:** Web MIDI API, playbackStore, track selection

---

#### 6.2: Live Recording (During Playback)

**Table stakes:**
- Record button in transport controls
- Arm track for recording (explicit target)
- Record MIDI input during playback
- Stop recording with playback stop or record button

**Differentiators:**
- Count-in before recording (1-2 bars)
- Recording indicator (visual feedback)
- Undo recording (clear last recorded notes)

**Avoid:**
- Overdub mode (layering recordings)
- Punch in/out (start/stop recording mid-playback)
- Loop recording (multiple takes)

**Complexity:** Complex (timing sync, note creation, playback integration)

**Dependencies:** playbackStore, projectStore, Web MIDI API

---

## Feature Summary

| Feature | Priority | Complexity | Dependencies | Table Stakes | Differentiators |
|---------|----------|------------|--------------|--------------|-----------------|
| Resizable sidebar | 1 (UI) | Moderate | Layout restructure | Drag resize, collapse | Double-click toggle, persist |
| Timeline scrubber | 1 (UI) | Moderate | PianoRollCanvas | Click-jump, drag scrub | Smooth feedback, snap-to-grid |
| Inline editing | 1 (UI) | Simple | Components | Click-to-edit, validation | Auto-select text |
| ADSR envelopes | 2 (Audio) | Simple | NoteScheduler | Per-family envelopes | Velocity-sensitive |
| Filtered oscillators | 2 (Audio) | Simple | NoteScheduler | Lowpass filter | Family-specific cutoff |
| Vibrato | 2 (Audio) | Moderate | PolySynth | Pitch modulation | Random onset |
| AI mode toggle | 3 (Generation) | Simple | UI component | Template vs AI switch | Cost estimate |
| Question flow | 3 (Generation) | Moderate | API route | Max 3 questions | Skip option |
| Direct MIDI gen | 3 (Generation) | Complex | ValidationPipeline | JSON output, validation | Retry logic |
| Pattern variations | 3 (Generation) | Simple | Templates | Multiple patterns | Section-aware |
| Drum fills | 3 (Generation) | Simple | Drum generator | 8 fills/genre | Intensity levels |
| Velocity lane | 4 (Editing) | Moderate | Canvas | Stalks, click-drag | Multi-select edit |
| Quantization | 4 (Editing) | Moderate | Edit operations | Strength, grid, threshold | Swing parameter |
| Chord symbols | 4 (Editing) | Moderate | Tonal.js | Detect, display | Highlight notes |
| Keyboard input | 4 (MIDI) | Moderate | Web MIDI | Play on input | Sustain pedal |
| Live recording | 4 (MIDI) | Complex | Playback sync | Record during playback | Count-in, undo |

---

## Sources

- [Hooktheory Piano Roll Guide](https://www.hooktheory.com/blog/piano-roll/)
- [Astro UX Design System - Timeline](https://www.astrouxds.com/components/timeline/)
- [DaVinci Resolve Multiple Playheads](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part2670.htm)
- [Music Theory with Tone.js](https://www.guitarland.com/MusicTheoryWithToneJS/EditSynth.html)
- [GPT-4-To-MIDI GitHub](https://github.com/d3n7/GPT-4-To-MIDI)
- [MIDI-GPT paper](https://arxiv.org/html/2501.17011v1)
- [FL Studio Velocity Editor](https://forum.image-line.com/viewtopic.php?t=325279)
- [Studio One Pattern Editing](https://www.soundonsound.com/techniques/studio-one-4-pattern-editing)
- [LANDR Quantization Guide](https://blog.landr.com/quantization-in-music/)
- [Chord Display tool](https://chord-display.rednet.io/)
- [Smashing Magazine Web MIDI Tutorial](https://www.smashingmagazine.com/2018/03/web-midi-api/)
- [Can I Use - Web MIDI](https://caniuse.com/midi)
- [Logic Pro Piano Roll](https://support.apple.com/guide/logicpro/overview-lgcpa9111b0d/mac)
