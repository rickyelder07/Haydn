# Phase 10: Synthesis Enhancement - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Improve MIDI playback audio quality to "good enough to compose with" by implementing per-instrument ADSR envelopes, lowpass filtering, and string vibrato. Each instrument category sounds like itself rather than a generic tone. A temporary debug panel exposes tuning controls for subjective validation.

</domain>

<decisions>
## Implementation Decisions

### Instrument Categorization
- Default instrument (no GM program set) → piano envelope (percussive)
- Organs (GM 17-20) → sustained envelope (like strings, not piano)
- Harpsichord/clavinet (GM 7, 8, 21-24) → percussive envelope (plucked, like piano)
- Synth instruments (GM 81-104) → Claude decides mapping to closest acoustic analog
- Guitar/bass (GM 24-40) → Claude decides based on instrument physics (likely guitar = percussive, bass = somewhere between)
- Percussion (MIDI channel 9) → no envelope shaping, no filter, no vibrato

### Envelope Tuning Philosophy
- Piano ADSR values → Claude decides (target feel: clearly percussive, not sustained)
- Strings: slow swell attack (~200-400ms) — notes bloom gradually, cinematic feel
- Brass: punchy — Claude decides exact values within "medium attack, medium sustain" range
- Velocity affects BOTH amplitude AND attack time: harder hit (higher velocity) = faster attack, not just louder
- A debug panel exposes per-instrument ADSR values for tuning during development (not shipped to end users)

### Vibrato Character
- Delayed fade-in: vibrato appears gradually after ~150-200ms from note onset (not immediate)
- Only notes longer than ~300ms receive vibrato — short staccato string notes skip it
- Depth: expressive range ~8-10 cents
- Fixed depth regardless of note velocity (no velocity-to-depth mapping)
- Frequency: 4-5Hz as specified in requirements

### Filter Aggressiveness
- Default cutoff: ~3kHz (mid-range — noticeable warmth without muddiness)
- Per-instrument-category differentiation:
  - Piano: slightly higher cutoff (~3.5-4kHz, preserve brightness)
  - Strings: lower cutoff (~2.5kHz, warmer and rounder)
  - Brass: mid cutoff (~3kHz)
  - Organs/other sustained: ~3kHz
- Rolloff slope: -24dB/octave (4th order, moderate — decisive cut without harsh artifacts)
- Debug panel includes filter cutoff controls per category alongside envelope ADSR controls

### Claude's Discretion
- Exact piano ADSR values (user said "you decide")
- Synth instrument → acoustic analog mapping (pads/leads/effects)
- Guitar and bass envelope assignment within percussive/sustained spectrum
- Brass exact ADSR values within "punchy" character
- Exact vibrato fade-in curve shape (linear vs exponential ramp)

</decisions>

<specifics>
## Specific Ideas

- Debug panel needed for subjective tuning — AUDIO-07 success criteria is "user confirms it sounds better". This requires the user to hear it and iterate. Panel should let user adjust ADSR and filter cutoff per instrument category and hear changes in real-time during playback.
- The debug panel is a development tool only — not part of the final shipped UI.
- Vibrato model: fade-in delay of ~150-200ms + duration gate of ~300ms minimum. Notes that are shorter than 300ms simply don't get vibrato even if they're string instruments.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-synthesis-enhancement*
*Context gathered: 2026-02-23*
