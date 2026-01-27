# Phase 3: Piano Roll Editor - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual MIDI note editing interface where users can see, add, delete, and move MIDI notes with manual control. Supports undo/redo for all edit operations. This phase delivers direct manipulation of MIDI data before natural language editing arrives in Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Visual Presentation
- **Zoom controls**: Horizontal + vertical zoom independently (separate time axis and pitch axis zoom)
- **Grid system**: Adaptive grid based on zoom level
  - Zoomed out → show bar lines
  - Zoomed in → show beat subdivisions (16th notes, etc.)
  - Grid adapts automatically to provide relevant visual guides at each zoom level
- **Rendering approach**: Claude's discretion (choose between Canvas, SVG, or hybrid based on performance needs)
- **Note color scheme**: Claude's discretion (choose color strategy that makes notes easy to distinguish)

### Note Properties Editing
- **Editable properties**: Pitch, timing, duration, velocity (full note editing in Phase 3)
- **Duration editing**: Both drag and inspector
  - Drag right edge of note for quick adjustments
  - Inspector panel with input field for exact duration values
- **Pitch/timing dragging**: Claude's discretion (choose between free drag, constrained with modifiers, or separate handles)
- **Velocity editing**: Claude's discretion (choose between inspector panel, velocity lane, or direct manipulation)

### Claude's Discretion
- Canvas vs SVG rendering decision based on performance testing
- Note coloring strategy (velocity-based, track-based, or pitch-based)
- Exact drag behavior for moving notes
- Velocity editing UI pattern
- Visual styling details (note borders, shadows, grid line weights)
- Zoom level increments and default zoom
- Piano key sidebar design

</decisions>

<specifics>
## Specific Ideas

- Adaptive grid is key — users need relevant guides at every zoom level without visual clutter
- Both drag and inspector for duration gives flexibility: quick visual adjustments vs precise numeric input
- Full property editing (including velocity) in Phase 3 makes it a complete manual editor before NL arrives

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-piano-roll-editor*
*Context gathered: 2026-01-26*
