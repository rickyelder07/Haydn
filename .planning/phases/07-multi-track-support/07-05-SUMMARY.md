---
phase: 07-multi-track-support
plan: 05
subsystem: piano-roll-editor
tags:
  - multi-track
  - ghost-notes
  - ui
  - canvas-rendering
dependency_graph:
  requires:
    - 07-01 (trackUIStore with ghostNotesVisible state)
  provides:
    - ghost-note-rendering
    - multi-track-context-visualization
  affects:
    - piano-roll-canvas
    - piano-roll-editor
    - toolbar-ui
tech_stack:
  added: []
  patterns:
    - layered-canvas-rendering
    - per-track-color-coding
    - alpha-compositing
key_files:
  created: []
  modified:
    - src/components/PianoRoll/PianoRollCanvas.tsx
    - src/components/PianoRoll/PianoRollEditor.tsx
decisions:
  - decision: Inline toolbar integration instead of separate Toolbar.tsx component
    rationale: Existing architecture has toolbar integrated in PianoRollEditor.tsx, not as separate component
    impact: Toolbar button added directly to inline toolbar section after theory controls
  - decision: Simple rectangle rendering for ghost notes
    rationale: Avoid expensive rounded corner drawing for background elements
    impact: Ghost notes render as flat rectangles, selected track notes keep rounded corners and glow
  - decision: Ghost notes render before selected track
    rationale: Canvas layering puts ghost notes behind so selected notes appear on top
    impact: Z-order ensures visual hierarchy (ghost notes = context, selected track = focus)
metrics:
  duration: 4.7 min
  tasks_completed: 3
  files_modified: 2
  commits: 3
  completed_date: 2026-02-09
---

# Phase 07 Plan 05: Ghost Notes Rendering Summary

**One-liner:** Piano roll renders semi-transparent ghost notes from non-selected tracks using per-track colors for multi-track context visibility.

## Objective Achieved

Extended PianoRollCanvas to render ghost notes from all tracks with per-track color coding and opacity control. Users can now see context from all tracks while editing a selected track, with visual distinction between the selected track (full opacity, green selection, rounded corners) and background tracks (30% opacity, per-track colors, simple rectangles).

## What Was Built

### Task 1: Ghost Note Rendering in PianoRollCanvas
**Commit:** `02a85fc`

Added ghost note rendering capability to PianoRollCanvas component:
- Extended `PianoRollCanvasProps` interface with `allTracks` and `ghostNotesVisible` optional props
- Imported `getTrackColor` and `GHOST_NOTE_OPACITY` from trackColors constants
- Implemented ghost note rendering loop that:
  - Runs before selected track notes (renders behind)
  - Skips selected track to avoid duplicate rendering
  - Uses `GHOST_NOTE_OPACITY` (0.3) for semi-transparent appearance
  - Applies per-track colors via `getTrackColor(trackIndex)`
  - Uses simple rectangle rendering (no rounded corners) for performance
  - Includes viewport culling to skip off-screen notes
  - Resets `globalAlpha` to 1.0 after ghost rendering
- Added `allTracks` and `ghostNotesVisible` to useEffect dependency array for reactivity

### Task 2: Data Pipeline from PianoRollEditor
**Commit:** `07e2637`

Connected PianoRollEditor to provide ghost note data to canvas:
- Imported `useTrackUIStore` to access ghost visibility state
- Retrieved `ghostNotesVisible` boolean from store
- Built `allTracks` array from `project.tracks` with structure: `{ notes, trackIndex }[]`
- Passed `allTracks` and `ghostNotesVisible` props to PianoRollCanvas component
- Data flows on every render, enabling immediate reactivity to toggle changes

### Task 3: Ghost Notes Toggle in Toolbar
**Commit:** `fa22451`

Added user control for ghost note visibility:
- Retrieved `setGhostNotesVisible` action from trackUIStore
- Added toggle button to inline toolbar after theory controls
- Button features:
  - Eye icon when active, eye-off icon when inactive
  - Blue background (bg-blue-100 text-blue-700) when enabled
  - Gray background (bg-gray-700) when disabled
  - Hover state for better UX
  - Tooltip: "Show other tracks" / "Hide other tracks"
  - Inline SVG icons for visual clarity
- Clicking button immediately updates `ghostNotesVisible` state, triggering re-render

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] No separate Toolbar.tsx component**
- **Found during:** Task 3 planning
- **Issue:** Plan referenced `src/components/PianoRoll/Toolbar.tsx` which doesn't exist. Toolbar is integrated inline within PianoRollEditor.tsx (lines 180-241).
- **Fix:** Added ghost notes toggle directly to inline toolbar in PianoRollEditor.tsx after theory controls instead of creating separate Toolbar.tsx component.
- **Files modified:** src/components/PianoRoll/PianoRollEditor.tsx
- **Commit:** fa22451
- **Rationale:** Existing architecture uses inline toolbar pattern. Creating separate component would be unnecessary refactoring outside plan scope.

## Technical Implementation

### Ghost Note Rendering Algorithm

```typescript
// Render ghost notes BEFORE selected track (behind in z-order)
if (ghostNotesVisible && allTracks) {
  allTracks.forEach(({ notes: ghostNotes, trackIndex: ghostTrackIndex }) => {
    if (ghostTrackIndex === trackIndex) return; // Skip selected track

    const trackColor = getTrackColor(ghostTrackIndex);
    ctx.globalAlpha = GHOST_NOTE_OPACITY; // 0.3

    ghostNotes.forEach((note) => {
      // Calculate position and size
      const x = ticksToX(note.ticks, pixelsPerTick, scrollX);
      const endX = ticksToX(note.ticks + note.durationTicks, pixelsPerTick, scrollX);
      const y = midiToY(note.midi, scrollY, zoomY);
      let noteWidth = endX - x;
      if (noteWidth < 3) noteWidth = 3;

      // Viewport culling
      if (x + noteWidth < 0 || x > width) return;
      if (y + NOTE_HEIGHT * zoomY < 0 || y > height) return;

      // Simple rectangle rendering (no rounded corners)
      ctx.fillStyle = trackColor;
      ctx.fillRect(x, y, noteWidth, NOTE_HEIGHT * zoomY);
    });
  });

  ctx.globalAlpha = 1.0; // Reset for selected track
}
```

### Performance Characteristics

- **Viewport culling:** Off-screen notes skipped to avoid unnecessary drawing
- **Simple rendering:** Ghost notes use `fillRect` (no path operations) for speed
- **Alpha compositing:** Single `globalAlpha` set per track, reset once after loop
- **Early return:** Selected track skipped in ghost loop to avoid duplicate rendering
- **Color cycling:** `getTrackColor(trackIndex % 12)` provides unlimited track support

### Visual Hierarchy

1. **Background layer:** Grid, scale highlighting
2. **Ghost note layer:** Semi-transparent (0.3 opacity), per-track colors, simple rectangles
3. **Selected track layer:** Full opacity, velocity-based coloring, rounded corners, selection glow
4. **Playhead layer:** Red vertical line

## Verification Results

### TypeScript Compilation
✅ **PASSED** - No errors in modified files
- PianoRollCanvas.tsx: Clean
- PianoRollEditor.tsx: Clean
- Full project check: No new errors introduced

### Build Verification
✅ **PASSED** - Compilation successful
- Next.js compilation: "✓ Compiled successfully in 10.9s"
- One pre-existing ESLint warning in usePianoRollInteractions.ts (unrelated)
- Build export error pre-exists (Next.js config issue, not related to changes)

### Must-Haves Verification
✅ **Piano roll shows selected track notes at full opacity**
- Selected track renders after ghost notes with globalAlpha = 1.0
- Existing velocity-based coloring and selection glow preserved

✅ **Non-selected track notes render as semi-transparent ghost notes**
- Ghost notes render at GHOST_NOTE_OPACITY = 0.3
- globalAlpha correctly reset after ghost rendering

✅ **Ghost notes use distinct colors per track**
- Each track gets color from TRACK_COLORS palette via getTrackColor()
- 12-color cycling palette provides visual distinction

✅ **Ghost notes can be toggled on/off via toolbar**
- Toggle button added to toolbar with eye icons
- ghostNotesVisible state from trackUIStore controls rendering
- Immediate reactivity on button click

✅ **Clicking ghost notes does not select them or switch tracks**
- Mouse hit-testing only checks `notes` array (selected track)
- Ghost notes not in `notes` array, so clicks pass through to canvas
- No modifications needed to mouse handling logic

### Key Links Verification
✅ **PianoRollCanvas → trackColors import**
```typescript
import { getTrackColor, GHOST_NOTE_OPACITY } from '@/lib/constants/trackColors';
```

✅ **PianoRollEditor → trackUIStore usage**
```typescript
import { useTrackUIStore } from '@/state/trackUIStore';
const { ghostNotesVisible, setGhostNotesVisible } = useTrackUIStore();
```

## Success Criteria

✅ **When ghost notes enabled, all tracks visible in piano roll**
- allTracks array includes all project tracks
- Ghost rendering loop processes all tracks except selected

✅ **Selected track notes are full opacity with existing styling**
- Selected track renders after ghost notes with globalAlpha = 1.0
- Rounded corners, velocity coloring, selection glow all preserved

✅ **Non-selected tracks are 30% opacity with distinct colors**
- GHOST_NOTE_OPACITY = 0.3 applied via globalAlpha
- getTrackColor(trackIndex) provides unique color per track

✅ **Ghost toggle in toolbar changes visibility immediately**
- setGhostNotesVisible updates state synchronously
- Canvas re-renders on state change via useEffect dependency

✅ **Mouse interactions only affect selected track notes**
- Hit-testing only checks `notes` array (selected track)
- Ghost notes in `allTracks` not included in interaction logic

## Integration Points

### Consumes
- `trackUIStore.ghostNotesVisible` - Boolean toggle state
- `trackUIStore.setGhostNotesVisible` - State update action
- `trackColors.getTrackColor()` - Per-track color mapping
- `trackColors.GHOST_NOTE_OPACITY` - Transparency constant
- `projectStore.project.tracks` - All track data for ghost rendering

### Provides
- Multi-track context visualization in piano roll
- User control over ghost note visibility
- Per-track color-coded note display

### Affects
- Piano roll visual density (more notes visible when enabled)
- Editing context (users see harmonic/rhythmic relationships across tracks)
- Performance (rendering all tracks instead of one)

## Known Limitations

1. **No interaction with ghost notes:** Clicking ghost notes does nothing (by design). Future enhancement could allow ghost note clicks to switch selected track.

2. **Performance with many tracks:** Rendering all tracks may impact performance on projects with 10+ tracks with dense note data. Future optimization: render only visible tracks based on viewport.

3. **No ghost note filtering:** All tracks render as ghosts regardless of mute/solo state. Future enhancement: respect track audibility state from trackUIStore.

4. **No per-track ghost opacity:** All ghost notes use same 0.3 opacity. Future enhancement: allow user-configurable opacity per track or globally.

## Self-Check: PASSED

### Created Files
None - All modifications to existing files

### Modified Files
✅ **FOUND:** src/components/PianoRoll/PianoRollCanvas.tsx
✅ **FOUND:** src/components/PianoRoll/PianoRollEditor.tsx

### Commits
✅ **FOUND:** 02a85fc - feat(07-05): add ghost note rendering to PianoRollCanvas
✅ **FOUND:** 07e2637 - feat(07-05): pass allTracks and ghostNotesVisible to PianoRollCanvas
✅ **FOUND:** fa22451 - feat(07-05): add ghost notes toggle to piano roll toolbar

All claims verified. Summary accurately reflects completed work.
