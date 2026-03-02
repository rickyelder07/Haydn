/**
 * Rhythm/drum track generator
 *
 * Generates drum patterns from genre templates with arousal-based variations.
 * All drum notes go on MIDI channel 9 per General MIDI spec.
 */

import type { HaydnNote } from '@/lib/midi/types';
import { GENRE_TEMPLATES, type SectionType } from './genreTemplates';
import type { StructureSection } from './chordGenerator';

// General MIDI drum note numbers
const GM_DRUMS = {
  KICK: 36,         // Bass Drum 1
  SNARE: 38,        // Acoustic Snare
  HIHAT_CLOSED: 42, // Closed Hi-Hat
  HIHAT_OPEN: 46    // Open Hi-Hat
};

/**
 * Generate drum track from genre templates
 *
 * @param structure - Array of sections with bar counts
 * @param genre - Genre name for template lookup
 * @param ppq - Pulses per quarter note (ticks resolution)
 * @param arousal - Arousal level (-1 to 1), affects pattern density
 * @returns HaydnNote array for drum track (channel 9)
 */
export function generateDrumTrack(
  structure: StructureSection[],
  genre: string,
  ppq: number,
  arousal: number
): HaydnNote[] {
  // Classical has no drums
  if (genre === 'classical') {
    return [];
  }

  const notes: HaydnNote[] = [];

  // Get genre template (default to pop if not found)
  const template = GENRE_TEMPLATES[genre] || GENRE_TEMPLATES.pop;

  let currentTick = 0;
  const ticksPerBar = 4 * ppq; // 4 beats per bar
  const noteDuration = ppq / 4; // 16th note duration

  for (const section of structure) {
    const sectionType = section.section as SectionType;

    // Get drum pattern for this section type (fall back to verse)
    const pattern = template.drumPatterns[sectionType] || template.drumPatterns.verse;

    for (let bar = 0; bar < section.bars; bar++) {
      const barStartTick = currentTick;

      // Select fill pattern for last bar of multi-bar sections
      const isLastBarOfSection = bar === section.bars - 1;
      const useFill = isLastBarOfSection && section.bars >= 2 && template.drumFills.length > 0;
      const activePattern = useFill
        ? template.drumFills[Math.floor(Math.random() * template.drumFills.length)]
        : pattern;

      // Kick drum
      for (const offset of activePattern.kick) {
        const velocity = applyVelocityVariation(0.9, activePattern.velocityVariation);
        notes.push({
          midi: GM_DRUMS.KICK,
          ticks: barStartTick + offset,
          durationTicks: noteDuration,
          velocity
        });
      }

      // Snare drum
      for (const offset of activePattern.snare) {
        const velocity = applyVelocityVariation(0.85, activePattern.velocityVariation);
        notes.push({
          midi: GM_DRUMS.SNARE,
          ticks: barStartTick + offset,
          durationTicks: noteDuration,
          velocity
        });
      }

      // Closed hi-hat
      const hihatOffsets = getHihatOffsetsWithArousal(activePattern.hihat, arousal, ppq);
      for (const offset of hihatOffsets) {
        const velocity = applyVelocityVariation(0.6, activePattern.velocityVariation);
        notes.push({
          midi: GM_DRUMS.HIHAT_CLOSED,
          ticks: barStartTick + offset,
          durationTicks: noteDuration,
          velocity
        });
      }

      // Open hi-hat (accents)
      for (const offset of activePattern.openHihat) {
        const velocity = applyVelocityVariation(0.65, activePattern.velocityVariation);
        notes.push({
          midi: GM_DRUMS.HIHAT_OPEN,
          ticks: barStartTick + offset,
          durationTicks: noteDuration,
          velocity
        });
      }

      // Arousal modifier: Add extra kick hits when arousal > 0.3
      if (arousal > 0.3 && bar % 2 === 0) {
        // Add kick on 8th note subdivisions (every ppq/2)
        const extraKickOffsets = [ppq, ppq * 2.5];
        for (const offset of extraKickOffsets) {
          const velocity = applyVelocityVariation(0.75, activePattern.velocityVariation);
          notes.push({
            midi: GM_DRUMS.KICK,
            ticks: barStartTick + offset,
            durationTicks: noteDuration,
            velocity
          });
        }
      }

      currentTick += ticksPerBar;
    }
  }

  return notes;
}

/**
 * Apply random velocity variation
 */
function applyVelocityVariation(baseVelocity: number, variation: number): number {
  const randomFactor = (Math.random() - 0.5) * 2 * variation;
  const velocity = baseVelocity * (1 + randomFactor);
  // Clamp to valid range [0, 1]
  return Math.max(0, Math.min(1, velocity));
}

/**
 * Modify hi-hat pattern based on arousal level
 */
function getHihatOffsetsWithArousal(
  baseOffsets: number[],
  arousal: number,
  ppq: number
): number[] {
  // Low arousal: reduce to quarter notes only
  if (arousal < -0.3) {
    const quarterNoteOffsets = [0, ppq, ppq * 2, ppq * 3];
    return baseOffsets.filter(offset => quarterNoteOffsets.includes(offset));
  }

  // Normal or high arousal: use full pattern
  return baseOffsets;
}
