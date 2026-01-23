# Haydn

## What This Is

A web application that enables music producers and artists to create and edit MIDI files using natural language powered by GPT-4o. Users can generate MIDI from scratch or upload existing files, make edits through conversational prompts, preview changes with in-app playback, and export to standard MIDI format for use in major DAWs like Logic Pro X and Ableton.

## Core Value

Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track. Quality over algorithmic randomness.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can start a new MIDI project via text prompt (generate from scratch)
- [ ] User can start a new MIDI project by uploading a MIDI file (.mid/.midi)
- [ ] User can start a new MIDI project by uploading a MusicXML file
- [ ] User can edit MIDI using natural language in conversational mode (iterative refinement with context)
- [ ] User can edit MIDI using natural language in single-shot mode (independent prompts)
- [ ] User can make structural changes via natural language (add/remove sections, change length)
- [ ] User can make note-level edits via natural language (melody changes, harmony, key changes)
- [ ] User can swap instruments or add/remove tracks via natural language
- [ ] User can adjust timing via natural language (tempo, swing, quantization)
- [ ] User can preview MIDI with basic in-app playback (low-quality synthesis)
- [ ] User can export current MIDI state to standard MIDI format
- [ ] System uses MIDI manipulation libraries to minimize LLM token usage per prompt
- [ ] GPT-4o processes natural language and outputs structured edit instructions (not raw MIDI bytes)
- [ ] Edits respect music theory (scales, chord progressions, harmonic coherence)
- [ ] Edits respect genre conventions (trap drums sound like trap, not jazz)
- [ ] Edits preserve context with existing track (smooth transitions, no jarring changes)

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

**Problem being solved:**
Producers currently use trial-and-error when editing MIDI in DAWs - drawing notes, adjusting velocities, trying patterns until something sounds good. This is time-consuming and breaks creative flow.

**Target users:**
Music producers and artists working with MIDI in DAWs like Logic Pro X, Ableton, FL Studio. Public product accessible to anyone.

**Technical environment:**
- Web application (browser-based, cross-platform)
- GPT-4o for natural language understanding
- MIDI manipulation libraries to reduce token usage (research needed)
- Standard MIDI file format (.mid) as export target
- MusicXML as additional import format
- In-app MIDI playback with basic synthesis

**Quality requirements:**
Edits must demonstrate musical intelligence:
- Follow music theory (correct scales, functional harmony)
- Respect genre conventions (stylistically appropriate patterns)
- Maintain track context (coherent transitions, consistent style)

**Token efficiency:**
Minimize LLM token usage per prompt by using libraries to handle MIDI manipulation. GPT should output structured instructions, not generate MIDI data directly.

## Constraints

(None specified — use optimal stack for MIDI web applications)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app (not desktop/mobile) | Browser-based = cross-platform, easier updates, no installation friction | — Pending |
| Single-session for v1 | Simplifies architecture, faster to ship, validates core value before adding persistence | — Pending |
| GPT-4o specifically | Mentioned as model choice for natural language processing | — Pending |
| Library-based MIDI manipulation | Reduces token usage, improves cost efficiency, separates concerns | — Pending |
| Both conversational and single-shot modes | Flexibility for different use cases (iterative refinement vs quick edits) | — Pending |

---
*Last updated: 2026-01-23 after initialization*
