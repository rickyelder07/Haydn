/**
 * Pure quantization math utilities for the Piano Roll editor.
 * No side effects — all functions take params and return new values.
 */

export interface QuantizeParams {
  gridTicks: number;     // e.g. ppq/4 for 1/16 note
  strength: number;      // 0–100 (percentage toward grid)
  thresholdPct: number;  // 0–100 (skip notes already within this % of grid)
  swingPct: number;      // 50–75 (50 = no swing)
}

/**
 * Quantize a single note's start tick position.
 *
 * Algorithm:
 * 1. Find nearest grid line
 * 2. Determine if offbeat (for swing)
 * 3. Apply swing offset to the grid position
 * 4. Threshold guard — if note is already close enough, leave it alone
 * 5. Strength interpolation — pull note toward (swung) grid
 */
export function quantizeNote(originalTicks: number, params: QuantizeParams): number {
  const { gridTicks, strength, thresholdPct, swingPct } = params;

  // 1. Find nearest grid line
  const gridPosition = Math.round(originalTicks / gridTicks);
  const nearestGrid = gridPosition * gridTicks;

  // 2. Determine if offbeat (odd grid positions get swing applied)
  const isOnOddGrid = gridPosition % 2 !== 0;

  // 3. Apply swing offset: swing shifts offbeats later in the beat
  //    swingPct of 50 = straight (no shift), 75 = maximum shuffle
  const swingOffset = isOnOddGrid ? ((swingPct - 50) / 50) * gridTicks : 0;
  const swungGrid = nearestGrid + swingOffset;

  // 4. Threshold guard — if note is already close enough, leave unchanged
  const distanceToGrid = Math.abs(originalTicks - swungGrid);
  const threshold = (thresholdPct / 100) * gridTicks;
  if (distanceToGrid < threshold) {
    return originalTicks;
  }

  // 5. Strength interpolation — partial pull toward grid
  return Math.round(originalTicks + (strength / 100) * (swungGrid - originalTicks));
}

/**
 * Convert a note value string to tick count for a given PPQ.
 *
 * Supported values:
 *   '1/4'   → one quarter note (ppq)
 *   '1/8'   → one eighth note (ppq/2)
 *   '1/16'  → one sixteenth note (ppq/4)
 *   '1/32'  → one thirty-second note (ppq/8)
 *   '1/4T'  → quarter note triplet
 *   '1/8T'  → eighth note triplet
 *   '1/16T' → sixteenth note triplet
 *
 * Triplet values use Math.round() to avoid floating-point accumulation.
 */
export function gridTicksForValue(ppq: number, value: string): number {
  switch (value) {
    case '1/4':   return ppq;
    case '1/8':   return ppq / 2;
    case '1/16':  return ppq / 4;
    case '1/32':  return ppq / 8;
    case '1/4T':  return Math.round(ppq * 2 / 3);
    case '1/8T':  return Math.round(ppq / 3);
    case '1/16T': return Math.round(ppq / 6);
    default:      return ppq / 4;
  }
}
