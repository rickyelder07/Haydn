# Requirements: Haydn v1.1

**Defined:** 2026-02-12
**Core Value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.

---

## v1.1 Requirements

Requirements for v1.1 Polish & Enhancement milestone. Each maps to roadmap phases.

### UI Enhancement

- [ ] **UI-01**: User can resize sidebar by dragging right edge
- [ ] **UI-02**: User can collapse/expand sidebar with toggle button
- [ ] **UI-03**: Sidebar width persists across browser sessions
- [ ] **UI-04**: User can drag playhead by clicking timeline ruler triangle
- [ ] **UI-05**: User can click anywhere on timeline ruler to jump playhead
- [ ] **UI-06**: Timeline ruler displays measure and beat ticks
- [ ] **UI-07**: User can edit track names inline (click to edit, Enter to confirm, Escape to cancel)
- [ ] **UI-08**: User can edit project name inline
- [ ] **UI-09**: Transport controls integrate visually with piano roll (not separate section)

### Audio Quality

- [x] **AUDIO-01**: Piano instruments use percussive envelope (short attack, medium decay)
- [x] **AUDIO-02**: String instruments use sustained envelope (long attack, high sustain)
- [x] **AUDIO-03**: Brass instruments use punchy envelope (medium attack, medium sustain)
- [x] **AUDIO-04**: All non-percussion instruments have lowpass filter (2-5kHz cutoff)
- [x] **AUDIO-05**: String instruments include subtle vibrato (4-5Hz frequency, 5-10 cent depth)
- [x] **AUDIO-06**: Percussion instruments (channel 9) have no vibrato or filtering
- [x] **AUDIO-07**: Instrument sounds are noticeably better than v1.0 (subjective: "good enough to compose with")

### AI Composition Mode

- [ ] **AI-01**: User can toggle between Template and AI composition modes
- [ ] **AI-02**: AI mode displays token cost estimate before generation
- [ ] **AI-03**: GPT-4o asks up to 3 clarifying questions about desired composition
- [ ] **AI-04**: User can skip questions and generate with defaults
- [x] **AI-05**: GPT-4o generates MIDI JSON directly (not template parameters)
- [x] **AI-06**: AI-generated MIDI passes through ValidationPipeline (scale, genre, transition validation)
- [x] **AI-07**: System retries generation if validation fails (up to 3 attempts)
- [x] **AI-08**: System falls back to template mode after 3 failed AI attempts
- [ ] **AI-09**: Conversation history visible during question flow
- [ ] **AI-10**: Total token usage and estimated cost displayed after generation

### Template Generation Enhancement

- [ ] **TMPL-01**: Each genre has 3-5 verse pattern variations
- [ ] **TMPL-02**: Each genre has 3-5 chorus pattern variations
- [ ] **TMPL-03**: Each genre has 8 drum fill variations
- [ ] **TMPL-04**: Pattern variations selected randomly per generation
- [ ] **TMPL-05**: Drum fills selected randomly at section boundaries
- [ ] **TMPL-06**: Generated MIDI maintains genre consistency across all pattern variations

### Velocity Editing

- [ ] **VEL-01**: Velocity lane renders below piano roll showing velocity stalks (vertical bars)
- [ ] **VEL-02**: User can click and drag velocity stalks to edit individual note velocities
- [ ] **VEL-03**: Velocity lane scrolls horizontally in sync with piano roll
- [ ] **VEL-04**: Selected note in piano roll highlights corresponding velocity stalk
- [ ] **VEL-05**: Velocity changes update in real-time during drag
- [ ] **VEL-06**: Multi-select velocity editing (adjust all selected notes simultaneously)

### Quantization

- [ ] **QUANT-01**: User can access quantization controls in piano roll toolbar
- [ ] **QUANT-02**: User can set quantization strength (0-100%, default 80%)
- [ ] **QUANT-03**: User can select quantization grid (1/4, 1/8, 1/16, 1/32 notes)
- [ ] **QUANT-04**: User can set "exclude within" threshold (notes already close to grid remain untouched)
- [ ] **QUANT-05**: User can set swing parameter (50-75%, shifts offbeat notes)
- [ ] **QUANT-06**: Quantization applies to selected notes (or all notes if none selected)
- [ ] **QUANT-07**: Quantization is undoable (single undo step)

### Chord Symbol Display

- [ ] **CHORD-01**: Piano roll displays chord symbols above note grid
- [ ] **CHORD-02**: Chord symbols detect from notes in each bar (minimum 3 notes required)
- [ ] **CHORD-03**: Chord symbols update dynamically as notes change
- [ ] **CHORD-04**: User can toggle chord symbol visibility on/off
- [ ] **CHORD-05**: Clicking chord symbol highlights corresponding notes in piano roll

### MIDI Hardware Support

- [ ] **MIDI-01**: System detects Web MIDI API availability (Chrome/Edge/Opera support)
- [ ] **MIDI-02**: System displays clear error if Web MIDI not supported (Firefox/Safari)
- [ ] **MIDI-03**: User can connect MIDI keyboard via "Connect MIDI" button
- [ ] **MIDI-04**: System lists connected MIDI input devices
- [ ] **MIDI-05**: User can play notes of currently selected track using MIDI keyboard (when paused)
- [ ] **MIDI-06**: Keyboard input respects velocity sensitivity
- [ ] **MIDI-07**: Sustain pedal (CC 64) works properly (notes sustain while pedal down, release when lifted)
- [ ] **MIDI-08**: User can arm track for recording via record button in transport controls
- [ ] **MIDI-09**: User can start recording during playback (captures MIDI input as notes)
- [ ] **MIDI-10**: Recording includes count-in (1 bar before playback starts)
- [ ] **MIDI-11**: Recorded notes align with beat grid (latency compensation applied)
- [ ] **MIDI-12**: User can undo last recording (remove recorded notes)
- [ ] **MIDI-13**: Recording indicator visible during active recording

---

## Future Requirements

Deferred to v1.2 or later milestones. Tracked but not in current roadmap.

### Project Persistence

- **PERSIST-01**: User can save projects for later sessions
- **PERSIST-02**: User can load previously saved projects
- **PERSIST-03**: Projects auto-save to browser storage

### User Accounts

- **AUTH-01**: User can create account
- **AUTH-02**: User can log in to access saved projects
- **AUTH-03**: User projects persist across devices

### Collaboration

- **COLLAB-01**: User can share project via link
- **COLLAB-02**: Multiple users can view same project
- **COLLAB-03**: Users can leave comments on projects

### Cloud Features

- **CLOUD-01**: Projects automatically save to cloud storage
- **CLOUD-02**: User can access version history
- **CLOUD-03**: Application works offline as PWA

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| SoundFont samples | 5-50MB file size, async loading complexity. Synthesis tuning sufficient for "good enough to compose" bar |
| Unlimited question flow (AI mode) | Token cost explosion risk. Hard limit 3 questions prevents infinite loops |
| Multi-track MIDI recording | Complexity high, use case limited. Single-track recording sufficient for v1.1 |
| MIDI learn for controls | Scope creep. Keyboard input + recording covers core use cases |
| Real-time collaboration (simultaneous editing) | High complexity, network latency issues. Defer to v2+ |
| Audio file export (WAV, MP3) | Desktop DAW strength. Focus on MIDI editing, export to professional tools |
| Notation view (sheet music) | High complexity. Piano roll sufficient for target users (producers, not composers) |
| Advanced DAW features (mixing, effects, mastering, automation) | Out of scope entirely. Haydn is MIDI editor, not full DAW |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 9 | Pending |
| UI-02 | Phase 9 | Pending |
| UI-03 | Phase 9 | Pending |
| UI-04 | Phase 9 | Pending |
| UI-05 | Phase 9 | Pending |
| UI-06 | Phase 9 | Pending |
| UI-07 | Phase 9 | Pending |
| UI-08 | Phase 9 | Pending |
| UI-09 | Phase 9 | Pending |
| AUDIO-01 | Phase 10 | Complete |
| AUDIO-02 | Phase 10 | Complete |
| AUDIO-03 | Phase 10 | Complete |
| AUDIO-04 | Phase 10 | Complete |
| AUDIO-05 | Phase 10 | Complete |
| AUDIO-06 | Phase 10 | Complete |
| AUDIO-07 | Phase 10 | Complete |
| AI-01 | Phase 11 | Pending |
| AI-02 | Phase 11 | Pending |
| AI-03 | Phase 11 | Pending |
| AI-04 | Phase 11 | Pending |
| AI-05 | Phase 11 | Complete |
| AI-06 | Phase 11 | Complete |
| AI-07 | Phase 11 | Complete |
| AI-08 | Phase 11 | Complete |
| AI-09 | Phase 11 | Pending |
| AI-10 | Phase 11 | Pending |
| TMPL-01 | Phase 12 | Pending |
| TMPL-02 | Phase 12 | Pending |
| TMPL-03 | Phase 12 | Pending |
| TMPL-04 | Phase 12 | Pending |
| TMPL-05 | Phase 12 | Pending |
| TMPL-06 | Phase 12 | Pending |
| VEL-01 | Phase 13 | Pending |
| VEL-02 | Phase 13 | Pending |
| VEL-03 | Phase 13 | Pending |
| VEL-04 | Phase 13 | Pending |
| VEL-05 | Phase 13 | Pending |
| VEL-06 | Phase 13 | Pending |
| QUANT-01 | Phase 13 | Pending |
| QUANT-02 | Phase 13 | Pending |
| QUANT-03 | Phase 13 | Pending |
| QUANT-04 | Phase 13 | Pending |
| QUANT-05 | Phase 13 | Pending |
| QUANT-06 | Phase 13 | Pending |
| QUANT-07 | Phase 13 | Pending |
| CHORD-01 | Phase 13 | Pending |
| CHORD-02 | Phase 13 | Pending |
| CHORD-03 | Phase 13 | Pending |
| CHORD-04 | Phase 13 | Pending |
| CHORD-05 | Phase 13 | Pending |
| MIDI-01 | Phase 14 | Pending |
| MIDI-02 | Phase 14 | Pending |
| MIDI-03 | Phase 14 | Pending |
| MIDI-04 | Phase 14 | Pending |
| MIDI-05 | Phase 14 | Pending |
| MIDI-06 | Phase 14 | Pending |
| MIDI-07 | Phase 14 | Pending |
| MIDI-08 | Phase 14 | Pending |
| MIDI-09 | Phase 14 | Pending |
| MIDI-10 | Phase 14 | Pending |
| MIDI-11 | Phase 14 | Pending |
| MIDI-12 | Phase 14 | Pending |
| MIDI-13 | Phase 14 | Pending |

**Coverage:**
- v1.1 requirements: 58 total
- Mapped to phases: 58/58 (100%)
- Unmapped: 0

---

*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after roadmap creation*
