# Phase 7: Multi-Track Support - Research

**Researched:** 2026-02-08
**Domain:** Multi-track audio management, React UI patterns, Canvas rendering optimization
**Confidence:** HIGH

## Summary

This phase expands the single-track piano roll editor to support up to 32 tracks with mute/solo controls, drag-and-drop reordering, and ghost note visualization. The existing codebase already has a solid foundation with Zustand state management, Tone.js audio playback, and canvas-based piano roll rendering.

The key technical challenges are: (1) extending the state management to handle per-track mute/solo states that integrate with the audio playback system, (2) implementing drag-and-drop track reordering with dnd-kit, (3) optimizing canvas rendering for up to 5,000 notes across multiple tracks with ghost notes, and (4) modifying the NoteScheduler to respect mute/solo states during playback.

**Primary recommendation:** Extend the existing projectStore with track-level mute/solo state, use Tone.Part's built-in `mute` property for audio control, add dnd-kit for track reordering, and implement batched canvas rendering with offscreen pre-rendering for ghost notes.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.10 | Track state management (mute/solo/selection) | Already used, lightweight, supports multiple stores |
| tone | ^15.1.22 | Audio playback with per-track mute | Already used, Part.mute property handles this natively |
| react | ^19.0.0 | UI components | Already used |

### New Dependencies Required
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.1.0+ | Drag-and-drop foundation | Modern, accessible, React-first DnD library |
| @dnd-kit/sortable | ^8.0.0+ | Sortable list preset | Purpose-built for reorderable lists |
| @dnd-kit/utilities | ^3.2.0+ | CSS transform helpers | Required for smooth drag animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit | react-beautiful-dnd | react-beautiful-dnd is deprecated, dnd-kit is the modern replacement |
| dnd-kit | HTML5 Drag & Drop API | HTML5 DnD has poor mobile support and accessibility |
| Canvas ghost notes | WebGL (PixiJS) | WebGL overkill for 5K notes, 2D Canvas sufficient with optimizations |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── state/
│   └── trackStore.ts        # New: Track-level mute/solo/order state
├── components/
│   └── TrackList/
│       ├── TrackList.tsx    # Extend with mute/solo/reorder
│       ├── TrackItem.tsx    # New: Individual sortable track component
│       ├── TrackControls.tsx # New: Mute/solo inline buttons
│       └── AddTrackModal.tsx # New: Modal for new track creation
│   └── PianoRoll/
│       └── PianoRollCanvas.tsx # Extend with ghost notes
├── audio/
│   └── playback/
│       └── NoteScheduler.ts # Extend: track mute state integration
```

### Pattern 1: Separate Track State Store
**What:** Create a dedicated Zustand store for track-level UI state (mute, solo, order) separate from the project data.
**When to use:** When track playback state is ephemeral (not persisted) and frequently updates independently of project data.
**Example:**
```typescript
// Source: Project patterns from editStore.ts and playbackStore.ts
interface TrackState {
  mutedTracks: Set<number>;      // Track indices that are muted
  soloedTracks: Set<number>;     // Track indices that are soloed
  trackOrder: number[];          // Display order (indices into project.tracks)

  toggleMute: (trackIndex: number) => void;
  toggleSolo: (trackIndex: number) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  resetAllStates: () => void;    // Global reset button
}

// Computed: A track should be heard if:
// 1. No tracks are soloed: track is not muted
// 2. Some tracks are soloed: track is soloed (regardless of mute)
function isTrackAudible(trackIndex: number, state: TrackState): boolean {
  const hasSoloedTracks = state.soloedTracks.size > 0;
  if (hasSoloedTracks) {
    return state.soloedTracks.has(trackIndex);
  }
  return !state.mutedTracks.has(trackIndex);
}
```

### Pattern 2: Tone.Part Mute Integration
**What:** Use Tone.Part's native `mute` property to control whether scheduled notes trigger.
**When to use:** For real-time mute/solo changes during playback without rescheduling.
**Example:**
```typescript
// Source: https://tonejs.github.io/docs/15.0.4/classes/Part.html
// Store Parts by track index for mute control
const trackParts: Map<number, Part> = new Map();

// When scheduling notes, store the Part reference
function scheduleTrack(trackIndex: number, notes: ScheduledNote[]): Part {
  const part = new Part((time, event) => {
    instrument.triggerAttackRelease(event.note, event.duration, time, event.velocity);
  }, notes.map(n => [n.time, n]));
  part.start(0);
  trackParts.set(trackIndex, part);
  return part;
}

// Toggle mute in real-time
function setTrackMuted(trackIndex: number, muted: boolean): void {
  const part = trackParts.get(trackIndex);
  if (part) {
    part.mute = muted; // Tone.Part handles this - callbacks won't fire when muted
  }
}
```

### Pattern 3: dnd-kit Sortable Track List
**What:** Use dnd-kit's sortable preset for accessible drag-and-drop track reordering.
**When to use:** For vertical lists that need reordering with keyboard accessibility.
**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTrackItem({ id, track, index }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TrackItem track={track} index={index} />
    </div>
  );
}

function TrackList({ tracks }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = trackOrder.indexOf(active.id);
      const newIndex = trackOrder.indexOf(over.id);
      reorderTracks(oldIndex, newIndex);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={trackOrder} strategy={verticalListSortingStrategy}>
        {trackOrder.map((trackIndex) => (
          <SortableTrackItem key={trackIndex} id={trackIndex} track={tracks[trackIndex]} index={trackIndex} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 4: Ghost Notes with Canvas Layering
**What:** Render non-selected track notes as semi-transparent "ghost notes" using opacity and distinct colors.
**When to use:** When showing multi-track context in piano roll without cluttering the view.
**Example:**
```typescript
// Source: Canvas optimization patterns from existing PianoRollCanvas.tsx
// Render ghost notes first (behind), then selected track notes (front)
function renderMultiTrackNotes(ctx, allTracks, selectedTrackIndex, ghostNotesVisible) {
  // First pass: Ghost notes (non-selected tracks)
  if (ghostNotesVisible) {
    allTracks.forEach((track, trackIndex) => {
      if (trackIndex === selectedTrackIndex) return;

      const trackColor = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
      ctx.globalAlpha = 0.3; // Ghost note opacity

      track.notes.forEach(note => {
        drawNote(ctx, note, trackColor);
      });
    });
  }

  // Second pass: Selected track notes (full opacity)
  ctx.globalAlpha = 1.0;
  const selectedTrack = allTracks[selectedTrackIndex];
  const selectedColor = TRACK_COLORS[selectedTrackIndex % TRACK_COLORS.length];
  selectedTrack.notes.forEach(note => {
    drawNote(ctx, note, selectedColor);
  });
}
```

### Anti-Patterns to Avoid
- **Storing mute/solo in HaydnProject:** These are playback states, not project data. Keep them in separate ephemeral store.
- **Rescheduling all notes on mute toggle:** Use Tone.Part.mute instead of clearing and re-scheduling.
- **Redrawing all ghost notes every frame:** Pre-render ghost notes to offscreen canvas when track changes, not on every scroll/zoom.
- **Using separate canvas layers for each track:** Compositing overhead makes this slower than batch rendering.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag and drop | Custom mouse event handlers | dnd-kit | Accessibility, touch support, keyboard navigation built-in |
| Track reorder array mutation | Manual splice/insert | arrayMove from @dnd-kit/sortable | Handles edge cases correctly |
| Audio muting | Gain node manipulation | Tone.Part.mute property | Built-in, works mid-playback, no audio glitches |
| Confirmation dialogs | Custom modal logic | Native confirm() or existing modal pattern | Already sufficient for track deletion |
| Color generation | Random color picker | Pre-defined palette | Ensures WCAG contrast and visual distinction |

**Key insight:** The audio layer (Tone.js) already has mute built into Parts. Don't implement gain-based muting or note filtering - just toggle Part.mute. For UI, dnd-kit handles all the complexity of drag-and-drop including accessibility, so don't write custom pointer event handlers.

## Common Pitfalls

### Pitfall 1: Solo Logic Off-By-One
**What goes wrong:** Solo implementation that mutes soloed tracks or doesn't handle "all tracks soloed" case.
**Why it happens:** Confusing "track should be audible" with "track is soloed".
**How to avoid:** Use the explicit formula: if any track is soloed, only soloed tracks play; otherwise, only non-muted tracks play.
**Warning signs:** Clicking solo on a single track produces silence, or muting a soloed track produces unexpected results.

### Pitfall 2: Ghost Note Performance Degradation
**What goes wrong:** Canvas rendering slows to <30fps with many ghost notes from multiple tracks.
**Why it happens:** Redrawing all notes from all tracks on every frame, especially during scroll/zoom.
**How to avoid:**
- Pre-render ghost notes to offscreen canvas on track selection change
- Only redraw selected track notes during scroll/zoom
- Use dirty flag pattern: only regenerate ghost canvas when tracks change
- Consider culling notes outside viewport before drawing
**Warning signs:** Frame drops during scroll, noticeable lag on projects with >1000 total notes.

### Pitfall 3: Mute State Desync During Playback
**What goes wrong:** Toggling mute during playback doesn't take effect until next play.
**Why it happens:** Setting mute on the wrong object (instrument vs Part) or not referencing the active Part.
**How to avoid:** Keep Map<trackIndex, Part> reference and toggle Part.mute directly.
**Warning signs:** Mute button updates visually but audio doesn't change.

### Pitfall 4: Track Order State Drift
**What goes wrong:** Displayed track order doesn't match audio playback order after reordering.
**Why it happens:** Reordering display order without updating audio Part references.
**How to avoid:** Track order is purely visual; audio Parts are keyed by original track index, not display position.
**Warning signs:** After reordering, the "first" track plays audio from a different track.

### Pitfall 5: Modal Dialog Blocking Input
**What goes wrong:** Add track modal doesn't receive keyboard input, or Escape key doesn't close it.
**Why it happens:** Focus management issues with modals in React.
**How to avoid:** Use focus trap pattern, auto-focus first input, handle Escape keydown.
**Warning signs:** Can't tab to modal inputs, clicking outside doesn't close modal.

## Code Examples

Verified patterns from official sources and project codebase:

### Track Store with Mute/Solo
```typescript
// Pattern derived from existing editStore.ts and projectStore.ts
import { create } from 'zustand';

interface TrackUIState {
  mutedTracks: Set<number>;
  soloedTracks: Set<number>;
  trackOrder: number[];
  ghostNotesVisible: boolean;

  toggleMute: (trackIndex: number) => void;
  toggleSolo: (trackIndex: number) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  setGhostNotesVisible: (visible: boolean) => void;
  resetAllStates: () => void;
  initializeOrder: (trackCount: number) => void;
  isTrackAudible: (trackIndex: number) => boolean;
}

export const useTrackUIStore = create<TrackUIState>((set, get) => ({
  mutedTracks: new Set(),
  soloedTracks: new Set(),
  trackOrder: [],
  ghostNotesVisible: true,

  toggleMute: (trackIndex) => set((state) => {
    const newMuted = new Set(state.mutedTracks);
    if (newMuted.has(trackIndex)) {
      newMuted.delete(trackIndex);
    } else {
      newMuted.add(trackIndex);
    }
    return { mutedTracks: newMuted };
  }),

  toggleSolo: (trackIndex) => set((state) => {
    const newSoloed = new Set(state.soloedTracks);
    if (newSoloed.has(trackIndex)) {
      newSoloed.delete(trackIndex);
    } else {
      newSoloed.add(trackIndex);
    }
    return { soloedTracks: newSoloed };
  }),

  reorderTracks: (fromIndex, toIndex) => set((state) => {
    const newOrder = [...state.trackOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    return { trackOrder: newOrder };
  }),

  setGhostNotesVisible: (visible) => set({ ghostNotesVisible: visible }),

  resetAllStates: () => set({
    mutedTracks: new Set(),
    soloedTracks: new Set()
  }),

  initializeOrder: (trackCount) => set({
    trackOrder: Array.from({ length: trackCount }, (_, i) => i),
    mutedTracks: new Set(),
    soloedTracks: new Set()
  }),

  isTrackAudible: (trackIndex) => {
    const state = get();
    if (state.soloedTracks.size > 0) {
      return state.soloedTracks.has(trackIndex);
    }
    return !state.mutedTracks.has(trackIndex);
  },
}));
```

### Accessible Track Color Palette
```typescript
// WCAG-compliant track colors with good contrast on dark background
// Colors chosen for distinguishability including color blindness considerations
export const TRACK_COLORS: readonly string[] = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Purple
] as const;

export function getTrackColor(trackIndex: number): string {
  return TRACK_COLORS[trackIndex % TRACK_COLORS.length];
}

// Ghost note opacity: 0.25-0.35 provides visibility without overwhelming
export const GHOST_NOTE_OPACITY = 0.3;
```

### NoteScheduler Track Mute Integration
```typescript
// Extend existing NoteScheduler.ts
let trackParts: Map<number, Part> = new Map();

export async function scheduleNotes(project: HaydnProject): Promise<void> {
  clearScheduledNotes();
  trackParts.clear();

  // ... existing tempo scheduling ...

  for (let trackIndex = 0; trackIndex < project.tracks.length; trackIndex++) {
    const track = project.tracks[trackIndex];
    if (track.notes.length === 0) continue;

    // ... existing instrument creation ...

    const part = new Part((time, event) => {
      instrument.triggerAttackRelease(event.note, event.duration, time, event.velocity);
    }, scheduledNotes.map(n => [n.time, n]));

    part.start(0);
    scheduledParts.push(part);
    trackParts.set(trackIndex, part); // Store for mute control
  }
}

export function setTrackMuted(trackIndex: number, muted: boolean): void {
  const part = trackParts.get(trackIndex);
  if (part) {
    part.mute = muted;
  }
}

export function updateTrackMuteStates(isAudible: (trackIndex: number) => boolean): void {
  trackParts.forEach((part, trackIndex) => {
    part.mute = !isAudible(trackIndex);
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | dnd-kit | 2022+ | react-beautiful-dnd deprecated, dnd-kit is successor |
| Gain node for mute | Part.mute property | Tone.js 14+ | Cleaner, no audio artifacts on toggle |
| Per-track canvas layers | Single canvas batch render | 2020+ | Better performance, simpler compositing |
| Exclusive solo (radio button) | Non-exclusive solo (checkboxes) | DAW standard | More flexible for mixing workflows |

**Deprecated/outdated:**
- react-beautiful-dnd: Deprecated by Atlassian, use dnd-kit instead
- Mutating audio graph for mute: Use Part.mute or instrument.mute instead

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal ghost note opacity value**
   - What we know: 0.2-0.4 range generally works for semi-transparent overlays
   - What's unclear: Exact value depends on track color contrast and user preference
   - Recommendation: Start with 0.3, consider making it a user preference in future

2. **Maximum tracks performance threshold**
   - What we know: 32 tracks with 5,000 total notes is the requirement
   - What's unclear: Exact point where canvas rendering needs WebGL
   - Recommendation: Implement viewport culling first, measure performance, consider offscreen canvas for ghost notes

3. **Track color assignment strategy**
   - What we know: Need visually distinct colors for 12+ tracks
   - What's unclear: Whether colors should persist per-track or be based on display order
   - Recommendation: Color by original track index for consistency after reordering

## Sources

### Primary (HIGH confidence)
- Existing codebase: projectStore.ts, editStore.ts, NoteScheduler.ts, PianoRollCanvas.tsx - established patterns
- [Tone.js Part documentation](https://tonejs.github.io/docs/15.0.4/classes/Part.html) - mute property behavior
- [dnd-kit Sortable documentation](https://docs.dndkit.com/presets/sortable) - implementation patterns

### Secondary (MEDIUM confidence)
- [Ardour Manual - Muting and Soloing](https://manual.ardour.org/mixing/muting-and-soloing/) - verified DAW solo/mute patterns
- [Canvas optimization MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) - offscreen canvas, batch rendering
- [AG-Grid Canvas Optimization](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) - dirty flag pattern

### Tertiary (LOW confidence)
- General WebSearch results for 2026 color accessibility trends - used for palette considerations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project libraries plus well-documented dnd-kit
- Architecture: HIGH - Patterns derived from existing codebase and verified sources
- Pitfalls: HIGH - Based on documented audio library behavior and canvas performance patterns

**Research date:** 2026-02-08
**Valid until:** 30 days (stable libraries, no major version changes expected)
