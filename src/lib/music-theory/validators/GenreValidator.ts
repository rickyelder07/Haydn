import type { Validator, ValidationResult, ValidationContext, GenreRules } from '../types';

// Map semitone intervals to musical names
const INTERVAL_NAMES: Record<number, string> = {
  0: 'unison',
  1: 'minor 2nd',
  2: 'major 2nd',
  3: 'minor 3rd',
  4: 'major 3rd',
  5: 'perfect 4th',
  6: 'tritone',
  7: 'perfect 5th',
  8: 'minor 6th',
  9: 'major 6th',
  10: 'minor 7th',
  11: 'major 7th',
};

export class GenreValidator implements Validator {
  name = 'GenreValidator';
  private rules: GenreRules;

  constructor(rules: GenreRules) {
    this.rules = rules;
  }

  validate(context: ValidationContext): ValidationResult {
    // If strictness is permissive, skip validation
    if (this.rules.strictness === 'permissive') {
      return { ok: true };
    }

    const { note, track } = context;

    // Find previous note in track (closest note before this one)
    const previousNote = track.notes
      .filter(n => n.ticks < note.ticks)
      .sort((a, b) => b.ticks - a.ticks)[0]; // Sort descending, take first

    // No previous note = nothing to compare against
    if (!previousNote) {
      return { ok: true };
    }

    // Calculate melodic interval (semitones, modulo 12 for interval class)
    const interval = Math.abs(note.midi - previousNote.midi) % 12;

    // Check if interval is in avoided list
    if (this.rules.avoidedIntervals.includes(interval)) {
      const intervalName = INTERVAL_NAMES[interval] || `${interval} semitones`;

      return {
        ok: false,
        errors: [
          {
            type: 'genre',
            severity: 'warning',
            message: `Interval of ${intervalName} sounds unusual for ${this.rules.displayName} style`,
            technicalDetail: `MIDI ${note.midi} -> ${previousNote.midi} creates ${intervalName} (${interval} semitones), avoided in ${this.rules.name}`,
            affectedMidi: note.midi,
          },
        ],
      };
    }

    return { ok: true };
  }
}
