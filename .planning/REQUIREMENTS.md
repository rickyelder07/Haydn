# Requirements: Haydn

**Defined:** 2026-01-23
**Core Value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### File I/O

- [x] **IO-01**: User can upload a MIDI file (.mid/.midi)
- [x] **IO-02**: User can upload a MusicXML file
- [x] **IO-03**: User can export current project to standard MIDI format
- [x] **IO-04**: Imported MIDI files preserve all track, tempo, and note data
- [x] **IO-05**: Exported MIDI files are compatible with Logic Pro X, Ableton, and FL Studio

### Natural Language Generation

- [ ] **NL-01**: User can generate MIDI from scratch via text prompt (e.g., "create a lo-fi hip hop beat")
- [ ] **NL-02**: Generated MIDI follows music theory rules (correct scales, functional harmony)
- [ ] **NL-03**: Generated MIDI respects genre conventions specified in prompt
- [ ] **NL-04**: User can specify tempo, key, and time signature in generation prompt

### Natural Language Editing - Conversational Mode

- [ ] **NL-05**: User can edit MIDI using conversational mode (multi-turn with context)
- [ ] **NL-06**: Conversational mode preserves edit history across multiple prompts
- [ ] **NL-07**: User can make structural changes (e.g., "add a bridge section", "make chorus longer")
- [ ] **NL-08**: User can make note-level changes (e.g., "make melody more upbeat", "change to minor key")
- [ ] **NL-09**: User can swap or add instruments (e.g., "replace piano with strings", "add drums")
- [ ] **NL-10**: User can adjust timing (e.g., "speed up to 140 BPM", "swing the hi-hats")

### Natural Language Editing - Single-Shot Mode

- [x] **NL-11**: User can edit MIDI using single-shot mode (independent prompts without context)
- [x] **NL-12**: Single-shot edits apply to selected track or entire project as specified

### Music Theory & Quality Validation

- [x] **THEORY-01**: Edits respect music theory (scales, chord progressions, harmonic coherence)
- [x] **THEORY-02**: Edits respect genre conventions (trap drums sound like trap, not jazz)
- [x] **THEORY-03**: Edits preserve context with existing track (smooth transitions, no jarring changes)
- [x] **THEORY-04**: System validates LLM output against music theory rules before applying

### Multi-Track Support

- [ ] **TRACK-01**: User can create projects with up to 32 tracks
- [ ] **TRACK-02**: User can add new tracks to existing project
- [ ] **TRACK-03**: User can remove tracks from project
- [ ] **TRACK-04**: User can solo individual tracks (mute all others)
- [ ] **TRACK-05**: User can mute individual tracks
- [ ] **TRACK-06**: Project supports up to 5,000 notes total across all tracks
- [ ] **TRACK-07**: Each track displays instrument/track name

### Playback & Preview

- [x] **PLAY-01**: User can play current project with basic audio synthesis
- [x] **PLAY-02**: User can pause playback
- [x] **PLAY-03**: User can stop playback and return to start
- [x] **PLAY-04**: User can adjust project tempo
- [x] **PLAY-05**: Playback quality is sufficient to understand musical content (low-quality synthesis acceptable)

### Editing Interface

- [x] **EDIT-01**: User can view MIDI notes in piano roll editor
- [x] **EDIT-02**: User can manually add notes via piano roll
- [x] **EDIT-03**: User can manually delete notes via piano roll
- [x] **EDIT-04**: User can manually move notes via piano roll
- [x] **EDIT-05**: User can undo previous action
- [x] **EDIT-06**: User can redo previously undone action
- [x] **EDIT-07**: Piano roll displays all tracks with visual distinction

### Technical Efficiency

- [x] **TECH-01**: System uses MIDI manipulation libraries to minimize LLM token usage per prompt
- [x] **TECH-02**: GPT-4o processes natural language and outputs structured edit instructions (not raw MIDI bytes)
- [x] **TECH-03**: MIDI data is converted to JSON format before sending to LLM
- [x] **TECH-04**: System tracks token usage per edit operation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Project Management

- **PROJ-01**: User can save projects for later sessions
- **PROJ-02**: User can load previously saved projects
- **PROJ-03**: User can manage multiple projects

### User Accounts

- **AUTH-01**: User can create account
- **AUTH-02**: User can log in to access saved projects
- **AUTH-03**: User projects persist across devices

### Advanced Editing UI

- **UI-01**: User can edit note velocities visually
- **UI-02**: User can adjust quantization settings manually
- **UI-03**: User can use keyboard shortcuts for common actions
- **UI-04**: User can view chord symbols above piano roll
- **UI-05**: User can zoom horizontally and vertically in piano roll

### MIDI Hardware

- **HW-01**: User can connect MIDI keyboard via Web MIDI API
- **HW-02**: User can record MIDI input from hardware

### Collaboration

- **COLLAB-01**: User can share project via link
- **COLLAB-02**: Multiple users can view same project
- **COLLAB-03**: Users can leave comments on projects

### Cloud Features

- **CLOUD-01**: Projects automatically save to cloud storage
- **CLOUD-02**: User can access version history
- **CLOUD-03**: Application works offline as PWA

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Audio file import (MP3, WAV, stems) | MIDI-only focus for v1. Audio recording is desktop DAW territory |
| VST/AU plugin support | Impossible in browser sandbox. Use SoundFont + Web Audio instead |
| Advanced mixing/mastering (EQ, compression, reverb) | Desktop DAW strength. Focus on MIDI editing, export to professional tools |
| Unlimited track count | Browser performance limits. 32 tracks matches MIDI standard |
| Real-time collaboration (simultaneous editing) | High complexity, network latency issues. Defer to v2+ |
| Mobile native apps | Web-first strategy. Mobile web experience acceptable for v1 |
| Multiple export formats (WAV, MP3, stems) | Standard MIDI sufficient. Users export to DAW for audio rendering |
| Notation view (sheet music) | High complexity. Piano roll sufficient for target users (producers, not composers) |
| Built-in sample library | Storage/bandwidth costs. Users bring SoundFonts or use basic synthesis |
| Humanization features (automatic velocity variation, timing imperfections) | May emerge naturally from music theory engine. Not explicit requirement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IO-01 | Phase 1 | Complete |
| IO-02 | Phase 1 | Complete |
| IO-03 | Phase 1 | Complete |
| IO-04 | Phase 1 | Complete |
| IO-05 | Phase 1 | Complete |
| NL-01 | Phase 6 | Pending |
| NL-02 | Phase 6 | Pending |
| NL-03 | Phase 6 | Pending |
| NL-04 | Phase 6 | Pending |
| NL-05 | Phase 8 | Pending |
| NL-06 | Phase 8 | Pending |
| NL-07 | Phase 8 | Pending |
| NL-08 | Phase 8 | Pending |
| NL-09 | Phase 8 | Pending |
| NL-10 | Phase 8 | Pending |
| NL-11 | Phase 5 | Complete |
| NL-12 | Phase 5 | Complete |
| THEORY-01 | Phase 4 | Complete |
| THEORY-02 | Phase 4 | Complete |
| THEORY-03 | Phase 4 | Complete |
| THEORY-04 | Phase 4 | Complete |
| TRACK-01 | Phase 7 | Pending |
| TRACK-02 | Phase 7 | Pending |
| TRACK-03 | Phase 7 | Pending |
| TRACK-04 | Phase 7 | Pending |
| TRACK-05 | Phase 7 | Pending |
| TRACK-06 | Phase 7 | Pending |
| TRACK-07 | Phase 7 | Pending |
| PLAY-01 | Phase 2 | Complete |
| PLAY-02 | Phase 2 | Complete |
| PLAY-03 | Phase 2 | Complete |
| PLAY-04 | Phase 2 | Complete |
| PLAY-05 | Phase 2 | Complete |
| EDIT-01 | Phase 3 | Complete |
| EDIT-02 | Phase 3 | Complete |
| EDIT-03 | Phase 3 | Complete |
| EDIT-04 | Phase 3 | Complete |
| EDIT-05 | Phase 3 | Complete |
| EDIT-06 | Phase 3 | Complete |
| EDIT-07 | Phase 3 | Complete |
| TECH-01 | Phase 1 | Complete |
| TECH-02 | Phase 5 | Complete |
| TECH-03 | Phase 1 | Complete |
| TECH-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after roadmap creation*
