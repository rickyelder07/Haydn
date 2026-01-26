# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.
**Current focus:** Phase 2 - Audio Playback Engine

## Current Position

Phase: 2 of 8 (Audio Playback Engine)
Plan: 2 of 6 in current phase
Status: In progress
Last activity: 2026-01-26 — Completed 02-02-PLAN.md (Playback Logic Core)

Progress: [████████░░] 67% (8/12 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 2.6 minutes
- Total execution time: 0.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-a-midi-infrastructure | 6 | 16.9 min | 2.8 min |
| 02-audio-playback-engine | 2 | 4.4 min | 2.2 min |

**Recent Trend:**
- Last 5 plans: 01-04 (2.1 min), 01-05 (2.8 min), 01-06 (3.8 min), 02-01 (2.0 min), 02-02 (2.4 min)
- Trend: Consistently fast execution (2-4 min range)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Web app strategy for cross-platform access
- Single-session architecture for v1 to validate core value before persistence
- GPT-4o for natural language processing
- Library-based MIDI manipulation to reduce token costs
- Both conversational and single-shot modes for flexibility
- **Tick-based time representation** (01-01): Use MIDI ticks as primary time unit, convert to seconds only for display
- **General MIDI standard mapping** (01-01): Use 128-instrument GM mapping for consistent naming
- **Zustand for state management** (01-01): Lightweight state management with computed display info pattern
- **MIDI header byte validation** (01-02): Validate 'MThd' magic bytes before parsing for clear error messages
- **10MB MIDI file size limit** (01-02): Prevent browser memory issues with large files
- **Auto-generated track names** (01-02): Generate "{instrumentName} Track" when source MIDI has no track names
- **Uncompressed MusicXML only (v1)** (01-03): Support .musicxml/.xml files only, not compressed .mxl
- **PPQ=480 for MusicXML conversion** (01-03): Use standard MIDI resolution for divisions-to-ticks conversion
- **Default velocity 0.8 for MusicXML notes** (01-03): MusicXML dynamics conversion deferred to future versions
- **Blob type casting for download** (01-04): Use `data as BlobPart` cast for TypeScript strict mode compatibility
- **Card-based track layout** (01-05): Use card-based design for track list instead of simple list for better visual separation
- **Metadata default expanded** (01-05): MetadataDisplay defaults to expanded state for immediate project info visibility
- **Smart filename handling for export** (01-05): Strip original extension and add .mid to prevent awkward filenames like "song.musicxml.mid"
- **Error display dismissible** (01-06): Error messages have manual dismiss button instead of auto-dismiss for user control
- **Simple empty state** (01-06): Text-based upload prompt for new users without elaborate onboarding
- **Tone.js version** (02-01): Use 15.1.22 despite @tonejs/piano peer dependency on ^14.6.1 - backward compatible API
- **Piano velocity levels** (02-01): 5 levels for smaller download vs 16 max - sufficient quality for v1
- **Waveform mapping** (02-01): Triangle for piano/guitar/bass/brass, sine for percussion, sawtooth for organ/strings, square for synth
- **Tone.Part for scheduling** (02-02): Uses Tone.js Part API for efficient note scheduling with built-in lookahead
- **20fps position tracking** (02-02): Updates position every 50ms for smooth UI without excessive overhead
- **Tempo lookahead 0.1s** (02-02): Schedules tempo changes 100ms ahead for smooth transitions
- **Instrument reuse** (02-02): Keeps instruments loaded in Map for faster play/pause cycles
- **40-240 BPM range** (02-02): Wide tempo range for experimental use cases

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-26
Stopped at: Completed 02-02-PLAN.md (Playback Logic Core)
Resume file: None

**Phase 2 Status:** In progress - 2 of 6 plans complete. Playback logic ready for Transport UI integration.
