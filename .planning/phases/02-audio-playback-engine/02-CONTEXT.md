# Phase 2: Audio Playback Engine - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time MIDI audio playback with transport controls (play/pause), tempo adjustment, and precise timing synchronization. Users can hear their MIDI projects played back through web audio synthesis. Manual note editing and advanced looping belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### Synthesis approach
- **Hybrid model**: Piano uses high-quality samples, all other instruments start with Web Audio synthesis
- **On-demand sample downloads**: When a track uses a non-piano instrument, prompt user to download high-quality samples for that instrument
- **Auto-download workflow**: Seamless prompt when needed, downloads only what's used
- **Sample storage**: Claude's discretion on IndexedDB vs session-only storage based on technical constraints

### Transport controls
- **Play/Pause toggle**: Single button that toggles between play and pause states (no separate Stop button)
- **Keyboard shortcuts**: Full DAW-style shortcuts (Spacebar for play/pause, Enter for stop, L for loop, Home for jump to start)
- **Loop functionality**: Deferred to later phase - Phase 2 focuses on basic play/pause/stop only
- **Playhead scrubbing**: Click-to-jump on timeline/progress bar (not drag scrubbing)
- **End-of-track behavior**: Stop and automatically reset playhead to start (0:00)
- **Tempo adjustment during playback**: Claude's discretion on live adjustment vs stop-required based on Web Audio API capabilities
- **Tempo range**: Wide range (40-240 BPM) to support experimental use cases

### Visual feedback
- **Playhead visualization**: Claude's discretion on line vs progress bar vs both
- **Note-level highlighting**: Show which notes are currently playing during playback
- **Note highlighting location**: Claude's discretion on track card integration vs separate mini piano roll
- **Time display**: Both minutes:seconds (0:23) AND bars:beats (5.2.1) formats - toggle or side-by-side

### Timing behavior
- **Metronome**: Optional metronome click track with toggle control
- **Tempo automation**: Honor MIDI tempo events (ritardando, accelerando) from source files
- **Count-in**: Configurable count-in (1-4 bars) before playback starts
- **Swing/groove**: Per-track swing control (not global) for mixed genre flexibility
- **Timing drift prevention**: Claude's discretion on Web Audio clock sync vs tick-based scheduling
- **Note scheduling**: Claude's discretion on pre-buffer vs real-time lookahead scheduling
- **Background playback**: Continue playing when browser tab loses focus
- **Velocity handling**: Honor MIDI velocity (0-127) to preserve dynamics from original file

### Claude's Discretion
- Sample storage mechanism (IndexedDB vs session-only)
- Live tempo adjustment implementation approach
- Playhead visualization style (line, progress bar, or both)
- Note highlighting UI location and design
- Timing architecture (Web Audio clock sync vs tick-based)
- Note scheduling strategy (pre-buffer vs lookahead)

</decisions>

<specifics>
## Specific Ideas

- Keyboard shortcuts should match Logic/Ableton conventions (familiar to DAW users)
- Sample download prompts should be seamless and non-disruptive
- Time display flexibility (both clock time and musical time) helps different user workflows
- Per-track swing control enables better mixed-genre support (swing drums, straight melody)

</specifics>

<deferred>
## Deferred Ideas

- Loop functionality (simple full-track loop or loop regions) - Future phase
- Drag scrubbing with audio preview - Phase 3 (Piano Roll Editor)
- Advanced groove templates or quantization - Future rhythm editing phase

</deferred>

---

*Phase: 02-audio-playback-engine*
*Context gathered: 2026-01-24*
