# Roadmap: Haydn

## Overview

Haydn transforms natural language into musical MIDI edits through an 8-phase journey. Starting with MIDI infrastructure (file I/O, parsing), we build a robust audio playback engine with precise timing, then layer on a piano roll editor for manual control. The core differentiator arrives in phases 4-6: a music theory validation engine paired with natural language editing (single-shot and generation modes) that produces musically coherent results. Finally, we expand to multi-track support and conversational editing for complex, iterative refinements. Each phase delivers verifiable capabilities that build toward the core value: natural language edits that follow music theory, respect genre conventions, and maintain track context.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & MIDI Infrastructure** - File I/O, MIDI parsing, data model
- [x] **Phase 2: Audio Playback Engine** - Precise timing, transport controls, synthesis
- [ ] **Phase 3: Piano Roll Editor** - Visual editing interface with manual note control
- [ ] **Phase 4: Music Theory Validation Layer** - Theory engine for coherent edits
- [ ] **Phase 5: Natural Language Editing - Single-Shot** - Core NL editing with token efficiency
- [ ] **Phase 6: Natural Language Generation** - Create MIDI from text prompts
- [ ] **Phase 7: Multi-Track Support** - Expand to multiple tracks with track management
- [ ] **Phase 8: Conversational Editing Mode** - Multi-turn context with edit history

## Phase Details

### Phase 1: Foundation & MIDI Infrastructure
**Goal**: Users can import MIDI/MusicXML files, export to standard MIDI format, and view parsed data
**Depends on**: Nothing (first phase)
**Requirements**: IO-01, IO-02, IO-03, IO-04, IO-05, TECH-01, TECH-03
**Success Criteria** (what must be TRUE):
  1. User can upload a .mid or .midi file and see its contents parsed correctly
  2. User can upload a .musicxml file and see its contents converted to internal format
  3. User can export current project to .mid format that opens in Logic Pro X, Ableton, and FL Studio
  4. Imported files preserve all tracks, tempo, time signatures, and note data
  5. System uses @tonejs/midi library for client-side MIDI manipulation
**Plans**: 6 plans in 5 waves

Plans:
- [x] 01-01-PLAN.md - Project setup, types, GM mapping, state store (Wave 1)
- [x] 01-02-PLAN.md - MIDI validation and parsing (Wave 2)
- [x] 01-03-PLAN.md - MusicXML parsing and conversion (Wave 2, parallel)
- [x] 01-04-PLAN.md - MIDI export and download (Wave 3)
- [x] 01-05-PLAN.md - UI components: upload, tracks, metadata, export button (Wave 4)
- [x] 01-06-PLAN.md - Page integration and human verification (Wave 5)

### Phase 2: Audio Playback Engine
**Goal**: Users can play MIDI projects with accurate timing and basic synthesis
**Depends on**: Phase 1
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05
**Success Criteria** (what must be TRUE):
  1. User can press play and hear all MIDI notes with correct timing
  2. User can pause playback and resume from the same position
  3. User can stop playback and return to the beginning
  4. User can adjust project tempo and hear immediate effect on playback
  5. Playback timing remains accurate for tracks longer than 3 minutes (no drift)
**Plans**: 6 plans in 6 waves

Plans:
- [ ] 02-01-PLAN.md - Install Tone.js, AudioEngine singleton, InstrumentFactory (Wave 1)
- [ ] 02-02-PLAN.md - Time conversion, NoteScheduler, PlaybackController (Wave 2)
- [ ] 02-03-PLAN.md - Playback store, TransportControls UI (Wave 3)
- [ ] 02-04-PLAN.md - Keyboard shortcuts, note highlighting, page integration (Wave 4)
- [ ] 02-05-PLAN.md - Metronome, count-in (Wave 5)
- [ ] 02-06-PLAN.md - Human verification checkpoint (Wave 6)

### Phase 3: Piano Roll Editor
**Goal**: Users can visually edit MIDI notes with manual control and undo/redo
**Depends on**: Phase 2
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07
**Success Criteria** (what must be TRUE):
  1. User can see all MIDI notes displayed in piano roll view with correct pitch and timing
  2. User can click to add a new note at any pitch and time position
  3. User can click a note to delete it
  4. User can drag a note to change its pitch or timing position
  5. User can undo any action and see previous state restored
  6. User can redo a previously undone action
**Plans**: 6 plans in 5 waves

Plans:
- [ ] 03-01-PLAN.md - Undo/redo history manager and edit store (Wave 1)
- [ ] 03-02-PLAN.md - Piano roll canvas rendering, grid, piano keys sidebar (Wave 1, parallel)
- [ ] 03-03-PLAN.md - Note interactions: add, delete, move with assembled editor (Wave 2)
- [ ] 03-04-PLAN.md - Zoom controls and note inspector panel (Wave 3)
- [ ] 03-05-PLAN.md - Page integration, track selection, keyboard shortcuts (Wave 4)
- [ ] 03-06-PLAN.md - Human verification checkpoint (Wave 5)

### Phase 4: Music Theory Validation Layer
**Goal**: System validates all edits against music theory rules before applying
**Depends on**: Phase 3
**Requirements**: THEORY-01, THEORY-02, THEORY-03, THEORY-04
**Success Criteria** (what must be TRUE):
  1. Edits that violate scale constraints are rejected with musical explanation (e.g., "F# not in C major")
  2. Chord progressions follow functional harmony rules for the specified genre
  3. Transitions between edited and existing sections sound smooth without jarring key changes
  4. System provides visual feedback showing which notes conform to current key/scale
**Plans**: TBD

Plans:
- [ ] 04-01: [To be determined during planning]

### Phase 5: Natural Language Editing - Single-Shot
**Goal**: Users can edit MIDI using natural language prompts without conversation context
**Depends on**: Phase 4
**Requirements**: NL-11, NL-12, TECH-02, TECH-04
**Success Criteria** (what must be TRUE):
  1. User can type "make the melody happier" and see notes change to major key
  2. User can type "speed up to 140 BPM" and tempo changes immediately
  3. User can specify which track to edit (e.g., "add strings to track 2")
  4. GPT-4o returns structured edit instructions (not MIDI bytes) that system executes
  5. System tracks token usage and displays cost per edit operation
**Plans**: TBD

Plans:
- [ ] 05-01: [To be determined during planning]

### Phase 6: Natural Language Generation
**Goal**: Users can generate MIDI from scratch using text descriptions
**Depends on**: Phase 5
**Requirements**: NL-01, NL-02, NL-03, NL-04
**Success Criteria** (what must be TRUE):
  1. User can type "create a lo-fi hip hop beat" and receive a complete MIDI track
  2. Generated MIDI follows correct scales and functional harmony (no random notes)
  3. Generated MIDI matches genre conventions (trap drums sound like trap, not jazz)
  4. User can specify tempo, key, and time signature in prompt (e.g., "120 BPM in D minor, 4/4")
**Plans**: TBD

Plans:
- [ ] 06-01: [To be determined during planning]

### Phase 7: Multi-Track Support
**Goal**: Users can work with multiple tracks and manage them independently
**Depends on**: Phase 6
**Requirements**: TRACK-01, TRACK-02, TRACK-03, TRACK-04, TRACK-05, TRACK-06, TRACK-07
**Success Criteria** (what must be TRUE):
  1. User can create projects with up to 32 tracks
  2. User can add a new empty track or remove an existing track
  3. User can solo a track to hear it alone (mutes all others temporarily)
  4. User can mute/unmute individual tracks during playback
  5. Projects with up to 5,000 notes across all tracks load and play without performance issues
  6. Each track displays its instrument name clearly in the interface
**Plans**: TBD

Plans:
- [ ] 07-01: [To be determined during planning]

### Phase 8: Conversational Editing Mode
**Goal**: Users can edit MIDI through multi-turn conversations with preserved context
**Depends on**: Phase 7
**Requirements**: NL-05, NL-06, NL-07, NL-08, NL-09, NL-10
**Success Criteria** (what must be TRUE):
  1. User can make multiple edits in sequence (e.g., "add drums" -> "make them louder" -> "add swing")
  2. System preserves edit history and references previous changes in context
  3. User can make structural changes via conversation (e.g., "add a bridge section", "make chorus 8 bars longer")
  4. User can make note-level changes (e.g., "raise the melody an octave", "change to minor key")
  5. User can swap instruments or add/remove tracks conversationally (e.g., "replace piano with strings")
  6. User can adjust timing conversationally (e.g., "swing the hi-hats", "quantize to 16th notes")
**Plans**: TBD

Plans:
- [ ] 08-01: [To be determined during planning]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & MIDI Infrastructure | 6/6 | Complete | 2026-01-24 |
| 2. Audio Playback Engine | 6/6 | Complete | 2026-01-26 |
| 3. Piano Roll Editor | 0/6 | Not started | - |
| 4. Music Theory Validation Layer | 0/TBD | Not started | - |
| 5. Natural Language Editing - Single-Shot | 0/TBD | Not started | - |
| 6. Natural Language Generation | 0/TBD | Not started | - |
| 7. Multi-Track Support | 0/TBD | Not started | - |
| 8. Conversational Editing Mode | 0/TBD | Not started | - |
