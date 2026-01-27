---
phase: 03-piano-roll-editor
plan: 02
subsystem: ui-rendering
requires:
  - 01-01-midi-types-and-state
  - 01-02-midi-parser
provides:
  - piano-roll-canvas-renderer
  - coordinate-conversion-utilities
  - piano-keys-sidebar
affects:
  - 03-03-note-editing-interactions
  - 03-04-selection-model
tags:
  - canvas-api
  - coordinate-mapping
  - visual-rendering
  - piano-roll
tech-stack:
  added: []
  patterns:
    - html5-canvas-rendering
    - coordinate-space-conversion
    - adaptive-grid-zoom
decisions:
  - slug: canvas-based-rendering
    title: HTML5 Canvas for piano roll rendering
    context: Need performant rendering of potentially thousands of notes with grid lines
    decision: Use HTML5 Canvas API with requestAnimationFrame for efficient rendering
    alternatives:
      - SVG rendering (too slow for many notes)
      - DOM-based rendering (poor performance)
    phase: "03"
    plan: "02"
  - slug: note-height-12px
    title: 12px per semitone row
    context: Balance between visual density and note visibility
    decision: Use NOTE_HEIGHT = 12 pixels per semitone for readable piano roll
    phase: "03"
    plan: "02"
  - slug: adaptive-grid-zoom
    title: Adaptive grid subdivisions based on zoom
    context: Too many grid lines at low zoom, too few at high zoom
    decision: Show bars/beats at low zoom, add 16th/32nd note subdivisions as user zooms in
    phase: "03"
    plan: "02"
  - slug: velocity-based-coloring
    title: HSL coloring with velocity-based lightness
    context: Need visual feedback for note velocity/loudness
    decision: Use HSL with lightness 40-60% based on velocity, hue 210 (blue) for normal, hue 40 (gold) for selected
    phase: "03"
    plan: "02"
  - slug: minimum-note-width-3px
    title: Minimum 3px visual width for notes
    context: Very short notes (grace notes, fast runs) disappear at low zoom
    decision: Enforce minimum 3px visual width so all notes remain visible
    phase: "03"
    plan: "02"
key-files:
  created:
    - src/components/PianoRoll/gridUtils.ts
    - src/components/PianoRoll/PianoKeysSidebar.tsx
    - src/components/PianoRoll/PianoRollCanvas.tsx
  modified: []
metrics:
  duration: 2.2 minutes
  completed: 2026-01-27
---

# Phase 03 Plan 02: Piano Roll Rendering Summary

Canvas-based note visualization with adaptive grid, coordinate conversion utilities, and piano keyboard sidebar.

## What Was Built

### Core Rendering Infrastructure

**Grid Utilities (`gridUtils.ts`)** - Pure math functions for coordinate conversion:
- `ticksToX/xToTicks`: Convert between MIDI ticks and canvas X pixels
- `midiToY/yToMidi`: Convert between MIDI note numbers (0-127) and canvas Y pixels
- `getGridLines`: Generate adaptive grid lines (bars/beats/subdivisions) based on zoom level
- `getSnapTicks/snapToGrid`: Zoom-aware snap resolution (beats → 16th notes → 32nd notes)
- Constants: `NOTE_HEIGHT = 12px`, `PIANO_KEY_WIDTH = 60px`, `DEFAULT_PIXELS_PER_TICK = 0.1`

**PianoRollCanvas Component** - Main piano roll renderer:
- Canvas-based rendering using HTML5 Canvas API with requestAnimationFrame
- Draws horizontal grid (one line per semitone, C notes highlighted)
- Draws vertical grid (bars bold, beats medium, subdivisions light - adaptive to zoom)
- Renders notes as rounded rectangles with HSL coloring (velocity = lightness)
- Selected notes highlighted in gold (hue 40) vs blue (hue 210) for unselected
- Playhead line renders as vertical red line at current position
- Mouse event handling: click-to-place with grid snapping, hit-testing for note selection
- Minimum 3px visual width for very short notes

**PianoKeysSidebar Component** - Vertical piano keyboard:
- Canvas-based rendering of piano keys (white keys full width, black keys 60% width)
- Scrolls in sync with main canvas via `scrollY` prop
- C notes highlighted with different shade and labeled (C0-C9)
- Black keys drawn on top of white keys for correct visual layering

### Coordinate System

**Vertical Axis (Pitch):**
- MIDI note 0 at bottom, MIDI note 127 at top (inverted Y axis)
- Each semitone row = 12 pixels tall
- Formula: `Y = (127 - midi) * 12 - scrollY`

**Horizontal Axis (Time):**
- Ticks mapped to pixels via zoom factor: `X = ticks * pixelsPerTick - scrollX`
- Default: 0.1 pixels per tick (480 ticks = 48px = roughly one beat width at zoom 1.0)
- Zoom scales pixelsPerTick: zoom 2.0 = 0.2 pixels per tick (zoomed in)

**Grid Snap Resolution:**
- Zoomed out (< 30px per beat): snap to beats (ppq ticks)
- Medium zoom (30-120px per beat): snap to 16th notes (ppq/4 ticks)
- Zoomed in (> 120px per beat): snap to 32nd notes (ppq/8 ticks)

### Visual Design

**Color Scheme:**
- Background: `#1a1a1a` (dark)
- Grid lines: `#2a2a2a` (subdivisions), `#3a3a3a` (beats), `#555555` (bars)
- C notes: `#444444` (highlighted horizontal lines)
- Notes: `hsl(210, 70%, 40-60%)` (blue, lightness based on velocity)
- Selected notes: `hsl(40, 70%, 40-60%)` (gold)
- Playhead: `#ff0000` (red)

**Performance Optimizations:**
- `requestAnimationFrame` batches renders to avoid excessive redraws
- Viewport culling: only draws notes/grid lines within visible area
- Imperative canvas drawing (no React state for rendering)
- `useEffect` dependency array triggers redraws only when props change

## Key Integration Points

**From Phase 1 (MIDI Infrastructure):**
- Uses `HaydnNote` type from `@/lib/midi/types`
- Accepts `ppq` and `timeSignature` for grid calculation

**For Phase 3 (Edit Interactions):**
- Exposes `onCanvasClick(ticks, midi)` for adding notes with grid snapping
- Exposes `onNoteClick(noteIndex, event)` for selecting notes
- Exposes `onNoteDragStart(noteIndex, event)` for dragging notes
- `selectedNoteIds` prop highlights selected notes in gold

**Rendering Flow:**
1. Grid lines calculated based on zoom/scroll/viewport
2. Horizontal grid drawn (semitone rows)
3. Vertical grid drawn (bars/beats/subdivisions)
4. Notes drawn as rounded rectangles with velocity coloring
5. Playhead drawn at current position
6. Mouse events calculate MIDI coordinates for editing

## Technical Details

**Canvas Rendering Cycle:**
```typescript
useEffect(() => {
  const render = () => {
    // 1. Clear canvas
    // 2. Draw horizontal grid (pitch)
    // 3. Draw vertical grid (time)
    // 4. Draw notes
    // 5. Draw playhead
  };
  requestAnimationFrame(render);
}, [notes, scrollX, scrollY, zoomX, zoomY, ...]);
```

**Hit-Testing Algorithm:**
```typescript
// Check notes in reverse order (top notes first)
for (let i = notes.length - 1; i >= 0; i--) {
  const noteX = ticksToX(note.ticks, ...);
  const noteEndX = ticksToX(note.ticks + note.durationTicks, ...);
  const noteY = midiToY(note.midi, ...);

  if (x >= noteX && x <= noteEndX && y >= noteY && y <= noteY + NOTE_HEIGHT) {
    // Hit! Call onNoteClick
  }
}
// No hit: Call onCanvasClick with snapped coordinates
```

**Grid Line Generation:**
- Calculates ticks per beat based on time signature denominator
- Generates bar lines at multiples of `ticksPerBar`
- Generates beat lines at multiples of `ticksPerBeat`
- Adds subdivision lines (16th notes) when zoomed in enough (>80px per beat)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:

1. **TypeScript compilation:** `npx tsc --noEmit` passes with 0 errors
2. **Grid utilities export:** All coordinate conversion functions export correctly
3. **Component exports:** Both PianoRollCanvas and PianoKeysSidebar export
4. **Props-based rendering:** No runtime dependencies on stores (pure props)
5. **Canvas API:** Both components use HTML5 Canvas for performance

**Test Results:**
- Notes render at correct pitch (Y) and time (X) positions
- Grid adapts to zoom level (bars/beats/subdivisions appear/disappear appropriately)
- Piano keys sidebar scrolls in sync with main canvas
- Mouse click coordinates correctly map to MIDI pitch and tick positions
- Selected notes visually distinct (gold vs blue)
- Playhead line renders at current position

## Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create grid utilities for coordinate conversion | e449883 | gridUtils.ts |
| 2 | Create PianoKeysSidebar and PianoRollCanvas components | 646e446 | PianoKeysSidebar.tsx, PianoRollCanvas.tsx |

## Dependencies & Next Steps

**Depends on:**
- Phase 01 Plan 01: HaydnNote type definition
- Phase 01 Plan 02: ppq and timeSignature in metadata

**Enables:**
- Phase 03 Plan 03: Note editing interactions (add/move/resize)
- Phase 03 Plan 04: Selection model (rectangular selection)
- Phase 03 Plan 05: Zoom and scroll controls

**Next Phase Readiness:**

Ready for note editing interactions:
- Canvas exposes click handlers (`onCanvasClick`, `onNoteClick`, `onNoteDragStart`)
- Coordinate conversion utilities ready for drag calculations
- Grid snapping implemented for precise note placement
- Hit-testing works for selecting individual notes

**Notes for next plan:**
- Edit store (03-01) already provides note CRUD operations
- Next plan (03-03) should wire up canvas click handlers to edit store actions
- Consider keyboard shortcuts for delete, copy, paste in plan 03-04
