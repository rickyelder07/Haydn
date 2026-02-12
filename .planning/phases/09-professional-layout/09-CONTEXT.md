# Phase 9: Professional Layout - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Application has professional DAW-style layout with resizable sidebar and integrated timeline. This phase transforms the current UI into a polished, production-ready interface with:
- Resizable sidebar with persistent width
- Integrated timeline ruler with playhead interaction
- Inline editing for track/project names
- Visually integrated transport controls

</domain>

<decisions>
## Implementation Decisions

### Timeline Integration Style
- **Position:** Integrated into piano roll top (timeline ruler is the top edge of the canvas, no separation)
- **Click behavior:** Context-aware — if playing, jump continues playback; if paused, just move playhead
- **Tick display:** Hierarchical ticks with measure numbers
  - Tall ticks for measures with numbers (1, 2, 3...)
  - Medium ticks for beats
  - Short ticks for subdivisions when zoomed in
- **Playhead interaction:** Both drag and click
  - User can drag the triangle to scrub
  - OR click timeline to jump directly

### Transport Controls Placement
- **Position:** Embedded in timeline strip (left side before measures start)
- **Controls included:** Full set — Play/Pause, Stop, Loop toggle, Tempo display/control
- **Visual integration:** Distinct section with clear separation from timeline ruler (different background or border)
- **Tempo editing:** Click to edit inline (click value → input field for direct editing)

### Claude's Discretion
- Sidebar resize constraints (min/max width values)
- Sidebar resize visual feedback (cursor, preview line, etc.)
- Inline editing trigger pattern (single vs double click)
- Edit mode visual treatment (highlight, border, background)
- Keyboard shortcuts for edit actions
- Transport control icon design
- Exact spacing and sizing for timeline/transport elements
- Animation/transition timing for resize and edit interactions

</decisions>

<specifics>
## Specific Ideas

No specific product references provided — open to standard DAW approaches with modern, polished execution.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-professional-layout*
*Context gathered: 2026-02-12*
