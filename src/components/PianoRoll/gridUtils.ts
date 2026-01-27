// Grid calculation utilities for coordinate conversion between MIDI and canvas pixel space

// Constants
export const NOTE_HEIGHT = 12; // pixels per semitone row
export const DEFAULT_PIXELS_PER_TICK = 0.1; // at zoom 1.0, 480 ticks = 48px
export const MIDI_MIN = 0;
export const MIDI_MAX = 127;
export const PIANO_KEY_WIDTH = 60; // pixels for sidebar

// Grid line type
export interface GridLine {
  position: number;
  type: 'bar' | 'beat' | 'subdivision';
  label?: string;
}

/**
 * Convert tick position to canvas X coordinate
 */
export function ticksToX(ticks: number, pixelsPerTick: number, scrollX: number): number {
  return ticks * pixelsPerTick - scrollX;
}

/**
 * Convert canvas X to ticks (for click-to-place)
 */
export function xToTicks(x: number, pixelsPerTick: number, scrollX: number): number {
  return (x + scrollX) / pixelsPerTick;
}

/**
 * Convert MIDI note number to canvas Y
 * Higher MIDI = higher on screen (invert Y axis)
 */
export function midiToY(midi: number, scrollY: number): number {
  return (MIDI_MAX - midi) * NOTE_HEIGHT - scrollY;
}

/**
 * Convert canvas Y to MIDI note number
 * Clamps to 0-127 range
 */
export function yToMidi(y: number, scrollY: number): number {
  const midi = MIDI_MAX - Math.floor((y + scrollY) / NOTE_HEIGHT);
  return Math.max(MIDI_MIN, Math.min(MIDI_MAX, midi));
}

/**
 * Determine snap resolution based on zoom level
 * Zoomed out: snap to beats (ppq ticks)
 * Zoomed in: snap to 16th notes (ppq/4 ticks)
 * Very zoomed in: snap to 32nd notes (ppq/8 ticks)
 */
export function getSnapTicks(ppq: number, pixelsPerTick: number): number {
  // At default zoom (0.1), a beat (480 ticks) = 48px
  // Threshold: if pixels per beat < 30px, use beat snap
  // if pixels per beat < 120px, use 16th note snap
  // otherwise use 32nd note snap

  const pixelsPerBeat = ppq * pixelsPerTick;

  if (pixelsPerBeat < 30) {
    return ppq; // Snap to beats
  } else if (pixelsPerBeat < 120) {
    return ppq / 4; // Snap to 16th notes
  } else {
    return ppq / 8; // Snap to 32nd notes
  }
}

/**
 * Round ticks to nearest snap value
 */
export function snapToGrid(ticks: number, snapTicks: number): number {
  return Math.round(ticks / snapTicks) * snapTicks;
}

/**
 * Generate grid lines for canvas rendering
 * Vertical lines: bar lines (bold), beat lines (medium), subdivision lines (light)
 * Horizontal lines: one per semitone, with C notes highlighted
 */
export function getGridLines(
  viewportWidth: number,
  viewportHeight: number,
  pixelsPerTick: number,
  scrollX: number,
  scrollY: number,
  ppq: number,
  timeSignature: { numerator: number; denominator: number }
): { vertical: GridLine[]; horizontal: GridLine[] } {
  const vertical: GridLine[] = [];
  const horizontal: GridLine[] = [];

  // Calculate ticks per bar
  // denominator = 4 means quarter notes, denominator = 8 means eighth notes
  // For 4/4: ticks per bar = 4 * ppq
  // For 3/4: ticks per bar = 3 * ppq
  // For 6/8: ticks per bar = 6 * (ppq / 2) = 3 * ppq
  const ticksPerBeat = ppq * (4 / timeSignature.denominator);
  const ticksPerBar = ticksPerBeat * timeSignature.numerator;

  // Determine subdivision visibility based on zoom
  const pixelsPerBeat = ticksPerBeat * pixelsPerTick;
  const showSubdivisions = pixelsPerBeat >= 80; // Show 16th notes when zoomed in enough

  // Calculate visible tick range
  const startTick = Math.floor(scrollX / pixelsPerTick);
  const endTick = Math.ceil((scrollX + viewportWidth) / pixelsPerTick);

  // Generate vertical grid lines
  // Start from the first bar boundary before visible area
  const firstBarTick = Math.floor(startTick / ticksPerBar) * ticksPerBar;

  for (let tick = firstBarTick; tick <= endTick; tick += ticksPerBeat) {
    const x = ticksToX(tick, pixelsPerTick, scrollX);

    if (x < -10 || x > viewportWidth + 10) continue;

    // Determine line type
    if (tick % ticksPerBar === 0) {
      // Bar line
      const barNumber = Math.floor(tick / ticksPerBar) + 1;
      vertical.push({
        position: x,
        type: 'bar',
        label: `${barNumber}`
      });
    } else {
      // Beat line
      vertical.push({
        position: x,
        type: 'beat'
      });
    }
  }

  // Add subdivision lines if zoomed in enough
  if (showSubdivisions) {
    const subdivisionTicks = ticksPerBeat / 4; // 16th notes
    for (let tick = firstBarTick; tick <= endTick; tick += subdivisionTicks) {
      const x = ticksToX(tick, pixelsPerTick, scrollX);

      if (x < -10 || x > viewportWidth + 10) continue;

      // Skip if this is already a beat or bar line
      if (tick % ticksPerBeat === 0) continue;

      vertical.push({
        position: x,
        type: 'subdivision'
      });
    }
  }

  // Generate horizontal grid lines (one per semitone)
  const startMidi = yToMidi(viewportHeight, scrollY);
  const endMidi = yToMidi(0, scrollY);

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const y = midiToY(midi, scrollY);

    if (y < -10 || y > viewportHeight + 10) continue;

    // Highlight C notes (midi % 12 === 0)
    const isC = midi % 12 === 0;
    horizontal.push({
      position: y,
      type: isC ? 'beat' : 'subdivision',
      label: isC ? getNoteLabel(midi) : undefined
    });
  }

  return { vertical, horizontal };
}

/**
 * Get note label (e.g., "C4", "C#5")
 */
function getNoteLabel(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}
