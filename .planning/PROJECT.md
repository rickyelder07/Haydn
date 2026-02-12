# Haydn

## What This Is

A web application that enables music producers and artists to create and edit MIDI files using natural language powered by GPT-4o. Users can generate MIDI from text prompts, upload existing MIDI/MusicXML files, edit notes visually in a piano roll editor or through natural language (single-shot or conversational modes), preview changes with in-browser audio playback, and export to standard MIDI format for use in major DAWs like Logic Pro X and Ableton. All edits are validated against music theory rules to ensure musical coherence.

## Core Value

Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track. Quality over algorithmic randomness.

## Requirements

### Validated

- ✓ User can generate MIDI from text prompts — v1.0
- ✓ User can upload MIDI files (.mid/.midi) — v1.0
- ✓ User can upload MusicXML files — v1.0
- ✓ User can edit MIDI using natural language in conversational mode — v1.0
- ✓ User can edit MIDI using natural language in single-shot mode — v1.0
- ✓ User can make structural changes via natural language — v1.0
- ✓ User can make note-level edits via natural language — v1.0
- ✓ User can swap instruments or add/remove tracks via natural language — v1.0
- ✓ User can adjust timing via natural language — v1.0
- ✓ User can preview MIDI with in-app audio playback — v1.0
- ✓ User can export to standard MIDI format — v1.0
- ✓ User can manually edit notes in piano roll (add, delete, move) — v1.0
- ✓ User can undo/redo manual edits — v1.0
- ✓ User can work with multiple tracks (up to 32) — v1.0
- ✓ User can mute/solo individual tracks — v1.0
- ✓ System uses MIDI manipulation libraries to minimize token usage — v1.0
- ✓ GPT-4o outputs structured edit instructions (not raw MIDI) — v1.0
- ✓ Edits respect music theory (scales, chord progressions, harmonic coherence) — v1.0
- ✓ Edits respect genre conventions — v1.0
- ✓ Edits preserve context with existing track — v1.0

### Active

(None — define requirements for v1.1)

### Out of Scope

- User accounts and authentication — v1 is single-session, anonymous usage
- Project persistence across sessions — v1 is ephemeral, export to save
- Project management (save/load multiple projects) — deferred to v2
- Collaboration features (sharing, commenting, multi-user editing) — not core to v1
- Audio file import (MP3, WAV, stems) — MIDI-only for v1
- Advanced DAW features (mixing, effects, mastering, automation) — out of scope entirely
- Multiple export formats — standard MIDI sufficient for v1, DAW-specific formats deferred
- Humanization features (velocity variation, timing imperfections) — not explicitly mentioned, may emerge naturally
- Mobile apps — web-first strategy
- Real-time collaboration — not needed for single-session usage

## Context

**Current State (v1.0 shipped):**
- 12,230 lines of TypeScript across 221 files
- Full-stack Next.js application with React frontend
- Tech stack: Next.js 15, Tone.js 15.1.22, Tonal.js 6.0, @tonejs/midi, OpenAI SDK, Zustand
- 8 phases completed over 19 days (2026-01-23 → 2026-02-11)
- All v1 requirements validated and shipped

**Problem being solved:**
Producers currently use trial-and-error when editing MIDI in DAWs - drawing notes, adjusting velocities, trying patterns until something sounds good. This is time-consuming and breaks creative flow.

**Target users:**
Music producers and artists working with MIDI in DAWs like Logic Pro X, Ableton, FL Studio. Public product accessible to anyone.

**Technical environment:**
- Web application (Next.js, browser-based, cross-platform)
- GPT-4o for natural language understanding with structured outputs (Zod schemas)
- @tonejs/midi for MIDI parsing/export, Tone.js for audio synthesis
- Tonal.js for music theory validation (scale detection, pitch manipulation)
- Standard MIDI file format (.mid) as export target
- MusicXML as additional import format
- In-app MIDI playback with PolySynth synthesis (basic but functional)

**Quality requirements:**
Edits demonstrate musical intelligence:
- Follow music theory (correct scales, functional harmony) - validated via ScaleValidator, TransitionValidator, GenreValidator
- Respect genre conventions (stylistically appropriate patterns) - genre-specific rules for classical, jazz, trap, pop
- Maintain track context (coherent transitions, consistent style) - transition validation warns on jarring changes

**Token efficiency:**
Minimized LLM token usage via:
- Structured edit operations (6 types: add, remove, modify, transpose, change_tempo, change_key, change_instrument)
- GPT-4o outputs JSON schemas, not raw MIDI bytes
- Compact MIDI JSON context (selected track data only)
- Token counting with js-tiktoken for cost transparency

## Constraints

- Single-session usage (no persistence) — v1.0 strategy to validate core value before adding user accounts
- Browser performance limits — 32 track limit, 5,000 note capacity tested
- Web Audio API limitations — synthesis only, no VST plugins

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app (not desktop/mobile) | Browser-based = cross-platform, easier updates, no installation friction | ✓ Good — Next.js app runs in all browsers, no installation needed |
| Single-session for v1 | Simplifies architecture, faster to ship, validates core value before adding persistence | ✓ Good — Shipped in 19 days without auth/database complexity |
| GPT-4o with Structured Outputs | Zod schema validation ensures reliable operation parsing | ✓ Good — 7 operation types (add, remove, modify, transpose, change_tempo, change_key, change_instrument) work reliably |
| @tonejs/midi + Tone.js | @tonejs/midi for parsing/export, Tone.js for synthesis | ✓ Good — Solid MIDI I/O, synthesis acceptable for preview (not production audio) |
| Tonal.js for music theory | Scale detection, pitch manipulation, enharmonic handling | ✓ Good — Scale validation works well, filtered exotic scales to avoid false positives |
| Both conversational and single-shot modes | Flexibility for different use cases (iterative refinement vs quick edits) | ✓ Good — Mode toggle lets users choose, single-shot default with conversation opt-in |
| Canvas-based piano roll | HTML5 Canvas for performant rendering with many notes | ✓ Good — Smooth rendering, adaptive grid zoom, velocity-based coloring |
| Zustand for state management | Lightweight alternative to Redux, no boilerplate | ✓ Good — Clean separation (projectStore, editStore, playbackStore, conversationStore, trackUIStore, nlEditStore, nlGenerationStore, validationStore) |
| Validation pipeline architecture | ScaleValidator (error) + TransitionValidator (warning) + GenreValidator (error) | ✓ Good — Blocks invalid edits, warns on context issues, genre rules prevent inappropriate intervals |
| PolySynth over @tonejs/piano | CDN reliability issues led to pure synthesis | ⚠️ Revisit — Audio quality acceptable but not great, consider SoundFont for v2 |

---
*Last updated: 2026-02-12 after v1.0 milestone completion*
