/**
 * Track color palette for multi-track visualization
 *
 * Colors chosen for:
 * - Good contrast on dark (#1a1a1a) background
 * - Distinguishable from each other (colorblind-friendly)
 * - No conflict with selection green (hue 120) or playhead red
 */

/**
 * WCAG-compliant color palette for tracks
 * 12 colors that cycle for unlimited track support
 */
export const TRACK_COLORS = [
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

/**
 * Get color for a track by index (cycles through palette)
 * @param trackIndex - Zero-based track index
 * @returns Hex color string
 */
export function getTrackColor(trackIndex: number): string {
  return TRACK_COLORS[trackIndex % TRACK_COLORS.length];
}

/**
 * Derive the HSL hue (0-360) from a track's palette color.
 * Used by the piano roll canvas to apply velocity-based lightness
 * variation while still matching the track's identity color.
 */
export function getTrackHue(trackIndex: number): number {
  const hex = getTrackColor(trackIndex);
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;

  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return Math.round(h * 360);
}

/**
 * Opacity for ghost notes (non-selected track notes in piano roll)
 */
export const GHOST_NOTE_OPACITY = 0.3;
