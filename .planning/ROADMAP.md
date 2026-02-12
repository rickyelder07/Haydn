# Roadmap: Haydn

## Overview

Haydn transforms natural language into musical MIDI edits through an 8-phase journey. Starting with MIDI infrastructure (file I/O, parsing), we build a robust audio playback engine with precise timing, then layer on a piano roll editor for manual control. The core differentiator arrives in phases 4-6: a music theory validation engine paired with natural language editing (single-shot and generation modes) that produces musically coherent results. Finally, we expand to multi-track support and conversational editing for complex, iterative refinements.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-02-12)

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

## Progress

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
