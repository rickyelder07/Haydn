# Phase 13: Advanced Piano Roll Editing - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Add velocity editing, quantization controls, and chord symbol display to the piano roll. Basic note creation and editing are already in Phase 9. This phase layers three advanced editing capabilities on top of the existing piano roll without adding new capabilities like recording or MIDI export.

</domain>

<decisions>
## Implementation Decisions

### Velocity Lane

- User-resizable height — user can drag a divider to make the lane taller or shorter
- Minimum height ~48px — prevents full collapse while allowing compact view
- Drag the stalk tip up/down to set velocity (standard DAW behavior)
- Multi-note editing: dragging one stalk offsets all selected notes by the same delta (preserves relative velocity relationships)
- Color gradient by value — low velocity = dim, high velocity = bright cyan (fits design system accent)

### Quantization Controls

- Lives in a toolbar popover — a button in the piano roll toolbar opens a small panel
- Explicit "Quantize" apply button — user sets all parameters then commits; no live preview
- Applies to selected notes, or all notes if none are selected; result is undoable
- Grid values: standard note values — 1/4, 1/8, 1/16, 1/32, plus triplet variants
- Strength: percentage slider 0–100% (100% = fully quantized, 50% = half-pulled toward grid)
- Swing and threshold controls also in the popover (implementation approach at Claude's discretion)

### Chord Symbol Display

- Dedicated strip above the note grid, below the timeline ruler (~24px fixed height)
- Chord detection: 3+ simultaneous notes in a bar triggers detection
- Ambiguous chords: show the most likely match (prefer root position, common inversions)
- Format: standard shorthand — Cmaj, Cmin, C7, Cmaj7, Caug, Cdim
- Click behavior: clicking a chord symbol selects all notes in that bar that form the chord

### Feature Coexistence & Layout

- Velocity lane is ON by default when a project loads
- Chord symbol strip is OFF by default — user opts in via toolbar toggle
- Toggle controls for both features live in the piano roll toolbar (alongside existing theory/ghost note toggles)
- Total editor height is fixed — velocity lane and chord strip take height from the note grid (fixed split, not expanding)

### Claude's Discretion

- Swing and threshold exact UI controls (slider vs input vs dropdown)
- Exact stalk rendering style (width, cap style)
- Chord detection algorithm (voicing matching, inversion handling)
- Keyboard shortcuts for velocity/chord toggles

</decisions>

<specifics>
## Specific Ideas

- Velocity coloring should feel cohesive with the existing design — dim stalks for soft notes, full-brightness cyan for loud notes, similar to how the design system uses cyan as the primary accent
- Chord strip should feel like a read-only annotation layer — subtle typography, not competing with the note grid

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-advanced-piano-roll-editing*
*Context gathered: 2026-03-02*
