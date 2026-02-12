# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.
**Current focus:** v1.1 Polish & Enhancement — Defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-12 — Milestone v1.1 started

## Performance Metrics

**Velocity:**
- Total plans completed: 42
- Average duration: 8.5 minutes
- Total execution time: 5.98 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-a-midi-infrastructure | 6 | 16.9 min | 2.8 min |
| 02-audio-playback-engine | 6 | 14.5 min | 2.4 min |
| 03-piano-roll-editor | 6 | 216.4 min | 36.1 min |
| 04-music-theory-validation-layer | 5 | 16.7 min | 3.3 min |
| 05-natural-language-editing-single-shot | 4 | 7.2 min | 1.8 min |
| 06-natural-language-generation | 4 | 13.8 min | 3.5 min |
| 07-multi-track-support | 6 | 37.1 min | 6.2 min |
| 08-conversational-editing-mode | 5 | 22.0 min | 4.4 min |

**Recent Trend:**
- Last 5 plans: 07-06 (18 min checkpoint with bug fixes), 08-01 (1.3 min), 08-02 (11.7 min), 08-03 (3.6 min), 08-04 (2.9 min)
- Trend: Phase 8 conversational UI integration with mode switching

*Updated after each plan completion*
| Phase 08 P02 | 702 | 2 tasks | 2 files |
| Phase 08 P03 | 216 | 3 tasks | 5 files |
| Phase 08 P04 | 171 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

All decisions from v1.0 are documented in PROJECT.md Key Decisions table with outcomes.

Key architectural decisions validated:
- Web app with Next.js (✓ Good — no installation friction)
- Single-session strategy (✓ Good — shipped in 19 days)
- GPT-4o with Structured Outputs (✓ Good — reliable operation parsing)
- @tonejs/midi + Tone.js (✓ Good — solid I/O, synthesis acceptable)
- Canvas-based piano roll (✓ Good — smooth rendering)
- Validation pipeline (✓ Good — blocks invalid edits, warns on context issues)

For complete decision log with 200+ implementation decisions, see PROJECT.md and phase SUMMARY files in .planning/phases/
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
- **Flat parameters object for Structured Outputs** (05-01): Use single Zod object with all fields optional instead of discriminated unions
- **Custom exponential backoff with jitter** (05-01): 3 attempts max, exponential backoff with ±30% jitter, retry on 429/5xx only
- **500-char prompt limit** (05-01): Prevents abuse and excessive costs for single-shot editing commands
- **js-tiktoken for cost estimation** (05-01): Accurate token counting using GPT-4o tokenizer before API calls
- **Theory validation context in prompts** (05-01): System prompt includes scale/genre validation state when enabled
- **Context builder error handling** (05-02): Throw errors for missing project/track rather than silent defaults
- **Partial execution on errors** (05-02): Edit executor continues after failures rather than all-or-nothing
- **Reverse-order deletion** (05-02): Sort indices descending before deletion to avoid index shifting
- **Token cost calculation in store** (05-02): Calculate estimated cost (Decisions are logged in PROJECT.md Key Decisions table.
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
- **Flat parameters object for Structured Outputs** (05-01): Use single Zod object with all fields optional instead of discriminated unions
- **Custom exponential backoff with jitter** (05-01): 3 attempts max, exponential backoff with ±30% jitter, retry on 429/5xx only
- **500-char prompt limit** (05-01): Prevents abuse and excessive costs for single-shot editing commands
- **js-tiktoken for cost estimation** (05-01): Accurate token counting using GPT-4o tokenizer before API calls
- **Theory validation context in prompts** (05-01): System prompt includes scale/genre validation state when enabled
- **Context builder error handling** (05-02): Throw errors for missing project/track rather than silent defaults
- **Partial execution on errors** (05-02): Edit executor continues after failures rather than all-or-nothing
- **Reverse-order deletion** (05-02): Sort indices descending before deletion to avoid index shifting
- **Token cost calculation in store** (05-02): Calculate estimated cost (Decisions are logged in PROJECT.md Key Decisions table.
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
- **Flat parameters object for Structured Outputs** (05-01): Use single Zod object with all fields optional instead of discriminated unions
- **Custom exponential backoff with jitter** (05-01): 3 attempts max, exponential backoff with ±30% jitter, retry on 429/5xx only
- **500-char prompt limit** (05-01): Prevents abuse and excessive costs for single-shot editing commands
- **js-tiktoken for cost estimation** (05-01): Accurate token counting using GPT-4o tokenizer before API calls
- **Theory validation context in prompts** (05-01): System prompt includes scale/genre validation state when enabled
- **Context builder error handling** (05-02): Throw errors for missing project/track rather than silent defaults
- **Partial execution on errors** (05-02): Edit executor continues after failures rather than all-or-nothing
- **Reverse-order deletion** (05-02): Sort indices descending before deletion to avoid index shifting
- **Token cost calculation in store** (05-02): Calculate estimated cost (Decisions are logged in PROJECT.md Key Decisions table.
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
- **Flat parameters object for Structured Outputs** (05-01): Use single Zod object with all fields optional instead of discriminated unions
- **Custom exponential backoff with jitter** (05-01): 3 attempts max, exponential backoff with ±30% jitter, retry on 429/5xx only
- **500-char prompt limit** (05-01): Prevents abuse and excessive costs for single-shot editing commands
- **js-tiktoken for cost estimation** (05-01): Accurate token counting using GPT-4o tokenizer before API calls
- **Theory validation context in prompts** (05-01): System prompt includes scale/genre validation state when enabled
- **Context builder error handling** (05-02): Throw errors for missing project/track rather than silent defaults
- **Partial execution on errors** (05-02): Edit executor continues after failures rather than all-or-nothing
- **Reverse-order deletion** (05-02): Sort indices descending before deletion to avoid index shifting
- **Token cost calculation in store** (05-02): Calculate estimated cost ($2.50/M input, $10/M output) for immediate user feedback
- **Inline feedback over modals** (05-03): Display success/error states inline below input instead of separate modals or toasts
- **Clear input on success only** (05-03): After successful submission, clear input field; preserve text on error for retry
- **CommandInput conditional rendering** (05-03): Show only when project loaded AND track selected
- **Toaster bottom-right position** (05-03): Position toast notifications in bottom-right corner for future theory warnings
- **All GenerationParams fields required** (06-01): GPT-4o must fill in genre-appropriate defaults for unspecified values
- **Genre defaults table in system prompt** (06-01): Each genre has default tempo, scale, keys, emotion, instruments
- **Default song structure** (06-01): intro(4), verse(8), chorus(8), verse(8), chorus(8), outro(4)
- **Emotion as coordinates** (06-01): Valence (happy/sad) and arousal (energetic/calm) guide expressive generation
- **GM instrument numbers per role** (06-01): Instrumentation defined by role (drums, bass, melody, chords) and GM number
- **Tonal.js Note.transpose for intervals** (06-02): transpose method is on Note module, not Interval module
- **5 section types in genre templates** (06-02): verse, chorus, bridge, intro, outro with fallback to verse
- **Walking bass chromatic approach** (06-02): Last beat of final bar uses semitone below next chord root
- **Chord-tone preference on strong beats** (06-02): 70% probability on beats 1 and 3 vs 50% on weak beats
- **Arousal modifies density** (06-02): High arousal adds kick hits, low arousal reduces hats to quarter notes
- **Classical genre no drums** (06-02): Empty drum arrays in template, generateDrumTrack returns empty array
- **MIDI assembler as pure function** (06-03): assembleProject coordinates all generators with single GenerationParams input
- **Store orchestrates pipeline** (06-03): nlGenerationStore handles API -> assembly -> projectStore.setProject
- **Token cost displayed inline** (06-03): Shows total tokens and estimated cost for API usage transparency
- **Empty state prioritizes generation** (06-03): Generation section first, divider, then upload option below
- **Green styling for generation** (06-03): Green UI distinguishes generation from blue editing workflows
- **Standard PPQ=480 for generated projects** (06-03): All generated projects use fixed 480 PPQ
- **Set-based mute/solo state** (07-01): Use Set<number> for O(1) toggle operations and sparse data handling
- **Non-exclusive solo** (07-01): Multiple tracks can be soloed; solo overrides mute
- **Ephemeral UI state pattern** (07-01): trackUIStore separate from projectStore, resets on project load
- **12-color cycling palette** (07-01): TRACK_COLORS array provides visual distinction for unlimited tracks
- **dnd-kit for drag-and-drop** (07-01): Modern, accessible replacement for deprecated react-beautiful-dnd
- **Tone.Part.mute for real-time control** (07-02): Use Part.mute property to stop callbacks without rescheduling notes
- **Dynamic import for circular dependency** (07-02): trackUIStore uses dynamic import to call NoteScheduler functions
- **Callback pattern for audibility** (07-02): updateTrackMuteStates accepts isAudible callback for state sync
- **Inline toolbar integration** (07-05): Ghost notes toggle added directly to PianoRollEditor toolbar instead of separate Toolbar.tsx component
- **6-dot grip drag handle** (07-03): Clear visual affordance for dragging, common pattern users recognize
- **Left accent bar for selection** (07-03): border-l-4 provides strong indicator without intrusive space usage
- **stopPropagation on control buttons** (07-03): Prevents accidental track selection when clicking mute/solo
- **syncMuteStates after reschedule** (07-06): PlaybackController reapplies trackUIStore states after stop() to preserve mute/solo
- **SSR guard for dynamic imports** (07-06): Browser-only check prevents Next.js build errors with dynamic imports
- **Hidden tracks for visual clarity** (07-06): User-requested feature to hide specific tracks from ghost view in large projects
.50/M input, ### Decisions

0/M output) for immediate user feedback
- **Inline feedback over modals** (05-03): Display success/error states inline below input instead of separate modals or toasts
- **Clear input on success only** (05-03): After successful submission, clear input field; preserve text on error for retry
- **CommandInput conditional rendering** (05-03): Show only when project loaded AND track selected
- **Toaster bottom-right position** (05-03): Position toast notifications in bottom-right corner for future theory warnings
- **All GenerationParams fields required** (06-01): GPT-4o must fill in genre-appropriate defaults for unspecified values
- **Genre defaults table in system prompt** (06-01): Each genre has default tempo, scale, keys, emotion, instruments
- **Default song structure** (06-01): intro(4), verse(8), chorus(8), verse(8), chorus(8), outro(4)
- **Emotion as coordinates** (06-01): Valence (happy/sad) and arousal (energetic/calm) guide expressive generation
- **GM instrument numbers per role** (06-01): Instrumentation defined by role (drums, bass, melody, chords) and GM number
- **Tonal.js Note.transpose for intervals** (06-02): transpose method is on Note module, not Interval module
- **5 section types in genre templates** (06-02): verse, chorus, bridge, intro, outro with fallback to verse
- **Walking bass chromatic approach** (06-02): Last beat of final bar uses semitone below next chord root
- **Chord-tone preference on strong beats** (06-02): 70% probability on beats 1 and 3 vs 50% on weak beats
- **Arousal modifies density** (06-02): High arousal adds kick hits, low arousal reduces hats to quarter notes
- **Classical genre no drums** (06-02): Empty drum arrays in template, generateDrumTrack returns empty array
- **MIDI assembler as pure function** (06-03): assembleProject coordinates all generators with single GenerationParams input
- **Store orchestrates pipeline** (06-03): nlGenerationStore handles API -> assembly -> projectStore.setProject
- **Token cost displayed inline** (06-03): Shows total tokens and estimated cost for API usage transparency
- **Empty state prioritizes generation** (06-03): Generation section first, divider, then upload option below
- **Green styling for generation** (06-03): Green UI distinguishes generation from blue editing workflows
- **Standard PPQ=480 for generated projects** (06-03): All generated projects use fixed 480 PPQ
- **Set-based mute/solo state** (07-01): Use Set<number> for O(1) toggle operations and sparse data handling
- **Non-exclusive solo** (07-01): Multiple tracks can be soloed; solo overrides mute
- **Ephemeral UI state pattern** (07-01): trackUIStore separate from projectStore, resets on project load
- **12-color cycling palette** (07-01): TRACK_COLORS array provides visual distinction for unlimited tracks
- **dnd-kit for drag-and-drop** (07-01): Modern, accessible replacement for deprecated react-beautiful-dnd
- **Tone.Part.mute for real-time control** (07-02): Use Part.mute property to stop callbacks without rescheduling notes
- **Dynamic import for circular dependency** (07-02): trackUIStore uses dynamic import to call NoteScheduler functions
- **Callback pattern for audibility** (07-02): updateTrackMuteStates accepts isAudible callback for state sync
- **Inline toolbar integration** (07-05): Ghost notes toggle added directly to PianoRollEditor toolbar instead of separate Toolbar.tsx component
- **6-dot grip drag handle** (07-03): Clear visual affordance for dragging, common pattern users recognize
- **Left accent bar for selection** (07-03): border-l-4 provides strong indicator without intrusive space usage
- **stopPropagation on control buttons** (07-03): Prevents accidental track selection when clicking mute/solo
- **syncMuteStates after reschedule** (07-06): PlaybackController reapplies trackUIStore states after stop() to preserve mute/solo
- **SSR guard for dynamic imports** (07-06): Browser-only check prevents Next.js build errors with dynamic imports
- **Hidden tracks for visual clarity** (07-06): User-requested feature to hide specific tracks from ghost view in large projects
- [Phase 08]: Session-only state without persist middleware (research recommendation)
.50/M input, ### Decisions

0/M output) for immediate user feedback
- **Inline feedback over modals** (05-03): Display success/error states inline below input instead of separate modals or toasts
- **Clear input on success only** (05-03): After successful submission, clear input field; preserve text on error for retry
- **CommandInput conditional rendering** (05-03): Show only when project loaded AND track selected
- **Toaster bottom-right position** (05-03): Position toast notifications in bottom-right corner for future theory warnings
- **All GenerationParams fields required** (06-01): GPT-4o must fill in genre-appropriate defaults for unspecified values
- **Genre defaults table in system prompt** (06-01): Each genre has default tempo, scale, keys, emotion, instruments
- **Default song structure** (06-01): intro(4), verse(8), chorus(8), verse(8), chorus(8), outro(4)
- **Emotion as coordinates** (06-01): Valence (happy/sad) and arousal (energetic/calm) guide expressive generation
- **GM instrument numbers per role** (06-01): Instrumentation defined by role (drums, bass, melody, chords) and GM number
- **Tonal.js Note.transpose for intervals** (06-02): transpose method is on Note module, not Interval module
- **5 section types in genre templates** (06-02): verse, chorus, bridge, intro, outro with fallback to verse
- **Walking bass chromatic approach** (06-02): Last beat of final bar uses semitone below next chord root
- **Chord-tone preference on strong beats** (06-02): 70% probability on beats 1 and 3 vs 50% on weak beats
- **Arousal modifies density** (06-02): High arousal adds kick hits, low arousal reduces hats to quarter notes
- **Classical genre no drums** (06-02): Empty drum arrays in template, generateDrumTrack returns empty array
- **MIDI assembler as pure function** (06-03): assembleProject coordinates all generators with single GenerationParams input
- **Store orchestrates pipeline** (06-03): nlGenerationStore handles API -> assembly -> projectStore.setProject
- **Token cost displayed inline** (06-03): Shows total tokens and estimated cost for API usage transparency
- **Empty state prioritizes generation** (06-03): Generation section first, divider, then upload option below
- **Green styling for generation** (06-03): Green UI distinguishes generation from blue editing workflows
- **Standard PPQ=480 for generated projects** (06-03): All generated projects use fixed 480 PPQ
- **Set-based mute/solo state** (07-01): Use Set<number> for O(1) toggle operations and sparse data handling
- **Non-exclusive solo** (07-01): Multiple tracks can be soloed; solo overrides mute
- **Ephemeral UI state pattern** (07-01): trackUIStore separate from projectStore, resets on project load
- **12-color cycling palette** (07-01): TRACK_COLORS array provides visual distinction for unlimited tracks
- **dnd-kit for drag-and-drop** (07-01): Modern, accessible replacement for deprecated react-beautiful-dnd
- **Tone.Part.mute for real-time control** (07-02): Use Part.mute property to stop callbacks without rescheduling notes
- **Dynamic import for circular dependency** (07-02): trackUIStore uses dynamic import to call NoteScheduler functions
- **Callback pattern for audibility** (07-02): updateTrackMuteStates accepts isAudible callback for state sync
- **Inline toolbar integration** (07-05): Ghost notes toggle added directly to PianoRollEditor toolbar instead of separate Toolbar.tsx component
- **6-dot grip drag handle** (07-03): Clear visual affordance for dragging, common pattern users recognize
- **Left accent bar for selection** (07-03): border-l-4 provides strong indicator without intrusive space usage
- **stopPropagation on control buttons** (07-03): Prevents accidental track selection when clicking mute/solo
- **syncMuteStates after reschedule** (07-06): PlaybackController reapplies trackUIStore states after stop() to preserve mute/solo
- **SSR guard for dynamic imports** (07-06): Browser-only check prevents Next.js build errors with dynamic imports
- **Hidden tracks for visual clarity** (07-06): User-requested feature to hide specific tracks from ghost view in large projects
.50/M input, ### Decisions

0/M output) for immediate user feedback
- **Inline feedback over modals** (05-03): Display success/error states inline below input instead of separate modals or toasts
- **Clear input on success only** (05-03): After successful submission, clear input field; preserve text on error for retry
- **CommandInput conditional rendering** (05-03): Show only when project loaded AND track selected
- **Toaster bottom-right position** (05-03): Position toast notifications in bottom-right corner for future theory warnings
- **All GenerationParams fields required** (06-01): GPT-4o must fill in genre-appropriate defaults for unspecified values
- **Genre defaults table in system prompt** (06-01): Each genre has default tempo, scale, keys, emotion, instruments
- **Default song structure** (06-01): intro(4), verse(8), chorus(8), verse(8), chorus(8), outro(4)
- **Emotion as coordinates** (06-01): Valence (happy/sad) and arousal (energetic/calm) guide expressive generation
- **GM instrument numbers per role** (06-01): Instrumentation defined by role (drums, bass, melody, chords) and GM number
- **Tonal.js Note.transpose for intervals** (06-02): transpose method is on Note module, not Interval module
- **5 section types in genre templates** (06-02): verse, chorus, bridge, intro, outro with fallback to verse
- **Walking bass chromatic approach** (06-02): Last beat of final bar uses semitone below next chord root
- **Chord-tone preference on strong beats** (06-02): 70% probability on beats 1 and 3 vs 50% on weak beats
- **Arousal modifies density** (06-02): High arousal adds kick hits, low arousal reduces hats to quarter notes
- **Classical genre no drums** (06-02): Empty drum arrays in template, generateDrumTrack returns empty array
- **MIDI assembler as pure function** (06-03): assembleProject coordinates all generators with single GenerationParams input
- **Store orchestrates pipeline** (06-03): nlGenerationStore handles API -> assembly -> projectStore.setProject
- **Token cost displayed inline** (06-03): Shows total tokens and estimated cost for API usage transparency
- **Empty state prioritizes generation** (06-03): Generation section first, divider, then upload option below
- **Green styling for generation** (06-03): Green UI distinguishes generation from blue editing workflows
- **Standard PPQ=480 for generated projects** (06-03): All generated projects use fixed 480 PPQ
- **Set-based mute/solo state** (07-01): Use Set<number> for O(1) toggle operations and sparse data handling
- **Non-exclusive solo** (07-01): Multiple tracks can be soloed; solo overrides mute
- **Ephemeral UI state pattern** (07-01): trackUIStore separate from projectStore, resets on project load
- **12-color cycling palette** (07-01): TRACK_COLORS array provides visual distinction for unlimited tracks
- **dnd-kit for drag-and-drop** (07-01): Modern, accessible replacement for deprecated react-beautiful-dnd
- **Tone.Part.mute for real-time control** (07-02): Use Part.mute property to stop callbacks without rescheduling notes
- **Dynamic import for circular dependency** (07-02): trackUIStore uses dynamic import to call NoteScheduler functions
- **Callback pattern for audibility** (07-02): updateTrackMuteStates accepts isAudible callback for state sync
- **Inline toolbar integration** (07-05): Ghost notes toggle added directly to PianoRollEditor toolbar instead of separate Toolbar.tsx component
- **6-dot grip drag handle** (07-03): Clear visual affordance for dragging, common pattern users recognize
- **Left accent bar for selection** (07-03): border-l-4 provides strong indicator without intrusive space usage
- **stopPropagation on control buttons** (07-03): Prevents accidental track selection when clicking mute/solo
- **syncMuteStates after reschedule** (07-06): PlaybackController reapplies trackUIStore states after stop() to preserve mute/solo
- **SSR guard for dynamic imports** (07-06): Browser-only check prevents Next.js build errors with dynamic imports
- **Hidden tracks for visual clarity** (07-06): User-requested feature to hide specific tracks from ghost view in large projects
- **Session-only state without persist middleware** (08-01): Phase 8 research recommendation for ephemeral conversation state
- **Auto-generate conversation titles from first prompt** (08-01): 50-char truncation for readable session identification
- **Chat bubble alignment pattern** (08-03): User messages right-aligned blue, assistant left-aligned gray for clear visual distinction
- **Auto-scroll message list** (08-03): useRef with scrollIntoView on new messages for automatic scroll to latest content
- **Confirmation prompts for session actions** (08-03): window.confirm for New/Clear to prevent accidental conversation loss
- **Cost display in conversation header** (08-03): Running total cost shown in header, per-turn costs in message bubbles
- **Two-button mode toggle** (08-04): Segment control pattern for single-shot vs conversation mode selection
- **Default single-shot mode** (08-04): Single-shot editing is default; conversation mode opt-in for complex scenarios
- **Fixed ConversationPanel height** (08-04): h-96 (384px) container for predictable layout and internal scrolling

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-09
Stopped at: Completed 08-04-PLAN.md
Resume file: None

**Phase 3 Status:** Complete - All 6 plans finished. Piano roll editor verified working with all success criteria met.

**Phase 4 Status:** Complete - All 5 plans finished. Music Theory Validation Layer fully implemented and verified. ScaleValidator blocks out-of-scale notes with clear error messages, TransitionValidator warns on context clashes, GenreValidator enforces genre-specific interval rules (classical, jazz, trap, pop, none). ValidationPipeline coordinates all validators. Visual feedback shows in-scale/out-of-scale rows via subtle piano roll highlighting. Theory controls (toggle, genre selector, key display) integrated in toolbar. Human verification confirmed all 4 phase success criteria pass. Phase goal achieved: system validates all edits against music theory rules with visual feedback showing scale conformance.

**Phase 5 Status:** Complete - All 4 plans finished. Natural language editing pipeline fully operational. OpenAI SDK integrated with GPT-4o using Zod schemas for 6 edit operation types (add, remove, modify, transpose, change_tempo, change_key). Context builder produces compact MIDI JSON with full selected track data. Edit executor applies all operations as batch edit for single-step undo/redo. CommandInput UI component provides prompt input with loading states, inline feedback showing token cost, and example prompts tooltip. Human verification confirmed all 5 phase success criteria pass: melody edits work, tempo changes apply immediately, track targeting functional, GPT-4o returns structured operations, token usage tracked. Multiple issues fixed during verification: OpenAI Structured Outputs compatibility (nullable fields), timeout optimization (60s), batch edit for undo/redo, hover tooltip visibility. Phase goal achieved: users can edit MIDI using natural language prompts without conversation context.

**Phase 6 Status:** Complete - All 4 plans finished. Human verification checkpoint (06-04) revealed 6 critical quality issues which were fixed during checkpoint execution. Initial tests showed: drum track mislabeled, bass not generating, notes outside scale, chaotic melodies. Research audit comparing 06-RESEARCH.md to code found 5 gaps where research didn't translate: melody probabilities wrong, no section variation, weak stepwise motion, missing validation, drum label bug. Six fixes applied: (1) corrected melody probability distribution (40/40/20 on weak beats), (2) strengthened stepwise motion to always pick closest note, (3) added section-based chord progression selection, (4) integrated ValidationPipeline for music theory checking, (5) fixed drum track label for channel 9, (6) corrected system prompt key format examples (was "C#m", now "C#" + "minor" separate) which fixed bass generation failure. Additional fixes: validation context structure corrected, instrumentation enforcement via two-layer validation (GPT prompt + server-side check), comprehensive debug logging added, TypeScript interface mismatch fixed (result.ok → result.valid). Final verification confirmed all 4 success criteria passing. Production build verified successful. Phase goal achieved: users can generate MIDI from scratch using text descriptions with musically coherent, genre-appropriate results.

**Phase 7 Status:** Complete - All 6 plans finished. Multi-track support fully implemented and verified. Foundation layer (07-01) established trackUIStore with Set-based mute/solo state management and 12-color WCAG-compliant palette. dnd-kit installed for accessible drag-and-drop. Mute control (07-02) integrated NoteScheduler with Tone.Part.mute for real-time audio control, dynamic import pattern avoids circular dependencies. Track List UI (07-03) rebuilt with DndContext for sortable tracks, TrackControls with mute/solo buttons, TrackItem with drag handle and selection accent bar. Track management (07-04) added AddTrackModal with full GM instrument selection (128 instruments), addTrack/removeTrack actions, 32-track limit enforcement, smart channel assignment avoiding percussion channel. Ghost notes (07-05) extended PianoRollCanvas to render all tracks with per-track colors at 30% opacity, toolbar toggle for visibility. Human verification checkpoint (07-06) revealed bug where stop button lost mute/solo states - fixed by adding syncMuteStates() to reapply trackUIStore states after rescheduling (commit 0ae33b8). SSR build error fixed with browser guard (commit 3a6e6b1). User-requested feature enhancement: hide from ghost view toggle per track for reducing visual clutter in large projects (commit f0ec581). All 6 phase success criteria verified passing. Production build successful. Phase goal achieved: users can work with multiple tracks and manage them independently.

**Phase 8 Status:** Complete - All 5 plans finished. Conversational editing mode fully implemented and verified. Foundation (08-01) created conversation types and conversationStore with session-only state (no persist middleware per research), auto-generated conversation titles, turn-based message tracking. API route (08-02) built /api/nl-conversation endpoint with message history handling, buildMessagesFromTurns converts turns to OpenAI format, full conversation context sent to GPT-4o for pronoun resolution and reference tracking. ConversationPanel UI (08-03) implemented chat interface with MessageList, MessageItem (user/assistant bubble alignment), PromptInput, cost tracking in header, New/Clear buttons with confirmation prompts. Mode toggle (08-04) integrated EditModeToggle component with segment control pattern, conditional rendering switches between single-shot CommandInput and ConversationPanel, default single-shot mode with opt-in conversation. Human verification checkpoint (08-05) revealed critical bug: instrument swap requests correctly identified target track but failed to change instrument. Root cause: EditOperationSchema lacked change_instrument operation type. Fix applied in 2.5 minutes (commit c6c219e): added change_instrument operation with newInstrument parameter (GM 0-127), implemented handler in editExecutor updating both instrumentNumber and instrumentName, updated system prompts in both modes with operation examples. All 6 phase success criteria verified passing after fix: multi-turn edits work, context preserves, structural/note-level/instrument/timing changes all functional. Architecture: session-only state, full history to GPT-4o, client-side execution, multi-track targeting, cost transparency, seamless single-shot integration. Phase goal achieved: users can edit MIDI through multi-turn conversations with preserved context.
