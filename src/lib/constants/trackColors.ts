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
 * Opacity for ghost notes (non-selected track notes in piano roll)
 */
export const GHOST_NOTE_OPACITY = 0.3;
