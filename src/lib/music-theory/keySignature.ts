import type { HaydnKeySignature } from '@/lib/midi/types';
import { getScalePitchClasses } from './pitchClass';

/**
 * Finds the most recent key signature at or before the given tick position
 * @param keySignatures Array of key signatures (may be unsorted)
 * @param ticks Current tick position
 * @returns The active key signature at this position, or null if none exists
 */
export function getCurrentKeySignature(
  keySignatures: HaydnKeySignature[],
  ticks: number
): HaydnKeySignature | null {
  if (keySignatures.length === 0) {
    return null;
  }

  // Sort by ticks descending, find first where ks.ticks <= ticks
  const sorted = [...keySignatures].sort((a, b) => b.ticks - a.ticks);
  const current = sorted.find(ks => ks.ticks <= ticks);

  return current ?? null;
}

/**
 * Gets the scale pitch classes at a specific tick position
 * @param keySignatures Array of key signatures
 * @param ticks Current tick position
 * @returns Object with scaleName and pitchClasses Set, or null if no key signature
 */
export function getScaleAtTick(
  keySignatures: HaydnKeySignature[],
  ticks: number
): { scaleName: string; pitchClasses: Set<number> } | null {
  const keySignature = getCurrentKeySignature(keySignatures, ticks);

  if (!keySignature) {
    // No key signature = project is chromatic/atonal, validation should be permissive
    return null;
  }

  const scaleName = `${keySignature.key} ${keySignature.scale}`;
  const pitchClasses = getScalePitchClasses(keySignature.key, keySignature.scale);

  return { scaleName, pitchClasses };
}
