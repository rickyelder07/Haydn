# Phase 13: Advanced Piano Roll Editing - Research

**Researched:** 2026-03-02
**Domain:** Canvas-based DAW UI — velocity lane, MIDI quantization algorithm, chord symbol detection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Velocity Lane
- User-resizable height — user can drag a divider to make the lane taller or shorter
- Minimum height ~48px — prevents full collapse while allowing compact view
- Drag the stalk tip up/down to set velocity (standard DAW behavior)
- Multi-note editing: dragging one stalk offsets all selected notes by the same delta (preserves relative velocity relationships)
- Color gradient by value — low velocity = dim, high velocity = bright cyan (fits design system accent)

#### Quantization Controls
- Lives in a toolbar popover — a button in the piano roll toolbar opens a small panel
- Explicit "Quantize" apply button — user sets all parameters then commits; no live preview
- Applies to selected notes, or all notes if none are selected; result is undoable
- Grid values: standard note values — 1/4, 1/8, 1/16, 1/32, plus triplet variants
- Strength: percentage slider 0–100% (100% = fully quantized, 50% = half-pulled toward grid)
- Swing and threshold controls also in the popover (implementation approach at Claude's discretion)

#### Chord Symbol Display
- Dedicated strip above the note grid, below the timeline ruler (~24px fixed height)
- Chord detection: 3+ simultaneous notes in a bar triggers detection
- Ambiguous chords: show the most likely match (prefer root position, common inversions)
- Format: standard shorthand — Cmaj, Cmin, C7, Cmaj7, Caug, Cdim
- Click behavior: clicking a chord symbol selects all notes in that bar that form the chord

#### Feature Coexistence and Layout
- Velocity lane is ON by default when a project loads
- Chord symbol strip is OFF by default — user opts in via toolbar toggle
- Toggle controls for both features live in the piano roll toolbar (alongside existing theory/ghost note toggles)
- Total editor height is fixed — velocity lane and chord strip take height from the note grid (fixed split, not expanding)

### Claude's Discretion
- Swing and threshold exact UI controls (slider vs input vs dropdown)
- Exact stalk rendering style (width, cap style)
- Chord detection algorithm (voicing matching, inversion handling)
- Keyboard shortcuts for velocity/chord toggles

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VEL-01 | Velocity lane renders below piano roll showing velocity stalks (vertical bars) | Canvas-based VelocityLane component, new row below main editor area |
| VEL-02 | User can click and drag velocity stalks to edit individual note velocities | mousedown hit-test on stalk + window mousemove/mouseup pattern from usePianoRollInteractions |
| VEL-03 | Velocity lane scrolls horizontally in sync with piano roll | Pass same scrollX/zoomX props to VelocityLane canvas |
| VEL-04 | Selected note in piano roll highlights corresponding velocity stalk | Pass selectedNoteIds to VelocityLane, highlight in cyan |
| VEL-05 | Velocity changes update in real-time during drag | editStore.updateNote during mousemove, NOT only on mouseup |
| VEL-06 | Multi-select velocity editing (adjust all selected notes simultaneously) | Delta-offset pattern: all selected note velocities shift by same delta |
| QUANT-01 | User can access quantization controls in piano roll toolbar | Popover button in toolbar, same pattern as existing toolbar buttons |
| QUANT-02 | User can set quantization strength (0-100%, default 80%) | Range slider in popover |
| QUANT-03 | User can select quantization grid (1/4, 1/8, 1/16, 1/32 notes) | Select/button group in popover |
| QUANT-04 | User can set "exclude within" threshold | Range slider or number input in popover |
| QUANT-05 | User can set swing parameter (50-75%) | Range slider in popover |
| QUANT-06 | Quantization applies to selected notes (or all notes if none selected) | Read editStore.selectedNoteIds, filter notes accordingly |
| QUANT-07 | Quantization is undoable (single undo step) | editStore.applyBatchEdit() — already exists for single undo entry |
| CHORD-01 | Piano roll displays chord symbols above note grid | ChordStrip component, placed between TimelineRuler and main editor area |
| CHORD-02 | Chord symbols detect from notes in each bar (minimum 3 notes required) | tonal Chord.detect() — confirmed working in project node_modules |
| CHORD-03 | Chord symbols update dynamically as notes change | Derive from notes array (no separate store), recomputes on notes prop change |
| CHORD-04 | User can toggle chord symbol visibility on/off | Boolean state in PianoRollEditor, default false |
| CHORD-05 | Clicking chord symbol highlights corresponding notes in piano roll | editStore multi-select: toggle selectedNoteIds for notes in that bar |
</phase_requirements>

---

## Summary

Phase 13 adds three advanced editing layers to the existing canvas-based piano roll: a velocity lane below the note grid, a quantization popover in the toolbar, and a chord symbol strip above the note grid. All three are additive — they do not require rewriting any existing component, only extending `PianoRollEditor.tsx` with new sub-components and wiring.

The velocity lane is a new canvas element that renders vertical stalks whose height maps to normalized velocity (0-1). It shares `scrollX`, `zoomX`, and `ppq` from the parent editor so horizontal scroll stays in sync. Stalk dragging follows the same `mousedown + window mousemove/mouseup` pattern already in `usePianoRollInteractions`. The user-resizable height divider uses a simple `useState` + `onMouseDown`/`window.onMouseMove` approach — no library needed.

The quantization algorithm is pure TypeScript math: `new_ticks = original + strength × (nearest_grid - original)` with a threshold guard. Swing shifts every other grid position (offbeat grid lines) by `(swing_pct - 50) / 50 × gridTicks`. The result is applied as a single `applyBatchEdit()` call so it's one undo step. No new library needed. Triplet grid values require dividing by 3 (e.g., 1/8T = `ppq * 2 / 3`).

Chord detection uses `tonal`'s `Chord.detect()` (already installed at v6.4.3, confirmed working). MIDI note numbers convert to pitch class names via `Note.fromMidi()` + `Note.pitchClass()`, then `Chord.detect(pitchClasses)` returns a string array. Tonal returns `'CM'` for C major — a thin formatter maps this to the user-facing `'Cmaj'` shorthand. Chord computation is a pure function derived from the notes array; no new store needed.

**Primary recommendation:** Build three new sub-components (VelocityLane, QuantizePopover, ChordStrip), extend PianoRollEditor layout to host them, and add toggle state to PianoRollEditor's local state. Use `editStore.applyBatchEdit` for quantization undo. Use `tonal` for chord detection — zero new dependencies.

---

## Standard Stack

### Core (all already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tonal | 6.4.3 | `Chord.detect()`, `Note.fromMidi()`, `Note.pitchClass()` | Already installed, confirmed working; beats hand-rolling chord lookup tables |
| zustand | 5.0.10 | Piano roll UI state (toggle visibility) | Existing state pattern in project |
| React (Next.js) | 19 / 15 | Component structure for VelocityLane, ChordStrip, QuantizePopover | Project framework |

### No New Dependencies Required

This phase requires zero new npm packages. All capabilities are covered by:
- `tonal` (chord detection)
- Canvas 2D API (velocity lane rendering)
- React `useState` (toggle state, popover open/close, velocity lane height)
- `editStore.applyBatchEdit()` (quantization undo)
- `editStore.updateNote()` (real-time velocity drag)

**Installation:**
```bash
# No new packages needed
```

---

## Architecture Patterns

### Recommended File Structure

```
src/components/PianoRoll/
├── PianoRollEditor.tsx        # MODIFY: add VelocityLane, ChordStrip layout, toolbar toggles
├── VelocityLane.tsx           # NEW: canvas-based velocity stalks + drag editing
├── ChordStrip.tsx             # NEW: chord symbol display above note grid
├── QuantizePopover.tsx        # NEW: popover with quantize controls + apply button
├── quantizeUtils.ts           # NEW: pure quantization algorithm (strength, swing, threshold)
├── chordDetection.ts          # NEW: tonal-based chord detection per bar
├── PianoRollCanvas.tsx        # NO CHANGE
├── usePianoRollInteractions.ts # NO CHANGE
├── gridUtils.ts               # NO CHANGE (reuse ticksToX, xToTicks)
└── ... (all other files unchanged)
```

### Pattern 1: VelocityLane Canvas Component

**What:** A canvas element that draws vertical stalks proportional to note velocity. The canvas width and horizontal scroll mirror the note grid exactly (same `scrollX`, `zoomX`, `pixelsPerTick`). Stalk X position = `ticksToX(note.ticks, pixelsPerTick, scrollX)` (identical to note grid).

**When to use:** Whenever `velocityLaneVisible` is true in PianoRollEditor state.

**Example:**
```typescript
// src/components/PianoRoll/VelocityLane.tsx
// Stalk x = same ticksToX formula as PianoRollCanvas
// Stalk height = velocity * (laneHeight - 4)  // 4px padding from top
// Stalk color = `hsl(186, 100%, ${20 + velocity * 60}%)` // dim to bright cyan

const stalkX = ticksToX(note.ticks, pixelsPerTick, scrollX);
const stalkHeight = note.velocity * (laneHeight - 4);
const stalkY = laneHeight - stalkHeight; // grows upward
const hue = 186; // cyan (matches design system #00E5FF)
const lightness = 20 + note.velocity * 60; // 20% (dim) to 80% (bright)
ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
ctx.fillRect(stalkX, stalkY, stalkWidth, stalkHeight);
```

### Pattern 2: Velocity Stalk Hit-Test

**What:** On mousedown in the VelocityLane canvas, hit-test against stalk bounds. Stalk has a 4px wider hit region than rendered width for easier dragging.

**When to use:** For both single-note drag and multi-note delta drag.

```typescript
// Hit-test: stalk X within ±6px of note tick position
const stalkX = ticksToX(note.ticks, pixelsPerTick, scrollX);
const isHit = Math.abs(x - stalkX) < 6;

// Velocity from Y position: inverted (bottom = 0, top = 1)
const newVelocity = Math.max(0, Math.min(1, (laneHeight - y) / laneHeight));
```

### Pattern 3: Multi-Note Velocity Delta Drag

**What:** When dragging a stalk for a note that is part of a multi-selection, all selected note velocities shift by the same delta instead of setting the same absolute value.

```typescript
// On mousemove during drag:
const deltaY = startMouseY - currentMouseY; // drag up = increase velocity
const deltaVelocity = deltaY / laneHeight;

if (isMultiSelect && selectedNoteIds.size > 1) {
  // Apply delta to all selected notes, clamping each to [0, 1]
  selectedNoteIds.forEach(noteId => {
    const noteIndex = parseNoteIndex(noteId);
    const originalVelocity = velocitiesAtDragStart[noteIndex];
    editStore.updateNote(noteIndex, { velocity: Math.max(0, Math.min(1, originalVelocity + deltaVelocity)) });
  });
} else {
  // Single note: set absolute value
  editStore.updateNote(dragNoteIndex, { velocity: Math.max(0, Math.min(1, newVelocity)) });
}
```

**IMPORTANT:** Capture `velocitiesAtDragStart` as a snapshot when mousedown fires, before any updates, so delta is always relative to the original state — not accumulated across mousemove calls.

### Pattern 4: Velocity Lane Height Resizing

**What:** A 6px draggable divider between the note grid and velocity lane. Uses local `useState` for `laneHeight`. No library needed.

```typescript
// In PianoRollEditor:
const [velocityLaneHeight, setVelocityLaneHeight] = useState(80);
const VELOCITY_LANE_MIN = 48;
const VELOCITY_LANE_MAX = 160;

// Divider drag:
const handleDividerMouseDown = (e: React.MouseEvent) => {
  const startY = e.clientY;
  const startHeight = velocityLaneHeight;

  const handleMouseMove = (e: MouseEvent) => {
    const delta = startY - e.clientY; // drag up = taller
    const newHeight = Math.max(VELOCITY_LANE_MIN, Math.min(VELOCITY_LANE_MAX, startHeight + delta));
    setVelocityLaneHeight(newHeight);
  };
  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
};
```

### Pattern 5: Quantization Algorithm

**What:** Pure function that applies strength, threshold, and swing to note tick positions.

```typescript
// src/components/PianoRoll/quantizeUtils.ts

export interface QuantizeParams {
  gridTicks: number;     // e.g. ppq/4 for 1/16 note at 480 ppq = 120 ticks
  strength: number;      // 0–100 (percentage)
  thresholdPct: number;  // 0–100 (exclude notes already within this % of grid)
  swingPct: number;      // 50–75 (50 = no swing)
}

export function quantizeNote(
  originalTicks: number,
  params: QuantizeParams
): number {
  const { gridTicks, strength, thresholdPct, swingPct } = params;

  // Find nearest grid line
  const gridPosition = Math.round(originalTicks / gridTicks);
  const nearestGrid = gridPosition * gridTicks;
  const isOnOddGrid = gridPosition % 2 !== 0; // for swing

  // Apply swing: odd (offbeat) grid lines shift later
  const swingOffset = isOnOddGrid
    ? ((swingPct - 50) / 50) * gridTicks
    : 0;
  const swungGrid = nearestGrid + swingOffset;

  // Threshold: skip notes already close enough to grid
  const distanceToGrid = Math.abs(originalTicks - swungGrid);
  const threshold = (thresholdPct / 100) * gridTicks;
  if (distanceToGrid < threshold) return originalTicks;

  // Apply strength (linear interpolation)
  const strengthFactor = strength / 100;
  return Math.round(originalTicks + strengthFactor * (swungGrid - originalTicks));
}

// Grid tick values (at ppq=480)
// 1/4  = ppq         = 480
// 1/8  = ppq/2       = 240
// 1/16 = ppq/4       = 120
// 1/32 = ppq/8       = 60
// 1/4T = ppq*2/3     = 320
// 1/8T = ppq/3       = 160
// 1/16T= ppq/6       = 80
export function gridTicksForValue(ppq: number, value: string): number {
  const map: Record<string, number> = {
    '1/4': ppq,
    '1/8': ppq / 2,
    '1/16': ppq / 4,
    '1/32': ppq / 8,
    '1/4T': Math.round(ppq * 2 / 3),
    '1/8T': Math.round(ppq / 3),
    '1/16T': Math.round(ppq / 6),
  };
  return map[value] ?? ppq / 4;
}
```

### Pattern 6: Chord Detection Per Bar

**What:** Pure function that computes detected chords for each bar. Uses `tonal`'s `Chord.detect()`.

```typescript
// src/components/PianoRoll/chordDetection.ts
import { Chord, Note } from 'tonal';

export interface DetectedChord {
  bar: number;           // 0-indexed bar number
  barStartTicks: number;
  barEndTicks: number;
  symbol: string;        // e.g. "Cmaj", "Dm", "G7"
  noteIndices: number[]; // indices of notes in the bar that form this chord
}

export function detectChordsPerBar(
  notes: HaydnNote[],
  ppq: number,
  timeSignature: { numerator: number; denominator: number }
): DetectedChord[] {
  const ticksPerBeat = ppq * (4 / timeSignature.denominator);
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  if (ticksPerBar <= 0 || notes.length === 0) return [];

  // Find total bars
  const maxTick = Math.max(...notes.map(n => n.ticks + n.durationTicks));
  const numBars = Math.ceil(maxTick / ticksPerBar);

  const result: DetectedChord[] = [];

  for (let bar = 0; bar < numBars; bar++) {
    const barStart = bar * ticksPerBar;
    const barEnd = barStart + ticksPerBar;

    // Notes "in" this bar: start tick falls within bar range
    const barNoteIndices: number[] = [];
    notes.forEach((note, idx) => {
      if (note.ticks >= barStart && note.ticks < barEnd) {
        barNoteIndices.push(idx);
      }
    });

    // Need 3+ notes for chord detection
    if (barNoteIndices.length < 3) continue;

    // Get unique pitch classes
    const pitchClasses = Array.from(
      new Set(barNoteIndices.map(i => Note.pitchClass(Note.fromMidi(notes[i].midi))))
    );

    // Detect chord
    const detected = Chord.detect(pitchClasses);
    if (detected.length === 0) continue;

    // Prefer non-slash chords (root position) as first result
    const preferred = detected.find(c => !c.includes('/')) ?? detected[0];
    const symbol = formatChordSymbol(preferred);
    if (!symbol) continue;

    result.push({
      bar,
      barStartTicks: barStart,
      barEndTicks: barEnd,
      symbol,
      noteIndices: barNoteIndices,
    });
  }

  return result;
}

// Format tonal chord name to user-facing shorthand
// 'CM' -> 'Cmaj', 'Cm' -> 'Cmin', 'C7' -> 'C7', 'Cmaj7' -> 'Cmaj7'
export function formatChordSymbol(chordName: string): string | null {
  if (chordName.includes('/')) return null; // skip inversions
  const chord = Chord.get(chordName);
  if (!chord.tonic) return null;

  const typeMap: Record<string, string> = {
    'major': 'maj',
    'minor': 'min',
    'augmented': 'aug',
    'diminished': 'dim',
    'dominant seventh': '7',
    'major seventh': 'maj7',
    'minor seventh': 'min7',
    'diminished seventh': 'dim7',
    'half-diminished': 'm7b5',
    'suspended fourth': 'sus4',
    'suspended second': 'sus2',
  };

  const suffix = typeMap[chord.type] ?? chord.type;
  return chord.tonic + suffix;
}
```

**Verified:** `Chord.detect(['C','E','G'])` returns `['CM', 'Em#5/C']` in project's tonal v6.4.3. `Note.fromMidi(60)` returns `'C4'`. `Note.pitchClass('C4')` returns `'C'`.

### Pattern 7: ChordStrip Component

**What:** A React div (not canvas) with absolutely-positioned chord label buttons, placed between TimelineRuler and the main editor area. Uses the same `scrollX`/`zoomX`/`pixelsPerTick` as the note grid.

```typescript
// ChordStrip.tsx renders chord buttons over a 24px strip
// Position: left = PIANO_KEY_WIDTH + ticksToX(chord.barStartTicks, pixelsPerTick, scrollX)
// Width: ticksToX(barEndTicks, ...) - ticksToX(barStartTicks, ...)
// Overflow hidden on container clips chords at viewport edge
```

### Anti-Patterns to Avoid

- **Real-time velocity history spam:** Calling `editStore.updateNote()` on every mousemove pushes a history entry for every pixel. INSTEAD: push history only on mouseup, update the project store directly during drag without going through HistoryManager. See approach in Code Examples section.
- **Re-deriving chords in render:** Do not recompute chord detection inside the render function on every keystroke. INSTEAD: `useMemo` with notes array as dep, or compute in `chordDetection.ts` and memoize with `useMemo`.
- **Canvas-in-React useEffect dependency excess:** Listing too many deps in the canvas render useEffect causes unnecessary repaints. Include only: `notes`, `scrollX`, `zoomX`, `selectedNoteIds`, `laneHeight`.
- **Quantize popover closing on apply:** If the popover unmounts on "Apply", state resets to defaults on next open. INSTEAD: keep popover state in parent or derive from persistent store.
- **Chord strip consuming click events over note grid:** The chord strip must not overlay the note grid's interaction area. It lives above the `containerRef` div, as a sibling — not inside it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chord name lookup from pitches | Custom pitch-to-chord lookup table | `tonal` `Chord.detect()` | Covers 100+ chord types, inversion detection, enharmonic equivalence |
| Note name from MIDI number | Custom `midi -> note name` mapping | `tonal` `Note.fromMidi()`, `Note.pitchClass()` | Handles all edge cases, enharmonic spellings |
| Quantization library | External quantization library | Hand-roll `quantizeUtils.ts` (pure math, 40 lines) | Algorithm is simple linear interpolation — no library needed or appropriate |
| Resizable panel library | `react-resizable-panels` or similar | Hand-roll mousedown/mousemove pattern | Same pattern already exists in `ResizeHandle.tsx` for sidebar; consistency more important than zero-code |
| Undo for quantization | New undo system | `editStore.applyBatchEdit()` | Already exists, already tested — one call = one undo step |

**Key insight:** The only non-trivial logic is chord detection; `tonal` eliminates that entirely. Everything else is canvas geometry math and standard React event patterns already established in the codebase.

---

## Common Pitfalls

### Pitfall 1: Velocity Drag History Explosion
**What goes wrong:** Each `mousemove` during velocity drag creates a new history entry — 50-100 history entries per drag makes undo useless.
**Why it happens:** `editStore.updateNote()` calls `_history.push()` on every call.
**How to avoid:** During drag, bypass `_history` and write directly to `projectStore` via a new store action: `updateNoteDirectly(trackIndex, noteIndex, updates)` (no history push). On `mouseup`, call `editStore.updateNote()` once to push the final state to history.
**Warning signs:** Undo only moves one pixel during drag; many history entries logged.

### Pitfall 2: Chord Detection Performance
**What goes wrong:** `Chord.detect()` runs on every render for every bar, causing visible jank with large MIDI files.
**Why it happens:** Notes array changes on every edit, triggering full recompute.
**How to avoid:** Wrap `detectChordsPerBar(notes, ppq, timeSignature)` in `useMemo` with `[notes, ppq, timeSignature]` dependencies in PianoRollEditor. This ensures detection only runs when notes actually change.
**Warning signs:** Performance degrades on files with 500+ notes, especially during drag.

### Pitfall 3: Velocity Lane X-Axis Drift
**What goes wrong:** Velocity stalks appear slightly offset from their notes in the piano roll.
**Why it happens:** A different `pixelsPerTick` constant or `scrollX` offset is used between the two canvases.
**How to avoid:** Use the exact same formula: `const pixelsPerTick = 0.1 * zoomX`. Pass identical `scrollX` and `zoomX` from PianoRollEditor state to both `PianoRollCanvas` and `VelocityLane`. Do not derive `pixelsPerTick` independently.
**Warning signs:** Stalks appear offset at all zoom levels, or only at non-1.0 zoom.

### Pitfall 4: Quantize Triplet Grid Rounding
**What goes wrong:** Triplet note values (1/8T, etc.) produce floating-point tick values that accumulate rounding errors across bars.
**Why it happens:** `ppq * 2/3` is not an integer at ppq=480 (result: 320, which is fine), but `ppq * 1/6` = 80 is fine too. At ppq=96, `96/3 = 32` is fine; `96/6 = 16` is fine. However at non-standard ppq values this can produce non-integers.
**How to avoid:** Use `Math.round()` in `gridTicksForValue()`. Store the computed grid value once before the quantize loop, not inside it.
**Warning signs:** Notes drift slightly after multiple quantize operations.

### Pitfall 5: Chord Strip Layout Breaking Total Height
**What goes wrong:** Adding the chord strip increases total EDITOR_HEIGHT, causing the piano roll to overflow or clip.
**Why it happens:** The total editor is fixed at `EDITOR_HEIGHT = 700`. Chord strip (24px) and velocity lane (~80px) must be subtracted from the note grid height, not added to the total.
**How to avoid:** The formula is: `canvasHeight = EDITOR_HEIGHT - toolbarHeight - timelineHeight - (chordStripVisible ? 24 : 0) - velocityLaneHeight - statusBarHeight`. Recalculate `canvasHeight` dynamically based on visible panels. Pass the updated `canvasHeight` to `PianoRollCanvas`, `PianoKeysSidebar`, and `VelocityLane`.
**Warning signs:** Piano roll canvas height changes when toggles are flipped; scroll position resets.

### Pitfall 6: Multi-Select Velocity Drift
**What goes wrong:** When dragging multiple velocity stalks, notes with velocity at 0 or 1 get "stuck" and create uneven relative offsets.
**Why it happens:** Clamping `Math.max(0, Math.min(1, ...))` prevents some notes from moving further while others continue.
**How to avoid:** Snapshot all selected note velocities at drag start (`velocitiesAtDragStart`). On each mousemove, compute delta from snapshot + current Y (not from previous Y). This means all notes track the same delta from their starting positions. Clamping is still needed but the delta doesn't accumulate error.
**Warning signs:** Dragging up/down creates uneven velocity spacing between notes that were originally evenly spaced.

---

## Code Examples

### Quantization apply (single undo step via applyBatchEdit)

```typescript
// In QuantizePopover or PianoRollEditor, wired to "Quantize" button:
function applyQuantization(params: QuantizeParams) {
  const project = useProjectStore.getState().project;
  const { selectedTrackIndex, selectedNoteIds } = editStore;
  if (!project || selectedTrackIndex === null) return;

  const currentNotes = project.tracks[selectedTrackIndex].notes;
  const noteIndices = selectedNoteIds.size > 0
    ? Array.from(selectedNoteIds).map(id => parseInt(id.split('-')[1]))
    : currentNotes.map((_, i) => i);

  const updatedNotes = currentNotes.map((note, idx) => {
    if (!noteIndices.includes(idx)) return note;
    return {
      ...note,
      ticks: quantizeNote(note.ticks, params),
    };
  });

  // Single undo step
  editStore.applyBatchEdit(updatedNotes);
}
```

### Chord detection integration in PianoRollEditor

```typescript
// In PianoRollEditor.tsx — memoized chord computation
const detectedChords = useMemo(
  () => chordStripVisible
    ? detectChordsPerBar(notes, ppq, timeSignature)
    : [],
  [notes, ppq, timeSignature, chordStripVisible]
);

// Click handler: select all notes in the bar
const handleChordClick = useCallback((chord: DetectedChord) => {
  // Select all note indices that belong to this chord's bar
  chord.noteIndices.forEach(idx => {
    const noteId = `${selectedTrackIndex}-${idx}`;
    editStore.selectedNoteIds.add(noteId);
  });
  editStore.set({ selectedNoteIds: new Set(editStore.selectedNoteIds) });
}, [selectedTrackIndex, editStore]);
```

### Velocity lane real-time drag without history spam

```typescript
// Strategy: bypass editStore._history during drag, use projectStore directly
// New editStore action needed:
updateNoteDirectly: (noteIndex: number, updates: Partial<HaydnNote>) => {
  const state = get();
  if (state.selectedTrackIndex === null) return;
  const project = useProjectStore.getState().project;
  if (!project) return;

  const currentNotes = [...project.tracks[state.selectedTrackIndex].notes];
  currentNotes[noteIndex] = { ...currentNotes[noteIndex], ...updates };
  // Write to project store WITHOUT pushing to _history
  syncToProjectStore(state.selectedTrackIndex, currentNotes);
  // Note: canUndo/canRedo flags unchanged
},

// On mousedown: snapshot velocities
const velocitySnapshot = notes.map(n => n.velocity);

// On mousemove: apply delta from snapshot
editStore.updateNoteDirectly(noteIndex, {
  velocity: Math.max(0, Math.min(1, velocitySnapshot[noteIndex] + deltaVelocity))
});

// On mouseup: push final state to history via updateNote
editStore.updateNote(noteIndex, { velocity: finalVelocity });
```

### VelocityLane canvas render (core)

```typescript
// Stalk rendering inside useEffect:
notes.forEach((note, index) => {
  const noteId = `${trackIndex}-${index}`;
  const isSelected = selectedNoteIds?.has(noteId);

  const x = ticksToX(note.ticks, pixelsPerTick, scrollX);
  const stalkWidth = 4; // px, narrow bars
  const stalkHeight = note.velocity * (laneHeight - 6);
  const y = laneHeight - stalkHeight;

  // Velocity gradient: dim (#1A4A5A-ish) to bright cyan (#00E5FF)
  const lightness = 20 + note.velocity * 60;
  ctx.fillStyle = isSelected
    ? `hsl(186, 100%, 70%)` // bright cyan for selected
    : `hsl(186, 100%, ${lightness}%)`;

  ctx.fillRect(x - stalkWidth / 2, y, stalkWidth, stalkHeight);

  // Tip cap: 3px circle at top of stalk (easier to grab)
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
});
```

### Layout structure in PianoRollEditor (with all three features)

```tsx
// PianoRollEditor return structure:
<div ref={outerRef} className="w-full overflow-hidden" style={{ backgroundColor: '#0D1117' }}>
  {/* Toolbar */}
  <div className="flex items-center gap-2 px-3 py-2 bg-[#131824] border-b border-white/10">
    {/* ... existing controls ... */}
    <QuantizePopover ppq={ppq} onApply={applyQuantization} />
    {/* Velocity toggle */}
    <button onClick={() => setVelocityLaneVisible(v => !v)} ...>Vel</button>
    {/* Chord toggle */}
    <button onClick={() => setChordStripVisible(c => !c)} ...>Chords</button>
  </div>

  {/* Timeline Ruler */}
  <TimelineRuler ... />

  {/* Chord Strip — only when visible */}
  {chordStripVisible && (
    <ChordStrip
      chords={detectedChords}
      scrollX={scrollX}
      zoomX={zoomX}
      ppq={ppq}
      width={canvasWidth}
      onChordClick={handleChordClick}
    />
  )}

  {/* Validation feedback */}
  <ValidationFeedback />

  {/* Main editor area (dynamic height) */}
  <div ref={containerRef} className="relative flex"
    style={{ height: `${noteGridHeight}px`, overflow: 'hidden' }}>
    <PianoKeysSidebar scrollY={scrollY} height={noteGridHeight} zoomY={zoomY} />
    <div className="flex-1 overflow-hidden relative">
      <PianoRollCanvas ... height={noteGridHeight} />
      {/* invisible interaction canvas */}
    </div>
    <NoteInspector ... />
  </div>

  {/* Velocity Lane Divider — only when visible */}
  {velocityLaneVisible && (
    <>
      <div
        className="h-1.5 bg-[#131824] border-y border-white/10 cursor-row-resize hover:bg-cyan-500/20"
        onMouseDown={handleDividerMouseDown}
      />
      <VelocityLane
        notes={notes}
        ppq={ppq}
        scrollX={scrollX}
        zoomX={zoomX}
        selectedNoteIds={selectedNoteIds}
        trackIndex={selectedTrackIndex}
        width={canvasWidth}
        height={velocityLaneHeight}
        onDragStart={handleVelocityDragStart}
      />
    </>
  )}

  {/* Zoom controls — bottom status bar */}
  <div className="flex items-center gap-3 px-4 py-2 bg-[#131824] border-t border-white/10">
    <ZoomControls ... />
    <div className="ml-auto text-xs text-tertiary">{ppq} PPQ</div>
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Velocity editing only in NoteInspector sidebar | Dedicated canvas velocity lane with drag editing | This phase | Standard DAW UX instead of property panel |
| No quantization | Toolbar popover with strength/swing/threshold | This phase | Essential production workflow tool |
| No chord annotations | Auto-detected chord strip from note content | This phase | Immediate harmonic context for composers |

**Note on canvas vs DOM for velocity lane:** The existing project uses Canvas 2D for the piano roll (not SVG, not DOM elements). Stay consistent — VelocityLane should be canvas-based. ChordStrip is text labels and can be DOM (positioned divs) since it doesn't need per-frame rendering.

---

## Open Questions

1. **Velocity drag and undo atomicity**
   - What we know: `editStore.updateNote()` pushes to history on every call. During a velocity drag this would create dozens of entries.
   - What's unclear: The `updateNoteDirectly` action doesn't exist yet — it must be added to `editStore`.
   - Recommendation: Add `updateNoteDirectly` to editStore that writes to projectStore but skips `_history.push()`. This is a small, safe addition; the pattern is already used in `syncToProjectStore`.

2. **ChordStrip multi-select behavior**
   - What we know: Clicking a chord should select notes forming that chord. The `editStore.selectNote()` replaces the selection (single-select behavior).
   - What's unclear: Should chord-click ADD to existing selection or REPLACE it? The requirement says "selects all notes in that bar."
   - Recommendation: Replace selection (call `editStore.clearSelection()` then add each note ID). This is simpler and matches the requirement wording.

3. **Quantize popover open state location**
   - What we know: Popover needs to stay open while user adjusts parameters.
   - What's unclear: Should popover state be local `useState` in toolbar or in a Zustand store?
   - Recommendation: Local `useState` in `PianoRollEditor` (`quantizePopoverOpen`). Same approach used for `showAiEditor` in page.tsx. No persistence needed for popover open state.

4. **Canvas height recalculation when toggling features**
   - What we know: `canvasHeight = EDITOR_HEIGHT - 80` is currently hardcoded. Adding chord strip (24px) and velocity lane (variable) changes this.
   - What's unclear: Whether the existing EDITOR_HEIGHT = 700 constant is sufficient headroom.
   - Recommendation: Make `noteGridHeight` a derived value: `EDITOR_HEIGHT - TOOLBAR_HEIGHT - TIMELINE_HEIGHT - (chordStripVisible ? 24 : 0) - (velocityLaneVisible ? velocityLaneHeight + 6 : 0) - STATUS_BAR_HEIGHT`. Add named constants for each fixed-height zone.

---

## Sources

### Primary (HIGH confidence)
- Verified in project node_modules: `tonal` v6.4.3 — `Chord.detect(['C','E','G'])` returns `['CM', 'Em#5/C']`; `Note.fromMidi(60)` returns `'C4'`; `Note.pitchClass('C4')` returns `'C'`
- `Chord.get('CM')` structure verified: `{ tonic: 'C', type: 'major', quality: 'Major', aliases: [...] }`
- `src/components/PianoRoll/PianoRollCanvas.tsx` — canvas rendering patterns, `ticksToX` coordinate system
- `src/components/PianoRoll/usePianoRollInteractions.ts` — mousedown/mousemove/mouseup drag pattern
- `src/state/editStore.ts` — `applyBatchEdit()`, `updateNote()`, `syncToProjectStore()`, `HistoryManager`
- `src/components/PianoRoll/gridUtils.ts` — `ticksToX`, `xToTicks`, `NOTE_HEIGHT`, `PIANO_KEY_WIDTH`

### Secondary (MEDIUM confidence)
- GitHub tonaljs/tonal — `Chord.detect` API confirmed via npm registry results; function signature and return type verified via direct node execution
- Ardour Manual / Logic Pro documentation — quantization algorithm concepts (strength, swing, threshold); math formulas derived from well-documented DAW conventions
- Standard DAW quantization formula `new = orig + strength × (grid - orig)` verified against multiple sources (Logic Pro, Cubase, Ardour docs describe this behavior consistently)

### Tertiary (LOW confidence)
- WebSearch — velocity lane drag patterns; not verified against authoritative source but confirmed against existing drag pattern in `usePianoRollInteractions.ts`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; tonal API verified via direct execution
- Architecture: HIGH — all patterns derived from existing codebase conventions
- Chord detection algorithm: HIGH — verified tonal API in project node_modules
- Quantization algorithm: MEDIUM — math formula well-established in DAW literature, not verified against single official source
- Pitfalls: HIGH — most derived from direct code inspection of editStore.ts and canvas render patterns

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (tonal is stable; Next.js/React stack is stable)
