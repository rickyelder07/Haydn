---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Polish & Enhancement
status: unknown
last_updated: "2026-03-04T18:21:00Z"
progress:
  total_phases: 18
  completed_phases: 13
  total_plans: 60
  completed_plans: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.
**Current focus:** Phase 14 in progress — MIDI hardware integration (MidiInputEngine + midiInputStore foundation complete)

## Current Position

Phase: 14 of 14 — IN PROGRESS
Plan: 14-01 complete (1 of 4 plans done)
Status: Phase 14 Plan 01 complete — MidiInputEngine singleton, midiInputStore Zustand store, InstrumentInstance live-play extension
Last activity: 2026-03-04 — Plan 14-01 complete: MIDI foundation (engine + store + interface extension)

Progress: [██████████░░░░] 80% (v1.0 complete: 42/42 plans, v1.1: 18/TBD plans, Phase 14 plan 01 complete)

## Performance Metrics

**Velocity (v1.0 milestone):**
- Total plans completed: 42
- Total execution time: 19 days (2026-01-23 → 2026-02-11)
- Average: ~2.2 plans/day

**By Phase (v1.0):**

| Phase | Plans | Days | Avg/Plan |
|-------|-------|------|----------|
| 1. Foundation | 6 | 1 | 0.17 days |
| 2. Playback | 6 | 2 | 0.33 days |
| 3. Piano Roll | 6 | 4 | 0.67 days |
| 4. Validation | 5 | 3 | 0.60 days |
| 5. NL Editing | 4 | 2 | 0.50 days |
| 6. Generation | 4 | 3 | 0.75 days |
| 7. Multi-Track | 6 | 2 | 0.33 days |
| 8. Conversational | 5 | 2 | 0.40 days |

**v1.1 Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| 09-01 | 4 min | 3 | 5 |
| 09-02 | 2 min | 3 | 5 |
| 09-03 | 5 min | 3 | 6 |
| 09-04 | 2 min | 3 | 4 |
| 10-01 | 2 min | 2 | 3 |

| 10-02 | 1 min | 2 | 3 |
| 10-03 | 5 min | 2 | 0 |
| 10-04 | 1 min | 1 | 1 |
| 11-01 | 1 min | 2 | 2 |
| 11-02 | 4 min | 1 | 1 |
| 11-03 | 23 min | 1 | 1 |

| 11-04 | 20 min | 2 | 1 |
| 12-01 | 3 min | 2 | 1 |
| 12-02 | ~5 min | 3 | 2 |
| 13-01 | 3 min | 3 | 3 |

**Recent Trend:**
- v1.0 maintained consistent velocity
- v1.1 starting fresh (TBD plans)
| Phase 13 P02 | 2 | 2 tasks | 1 files |
| Phase 13 P03 | ~10 min | 2 | 2 files |
| Phase 13 P04 | ~20 min | 2 | 1 file |
| 14-01 | 2 min | 2 | 3 |

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
Recent decisions affecting v1.1 work:

- **v1.0**: Web app (not desktop) — proven good for cross-platform, zero-install access
- **v1.0**: GPT-4o Structured Outputs — 7 operation types work reliably, extend for AI composition
- **v1.0**: Canvas-based piano roll — performant, ready for velocity lane addition
- **v1.0**: Zustand for state — clean separation, add midiInputStore for hardware
- **v1.0**: PolySynth synthesis — needs enhancement (Phase 10 priority)
- **09-01**: Sidebar collapses to 48px (icon-only) not 0 — toggle button always visible
- **09-01**: useUIStore with Zustand persist — sidebar width/collapsed state persisted to localStorage
- **09-01**: ResizeHandle uses window events — drag continues even when cursor leaves handle bounds
- **09-01**: Sidebar only mounted when project loaded — no empty state sidebar
- **09-02**: Double-click to enter inline edit mode (not single-click) — avoids accidental edits during track selection
- **09-02**: Blur saves same as Enter — natural UX when clicking away from edit field
- **09-02**: Empty string guard reverts to original name — prevents nameless tracks/projects
- **09-02**: stopPropagation wrapper in TrackItem — isolates edit interactions from parent click handler
- **09-03**: TransportStrip width = PIANO_KEY_WIDTH (60px) — ruler ticks align with piano roll grid
- **09-03**: Subdivision ticks only at zoomX > 1.5 — avoids visual clutter at lower zoom levels
- **09-03**: Loop toggle disabled placeholder — loop state deferred to future phase
- **09-04**: Incremental drag delta (startX updates each move) — avoids accumulated error on fast drags
- **09-04**: Playhead visibility guard — only render when pixel position is within visible ruler width
- **09-04**: Seek is context-agnostic — PlaybackController handles audio state, no isPlaying branching needed
- **09-04**: Canvas pointerEvents:none + parent div onClick — clean separation of click handling from rendering
- **10-01**: Cache at Promise level (not resolved value) so concurrent callers share one in-flight CDN fetch
- **10-01**: Omit baseUrl from Tone.Sampler constructor — pass data URLs directly in urls to avoid bug #899
- **10-01**: Use onload/onerror callbacks instead of Tone.loaded() — explicit per-instrument Promise resolution
- [Phase 10-synthesis-enhancement]: isPercussion guard is FIRST in createInstrument, percussion never touches CDN path
- [Phase 10-synthesis-enhancement]: Each unique GM program number is its own NoteScheduler key, no 0-7 piano grouping
- [Phase 10-synthesis-enhancement]: Promise.all pre-load phase separated from scheduling loop, instruments ready before any Part is created
- [Phase 10]: Place loading label between stop button and loop button so visible but does not displace core controls
- [Phase 10]: 10-04: whitespace-nowrap acceptable for loading label since it disappears once CDN fetch completes
- [Phase 10-synthesis-enhancement]: AUDIO-07 is a subjective requirement — only the user can confirm audio quality meets the bar; automated tests cannot substitute
- [Phase 10-synthesis-enhancement]: 10-03: Production build (npm run build) run as explicit gate before human verification — catches import issues not caught by tsc --noEmit alone
- [11-01]: fixOverlappingNotes called inside compositionToHaydnProject() — guarantees all callers get overlap-free projects
- [11-01]: _runGenerate is a plain async function (not Zustand action) — avoids stale closure issues with the retry loop
- [11-01]: Validation blocks only on error severity (not warnings) and deduplicates via Set before passing to retry
- [11-01]: buildHistory returns [] for null turn — clean interface, API callers never need to null-check
- [Phase 11]: Single endpoint dispatches on generateAttempt field presence — keeps client state machine simple (no separate /clarify and /generate routes)
- [Phase 11]: buildClarifySystemPrompt and buildGenerateSystemPrompt as separate functions — clean separation, easy to tune prompts independently
- [Phase 11]: Mode toggle in GenerationInput uses local useState — template form wrapped unchanged in mode === 'template' conditional
- [Phase 11]: useEffect([mode]) calls reset() on switch to AI mode — guarantees clean aiCompositionStore state without stale Q&A
- [Phase 11]: API response shape mismatch: clarify endpoint returns {type, data: {questions}, usage} — store must read data.data.questions not data.questions
- [Phase 11]: Success banner in GenerationInput unmounts on project load — fire toast.success() from store action directly (not component effect) to survive component teardown
- [Phase 12-template-variations]: drumFills placed after drumPatterns in interface — logical grouping of all drum data
- [Phase 12-template-variations]: Classical drumFills: [] (empty) — generateDrumTrack returns early for classical, fills never accessed
- [12-02]: Replace entire progressionIndex if/else-if block with single Math.random() line — simpler code, uniform behavior across all section types
- [12-02]: activePattern declared per-bar inside bar loop (not per-section) — correctly scoped since fills are per-bar boundary decisions
- [12-02]: section.bars >= 2 guard prevents fills on single-bar sections — musically correct
- [13-01]: quantizeNote threshold guard returns originalTicks unchanged when within thresholdPct of grid — avoids over-quantizing already-close notes
- [13-01]: updateNoteDirectly bypasses _history.push entirely — consumers must call updateNote on mouseup for the single undo entry
- [13-01]: formatChordSymbol returns null for slash chords (inversions) — ChordStrip only displays root-position chords
- [13-01]: detectChordsPerBar requires 3+ notes per bar — prevents false positives on sparse bars
- [Phase 13]: dragRef uses useRef for drag state — avoids React re-renders during mousemove, canvas redraws come from notes prop via projectStore
- [Phase 13]: hitTest uses same 0.1 * zoomX formula as rendering — visual stalk position and interactive hit area never drift
- [Phase 13]: velocitySnapshot captured once on mousedown, delta recomputed from snapshot each frame — avoids accumulated floating-point drift on fast drags
- [13-04]: VelocityLane wrapped in div with marginLeft: PIANO_KEY_WIDTH (60px) — canvas positions start at x=0 but ticksToX() returns note-grid-relative positions; offset brings stalks into visual alignment with notes above
- [13-04]: shrink-0 on outer PianoRollEditor div — prevents flex container (main: overflow-y-auto flex-col) from shrinking the editor and clipping the velocity lane
- [14-01]: Inline MIDI type declarations in MidiInputEngine.ts — avoids @types/webmidi conflict with tsconfig lib settings
- [14-01]: Dynamic import for getMidiInputStore inside onstatechange callback — resolves circular dep without shared types file
- [14-01]: refreshDevices() ignores MIDIAccess parameter, re-reads from getMidiInputEngine().getInputDevices() — keeps device-name logic in one place
- [14-01]: InstrumentInstance triggerAttack?/triggerRelease? optional — existing instruments compile unmodified

### Pending Todos

None.

### Blockers/Concerns

**From research:**
- **Phase 10**: Risk of breaking existing audio during synthesis tuning (mitigation: A/B test with v1.0 files)
- **Phase 11**: Token cost explosion potential in AI mode (mitigation: hard 3-question limit, cost warnings)
- **Phase 13**: Timeline scrubber performance during drag (mitigation: throttle updates, RAF for visuals)
- **Phase 14**: MIDI recording timing drift (mitigation: latency compensation, high-res timestamps)

All pitfalls documented in research/v1.1/SUMMARY.md with prevention strategies.

## Session Continuity

Last session: 2026-03-04
Stopped at: Completed 14-01-PLAN.md — MidiInputEngine singleton, midiInputStore Zustand store, InstrumentInstance live-play extension
Resume file: None

**Next step:** Phase 14 Plan 02 (MIDI recording pipeline).

---

*Last updated: 2026-03-04 after Plan 14-01 complete (MIDI foundation: MidiInputEngine + midiInputStore + InstrumentInstance optional live-play methods)*
