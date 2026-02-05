# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.
**Current focus:** Phase 6 - Natural Language Generation

## Current Position

Phase: 6 of 8 (Natural Language Generation)
Plan: 3 of TBD in current phase
Status: In progress
Last activity: 2026-02-05 — Completed 06-03-PLAN.md

Progress: [█████████████████████] 150% (30/20 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 30
- Average duration: 9.0 minutes
- Total execution time: 4.63 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-a-midi-infrastructure | 6 | 16.9 min | 2.8 min |
| 02-audio-playback-engine | 6 | 14.5 min | 2.4 min |
| 03-piano-roll-editor | 6 | 216.4 min | 36.1 min |
| 04-music-theory-validation-layer | 5 | 16.7 min | 3.3 min |
| 05-natural-language-editing-single-shot | 4 | 7.2 min | 1.8 min |
| 06-natural-language-generation | 3 | 9.8 min | 3.3 min |

**Recent Trend:**
- Last 5 plans: 05-03 (2.0 min), 05-04 (manual verification), 06-01 (1.9 min), 06-02 (4.0 min), 06-03 (3.9 min)
- Trend: Phase 6 averaging 3.3 minutes with consistent complexity, successful end-to-end integration

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-05
Stopped at: Completed 06-03-PLAN.md
Resume file: None

**Phase 3 Status:** Complete - All 6 plans finished. Piano roll editor verified working with all success criteria met.

**Phase 4 Status:** Complete - All 5 plans finished. Music Theory Validation Layer fully implemented and verified. ScaleValidator blocks out-of-scale notes with clear error messages, TransitionValidator warns on context clashes, GenreValidator enforces genre-specific interval rules (classical, jazz, trap, pop, none). ValidationPipeline coordinates all validators. Visual feedback shows in-scale/out-of-scale rows via subtle piano roll highlighting. Theory controls (toggle, genre selector, key display) integrated in toolbar. Human verification confirmed all 4 phase success criteria pass. Phase goal achieved: system validates all edits against music theory rules with visual feedback showing scale conformance.

**Phase 5 Status:** Complete - All 4 plans finished. Natural language editing pipeline fully operational. OpenAI SDK integrated with GPT-4o using Zod schemas for 6 edit operation types (add, remove, modify, transpose, change_tempo, change_key). Context builder produces compact MIDI JSON with full selected track data. Edit executor applies all operations as batch edit for single-step undo/redo. CommandInput UI component provides prompt input with loading states, inline feedback showing token cost, and example prompts tooltip. Human verification confirmed all 5 phase success criteria pass: melody edits work, tempo changes apply immediately, track targeting functional, GPT-4o returns structured operations, token usage tracked. Multiple issues fixed during verification: OpenAI Structured Outputs compatibility (nullable fields), timeout optimization (60s), batch edit for undo/redo, hover tooltip visibility. Phase goal achieved: users can edit MIDI using natural language prompts without conversation context.

**Phase 6 Status:** In progress - 3 of TBD plans finished. LLM parameter extraction complete (06-01). GenerationParamsSchema defines 10 structured fields (genre, tempo, key, scale, timeSignature, structure, emotion, instrumentation, description). POST /api/nl-generate endpoint parses natural language prompts into GenerationParams using GPT-4o with genre-appropriate defaults. System prompt includes defaults for all 6 genres (lofi, trap, boom-bap, jazz, classical, pop) with tempo ranges, scales, keys, emotion coordinates, GM instruments. All fields required - GPT fills in defaults for unspecified values. Much smaller system prompts (~500 tokens) vs editing (~2000-5000) due to no MIDI context. Rule-based generators complete (06-02). Five pure-function modules in src/lib/nl-generation/: genreTemplates (6 genres with chord progressions, drum patterns, configs), chordGenerator (roman numerals to MIDI voicings via Tonal.js), rhythmGenerator (genre-appropriate drums on channel 9 with arousal modifiers), melodyGenerator (weighted random walk preferring chord tones on strong beats), bassGenerator (three rhythm styles: root-notes, walking, arpeggiated). All use Tonal.js for music theory. ChordSymbol type provides timing coordination. End-to-end pipeline complete (06-03). midiAssembler.ts combines all generator outputs into HaydnProject with drums, bass, chords, melody tracks. nlGenerationStore.ts orchestrates API -> assembly -> projectStore.setProject. GenerationInput.tsx provides user-facing prompt input with examples, loading, inline feedback showing token cost. page.tsx empty state updated: generation section first (green-themed), divider, upload section below. Full pipeline functional: users type "create a lofi hip hop beat" and see complete multi-track MIDI project appear in piano roll with playback ready.
