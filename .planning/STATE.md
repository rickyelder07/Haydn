# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.
**Current focus:** Phase 4 - Music Theory Validation Layer

## Current Position

Phase: 4 of 8 (Music Theory Validation Layer)
Plan: 4 of 6 in current phase
Status: In progress
Last activity: 2026-01-31 — Completed 04-04-PLAN.md

Progress: [████████████████████░] 110% (22/20 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 22
- Average duration: 11.8 minutes
- Total execution time: 4.36 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-a-midi-infrastructure | 6 | 16.9 min | 2.8 min |
| 02-audio-playback-engine | 6 | 14.5 min | 2.4 min |
| 03-piano-roll-editor | 6 | 216.4 min | 36.1 min |
| 04-music-theory-validation-layer | 4 | 14.7 min | 3.7 min |

**Recent Trend:**
- Last 5 plans: 03-06 (72 min), 04-01 (1.7 min), 04-02 (6.0 min), 04-03 (4.0 min), 04-04 (3.0 min)
- Trend: Phase 4 maintaining fast execution with consistent sub-6 minute plans

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
- **Lazy store initialization** (02-03): Store subscription deferred to first action to avoid SSR issues
- **Inline SVG icons** (02-03): Simple SVG components instead of icon library for minimal bundle
- **Click-to-seek progress bar** (02-03): Click-to-jump interaction (drag scrubbing deferred to Phase 3)
- **Computed display values in store** (02-03): formatTime, ticksToBarsBeat computed on position updates, not in components
- **Keyboard shortcuts only when project loaded** (02-04): Prevents confusion when no project to control
- **Tone.Draw.schedule for UI updates** (02-04): Syncs UI updates with audio render loop via requestAnimationFrame
- **Track-level note count display** (02-04): Shows per-track activity without individual note detail in v1
- **Auto-load project into playback** (02-04): Immediate playback readiness after upload
- **MembraneSynth for metronome clicks** (02-05): Better click quality than simple oscillators
- **880Hz downbeat vs 440Hz regular beat** (02-05): Audible bar boundaries for timing reference
- **Separate synth for count-in** (02-05): Avoids conflicts with metronome lifecycle
- **Metronome lifecycle synced in store** (02-05): Starts with play if enabled, stops with pause/stop
- **-6dB metronome, -3dB count-in volume** (02-05): Audible but doesn't overpower music
- **Filter empty MIDI tracks** (02-06): Only show tracks with notes.length > 0 to avoid metadata/conductor tracks
- **Replace @tonejs/piano with PolySynth** (02-06): CDN reliability issues led to pure synthesis approach
- **Piano instrument sharing** (02-06): Programs 0-7 share one instance for fast loading
- **Percussion channel detection** (02-06): Channel 9 identifies drums, not program number
- **Minimum duration guard 0.05s** (02-06): Prevents zero-duration note errors in some MIDI files
- **Instrument detuning** (02-06): Strings vary -5 to -15 cents for distinctiveness within same family
- **Per-category envelopes** (02-06): Each GM family has characteristic ADSR (piano, drums, strings, brass, etc.)
- **structuredClone for immutability** (03-01): Use native structuredClone() instead of JSON.parse/stringify for history snapshots
- **100-entry history cap** (03-01): Cap undo/redo history at 100 entries to prevent memory bloat
- **Per-track history initialization** (03-01): Each track gets independent HistoryManager on selectTrack
- **Auto-sort notes by ticks** (03-01): All note mutations automatically re-sort by ticks for chronological order
- **Cross-store sync via getState()** (03-01): Edit store reads/writes projectStore via getState() pattern
- **Canvas-based rendering** (03-02): Use HTML5 Canvas API with requestAnimationFrame for performant piano roll
- **Note height 12px** (03-02): 12 pixels per semitone row for readable piano roll density
- **Adaptive grid zoom** (03-02): Grid shows bars/beats at low zoom, adds 16th/32nd subdivisions when zoomed in
- **Velocity-based coloring** (03-02): HSL with lightness 40-60% based on velocity, hue 210 (blue) normal, hue 40 (gold) selected
- **Minimum note width 3px** (03-02): Enforce minimum visual width so very short notes remain visible
- **Invisible interaction layer** (03-03): Transparent canvas over PianoRollCanvas captures mouse events for editing
- **Global drag listeners** (03-03): Window mousemove/mouseup during drag prevents loss of tracking outside canvas
- **Grid snap on mouseup** (03-03): Calculate snap position only when drag completes for responsive feedback
- **Dual delete methods** (03-03): Right-click OR Shift+Left-click for note deletion (flexibility for trackpad users)
- **ZoomControls step size 1.25x** (03-04): Smooth incremental zoom without jumpy visual changes
- **Note inspector right sidebar** (03-04): 192px fixed width keeps inspector always visible when note selected
- **Platform-aware keyboard shortcuts** (03-04): metaKey on Mac (Cmd), ctrlKey elsewhere for native feel
- **Modifier-based wheel zoom** (03-04): Ctrl for horizontal, Alt for vertical avoids conflicts with scroll
- **Responsive layout strategy** (03-05): max-w-7xl for piano roll/transport (wider canvas), max-w-4xl for metadata/tracks
- **Auto-select first track on load** (03-05): Finds first track with notes.length > 0 and auto-selects for immediate editing
- **Human verification checkpoint** (03-06): Manual testing confirmed all 6 phase success criteria pass for piano roll editor
- **Tonal.js main package** (04-01): Use main tonal package (not individual @tonaljs/* subpackages) for simpler dependency management
- **Discriminated union Result type** (04-01): Use { ok: true } | { ok: false; errors: [] } pattern instead of fp-ts or monads library
- **Chroma-based pitch comparison** (04-01): Use Note.chroma() for enharmonic-safe comparison (F# vs Gb both have chroma 6)
- **Permissive invalid scale handling** (04-01): Return true/empty for invalid scales to avoid blocking validation on missing/bad data
- **Vitest for testing** (04-02): Modern, fast, ESM-native test runner for validator test suite
- **Filter Scale.detect() to common scales** (04-02): Exclude exotic scales (locrian major, ichikosucho) to prevent false positives
- **Major/minor prioritization** (04-02): When major or minor detected, validate against those over modes
- **3-note minimum for transition detection** (04-02): Scale.detect() unreliable with fewer notes
- **Error vs warning severity** (04-02): ScaleValidator returns error, TransitionValidator returns warning
- **Genre rules as data objects** (04-03): Plain data conforming to GenreRules interface for easy extension
- **Validation blocks on errors, allows on warnings** (04-03): Errors prevent edits, warnings stored for display
- **Undo/redo bypass validation** (04-03): Restore known-good states without re-validation
- **Velocity-only updates skip validation** (04-03): Only midi/ticks changes trigger validation
- **Scale highlight colors** (04-04): In-scale rows faint blue (rgba(59,130,246,0.06)), out-of-scale faint red (rgba(239,68,68,0.04))
- **Validation feedback placement** (04-04): Between toolbar and canvas for immediate visibility
- **Warning auto-dismiss timing** (04-04): 4-second timeout for warnings, manual dismiss only for errors
- **Theory controls location** (04-04): Inline with toolbar after zoom controls
- **Scale info update triggers** (04-04): Update on project/track/playhead changes

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-31
Stopped at: Completed 04-04-PLAN.md
Resume file: None

**Phase 3 Status:** Complete - All 6 plans finished. Piano roll editor verified working with all success criteria met.

**Phase 4 Status:** In progress - 4 of 6 plans complete. Validation pipeline complete and functional (04-01 through 04-03). Visual feedback and theory controls implemented (04-04). Piano roll now highlights in-scale/out-of-scale rows, displays validation errors/warnings, and provides theory controls. Ready for editStore integration to block invalid edits (04-05).
