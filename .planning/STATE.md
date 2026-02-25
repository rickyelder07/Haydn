# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Natural language edits must produce musically coherent results that follow music theory, respect genre conventions, and maintain context with the existing track.
**Current focus:** Phase 10 - Synthesis Enhancement

## Current Position

Phase: 10 of 14 (Synthesis Enhancement)
Plan: 1 of TBD in current phase
Status: Executing
Last activity: 2026-02-25 — Completed Plan 10-01 (CDN sample loading foundation — 3 new files, 0 TypeScript errors)

Progress: [█████████░░░░░] 64% (v1.0 complete: 42/42 plans, v1.1: 5/TBD plans, Phase 10 in progress)

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

**Recent Trend:**
- v1.0 maintained consistent velocity
- v1.1 starting fresh (TBD plans)

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

Last session: 2026-02-25
Stopped at: Completed 10-01-PLAN.md (CDN sample loading foundation — gmInstrumentNames.ts, soundfontLoader.ts, SamplerInstrument.ts)
Resume file: None

**Next step:** Execute Plan 10-02 to wire SamplerInstrument into InstrumentFactory and NoteScheduler.

---

*Last updated: 2026-02-25 after Plan 10-01 execution (CDN sample loading foundation)*
