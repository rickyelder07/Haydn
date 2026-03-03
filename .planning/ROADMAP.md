# Roadmap: Haydn

## Overview

Haydn transforms natural language into musical MIDI edits through an 8-phase journey. Starting with MIDI infrastructure (file I/O, parsing), we build a robust audio playback engine with precise timing, then layer on a piano roll editor for manual control. The core differentiator arrives in phases 4-6: a music theory validation engine paired with natural language editing (single-shot and generation modes) that produces musically coherent results. Finally, we expand to multi-track support and conversational editing for complex, iterative refinements.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-02-12)
- 🚧 **v1.1 Polish & Enhancement** — Phases 9-14 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) — SHIPPED 2026-02-12</summary>

### Phase 1: Foundation & MIDI Infrastructure
**Goal**: Users can import MIDI/MusicXML files, export to standard MIDI format, and view parsed data
**Status**: Complete (2026-01-24)
**Plans**: 6/6 complete

### Phase 2: Audio Playback Engine
**Goal**: Users can play MIDI projects with accurate timing and basic synthesis
**Status**: Complete (2026-01-26)
**Plans**: 6/6 complete

### Phase 3: Piano Roll Editor
**Goal**: Users can visually edit MIDI notes with manual control and undo/redo
**Status**: Complete (2026-01-30)
**Plans**: 6/6 complete

### Phase 4: Music Theory Validation Layer
**Goal**: System validates all edits against music theory rules before applying, with visual feedback showing scale conformance
**Status**: Complete (2026-02-02)
**Plans**: 5/5 complete

### Phase 5: Natural Language Editing - Single-Shot
**Goal**: Users can edit MIDI using natural language prompts without conversation context
**Status**: Complete (2026-02-04)
**Plans**: 4/4 complete

### Phase 6: Natural Language Generation
**Goal**: Users can generate MIDI from scratch using text descriptions
**Status**: Complete (2026-02-07)
**Plans**: 4/4 complete

### Phase 7: Multi-Track Support
**Goal**: Users can work with multiple tracks and manage them independently
**Status**: Complete (2026-02-09)
**Plans**: 6/6 complete

### Phase 8: Conversational Editing Mode
**Goal**: Users can edit MIDI through multi-turn conversations with preserved context
**Status**: Complete (2026-02-11)
**Plans**: 5/5 complete

**Milestone Summary:**
- 8 phases, 42 plans, 19 days
- Full MIDI pipeline with import/export, audio playback, visual editor
- Natural language editing (single-shot and conversational) with music theory validation
- Multi-track support with mute/solo, drag-and-drop, and ghost notes
- See `.planning/milestones/v1.0-ROADMAP.md` for full details

</details>

### 🚧 v1.1 Polish & Enhancement (In Progress)

**Milestone Goal:** Transform MVP into polished, production-ready tool with professional UI/UX, improved audio quality, more creative MIDI generation, and advanced editing capabilities.

#### Phase 9: Professional Layout
**Goal**: Application has professional DAW-style layout with resizable sidebar and integrated timeline
**Status**: Complete (2026-02-17)
**Depends on**: Nothing (milestone start)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09
**Success Criteria** (what must be TRUE):
  1. User can resize sidebar by dragging edge and width persists across sessions
  2. User can drag playhead triangle or click timeline to jump playback position
  3. User can edit track and project names by clicking inline (Enter confirms, Escape cancels)
  4. Timeline ruler displays measure and beat ticks integrated with piano roll
  5. Transport controls are visually integrated with piano roll (not separate section)
**Plans**: 4/4 complete

Plans:
- [x] 09-01-PLAN.md — Resizable sidebar with persistence (UI-01, UI-02, UI-03)
- [x] 09-02-PLAN.md — Inline editing for track/project names (UI-07, UI-08)
- [x] 09-03-PLAN.md — Timeline ruler with hierarchical ticks and transport strip (UI-06, UI-09)
- [x] 09-04-PLAN.md — Playhead interaction (drag and click) (UI-04, UI-05)

#### Phase 10: Real Instrument Samples
**Goal**: Audio quality reaches "good enough to compose with" standard via real GM instrument samples loaded from CDN
**Depends on**: Phase 9
**Requirements**: AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, AUDIO-06, AUDIO-07
**Success Criteria** (what must be TRUE):
  1. All 128 GM instruments play using real recorded samples (not PolySynth)
  2. Instruments pre-load on project import — playback blocked until ready
  3. Loading progress is visible in transport area (spinner/progress bar)
  4. Percussion (program 999) continues to work (may stay PolySynth)
  5. Audio quality is noticeably better than v1.0 (subjective improvement confirmed by user)
**Plans**: 4 plans

Plans:
- [ ] 10-01-PLAN.md — CDN sample loading foundation: gmInstrumentNames, soundfontLoader, SamplerInstrument (AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05)
- [ ] 10-02-PLAN.md — Wire samples into audio engine: InstrumentFactory routing, NoteScheduler parallel loading (AUDIO-06)
- [ ] 10-03-PLAN.md — User verification of audio quality improvement (AUDIO-07)
- [ ] 10-04-PLAN.md — Gap closure: visible "Loading samples..." text label in TransportStrip (AUDIO-03)

#### Phase 11: AI Composition Mode
**Goal**: Users can generate unique MIDI compositions via conversational AI with GPT-4o direct synthesis
**Depends on**: Phase 10
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10
**Success Criteria** (what must be TRUE):
  1. User can toggle between Template and AI composition modes before generation
  2. AI mode shows token cost estimate and asks up to 3 clarifying questions
  3. User can skip questions and generate with defaults if desired
  4. AI-generated MIDI passes through ValidationPipeline (fails cause retry, fallback after 3 attempts)
  5. Conversation history visible during question flow and token usage displayed after generation
**Plans**: 4 plans

Plans:
- [ ] 11-01-PLAN.md — MidiCompositionSchema + aiCompositionStore state machine (AI-05, AI-06, AI-07, AI-08)
- [ ] 11-02-PLAN.md — Unified /api/ai-compose route (clarify + generate) (AI-03, AI-04, AI-05)
- [ ] 11-03-PLAN.md — GenerationInput mode toggle + AI Compose UI (AI-01, AI-02, AI-04, AI-09, AI-10)
- [ ] 11-04-PLAN.md — Production build gate + human verification (AI-01 through AI-10)

#### Phase 12: Template Variations
**Goal**: Template generation produces varied, unpredictable results through pattern randomization
**Depends on**: Phase 11
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06
**Success Criteria** (what must be TRUE):
  1. Each genre has 3-5 verse and chorus pattern variations that select randomly
  2. Drum fills (8 variations per genre) insert randomly at section boundaries
  3. Generated MIDI sounds different across generations but maintains genre consistency
**Plans**: 2 plans

Plans:
- [x] 12-01-PLAN.md — genreTemplates.ts: interface extension + expanded chord progressions + 8 drum fills per genre (TMPL-01, TMPL-02, TMPL-03, TMPL-06)
- [x] 12-02-PLAN.md — chordGenerator + rhythmGenerator logic: random selection + fill injection + human verification (TMPL-04, TMPL-05)

#### Phase 13: Advanced Piano Roll Editing
**Goal**: Users can edit velocity, quantize timing, and view chord symbols in piano roll
**Depends on**: Phase 9 (requires new UI layout)
**Requirements**: VEL-01, VEL-02, VEL-03, VEL-04, VEL-05, VEL-06, QUANT-01, QUANT-02, QUANT-03, QUANT-04, QUANT-05, QUANT-06, QUANT-07, CHORD-01, CHORD-02, CHORD-03, CHORD-04, CHORD-05
**Success Criteria** (what must be TRUE):
  1. Velocity lane renders below piano roll showing stalks that user can drag to edit velocities
  2. Velocity lane scrolls in sync with piano roll and highlights selected notes
  3. Quantization controls accessible in toolbar with strength, grid, swing, and threshold settings
  4. Quantization applies to selected notes (or all if none selected) and is undoable
  5. Chord symbols display above note grid, detect from notes in each bar (3+ notes), and highlight notes when clicked
  6. User can toggle chord symbol visibility on/off
**Plans**: 4 plans

Plans:
- [x] 13-01-PLAN.md — Utility layer: quantizeUtils.ts + chordDetection.ts + editStore.updateNoteDirectly (QUANT-02, QUANT-03, QUANT-04, QUANT-05, QUANT-07, CHORD-02, VEL-05)
- [x] 13-02-PLAN.md — VelocityLane canvas component with drag editing and multi-select delta (VEL-01, VEL-02, VEL-03, VEL-04, VEL-05, VEL-06)
- [x] 13-03-PLAN.md — QuantizePopover + ChordStrip standalone components (QUANT-01, QUANT-02, QUANT-03, QUANT-04, QUANT-05, CHORD-01, CHORD-02, CHORD-04, CHORD-05)
- [x] 13-04-PLAN.md — PianoRollEditor wiring + dynamic height math + human verification (all requirements)

#### Phase 14: MIDI Hardware Integration
**Goal**: Users can play and record MIDI using hardware keyboards via Web MIDI API
**Depends on**: Phase 13
**Requirements**: MIDI-01, MIDI-02, MIDI-03, MIDI-04, MIDI-05, MIDI-06, MIDI-07, MIDI-08, MIDI-09, MIDI-10, MIDI-11, MIDI-12, MIDI-13
**Success Criteria** (what must be TRUE):
  1. System detects Web MIDI availability and displays clear error if unsupported (Firefox/Safari)
  2. User can connect MIDI keyboard, see connected devices, and play current track when paused
  3. Keyboard input respects velocity sensitivity and sustain pedal (CC 64) works properly
  4. User can arm track for recording, start during playback with count-in (1 bar)
  5. Recorded notes align with beat grid (latency compensation applied) and recording is undoable
  6. Recording indicator visible during active recording
**Plans**: TBD

Plans:
- [ ] 14-01: TBD
- [ ] 14-02: TBD
- [ ] 14-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1-8 (complete) → 9 → 10 → 11 → 12 → 13 → 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & MIDI Infrastructure | v1.0 | 6/6 | Complete | 2026-01-24 |
| 2. Audio Playback Engine | v1.0 | 6/6 | Complete | 2026-01-26 |
| 3. Piano Roll Editor | v1.0 | 6/6 | Complete | 2026-01-30 |
| 4. Music Theory Validation Layer | v1.0 | 5/5 | Complete | 2026-02-02 |
| 5. Natural Language Editing - Single-Shot | v1.0 | 4/4 | Complete | 2026-02-04 |
| 6. Natural Language Generation | v1.0 | 4/4 | Complete | 2026-02-07 |
| 7. Multi-Track Support | v1.0 | 6/6 | Complete | 2026-02-09 |
| 8. Conversational Editing Mode | v1.0 | 5/5 | Complete | 2026-02-11 |
| 9. Professional Layout | v1.1 | 4/4 | Complete | 2026-02-17 |
| 10. Synthesis Enhancement | 4/4 | Complete    | 2026-02-27 | - |
| 11. AI Composition Mode | 4/4 | Complete    | 2026-02-28 | - |
| 12. Template Variations | v1.1 | Complete    | 2026-03-02 | 2026-03-02 |
| 13. Advanced Piano Roll Editing | v1.1 | 4/4 | Complete | 2026-03-03 |
| 14. MIDI Hardware Integration | v1.1 | 0/TBD | Not started | - |

---

*Last updated: 2026-03-03 after Phase 13 complete (4 plans: utility layer + VelocityLane + QuantizePopover/ChordStrip + PianoRollEditor wiring with bug fixes)*
