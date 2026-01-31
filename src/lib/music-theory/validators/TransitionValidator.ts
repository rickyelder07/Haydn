import { Scale, Note } from 'tonal';
import type { Validator, ValidationResult, ValidationContext } from '../types';

export class TransitionValidator implements Validator {
  name = 'TransitionValidator';

  validate(context: ValidationContext): ValidationResult {
    const { note, track, project } = context;

    // Calculate neighborhood window: +/- ppq * 2 ticks (2 beats)
    const ppq = project.metadata.ppq;
    const windowSize = ppq * 2;
    const minTick = note.ticks - windowSize;
    const maxTick = note.ticks + windowSize;

    // Get notes within the time window, excluding the note being validated
    const neighboringNotes = track.notes.filter(
      n => n !== note && // Exclude the note itself
           n.ticks >= minTick &&
           n.ticks <= maxTick
    );

    // Need at least 3 neighboring notes for reliable scale detection
    if (neighboringNotes.length < 3) {
      return { ok: true };
    }

    // Convert neighboring MIDI notes to note names
    const neighborNoteNames = neighboringNotes.map(n => Note.fromMidi(n.midi));

    // Detect possible scales from the neighboring notes
    const allDetectedScales = Scale.detect(neighborNoteNames);

    // Filter to common/standard scales only (exclude exotic and chromatic scales)
    // This prevents false positives from obscure scales that happen to fit the notes
    // Extract just the scale type (e.g., "C4 major" -> "major")
    const detectedScales = allDetectedScales.filter(scaleName => {
      const scale = Scale.get(scaleName);
      if (!scale.type) return false;

      const scaleType = scale.type.toLowerCase();

      // Exclude chromatic
      if (scaleType.includes('chromatic')) return false;

      // Include only common scale types (exact match)
      const commonTypes = [
        'major',
        'minor',
        'harmonic minor',
        'melodic minor',
        'dorian',
        'phrygian',
        'lydian',
        'mixolydian',
        'aeolian',
        'locrian'
      ];

      return commonTypes.includes(scaleType);
    });

    // No scales detected = not enough musical context
    if (detectedScales.length === 0) {
      return { ok: true };
    }

    // Prioritize major and minor scales over modes
    // If major or minor is detected, only validate against those
    const majorMinorScales = detectedScales.filter(scaleName => {
      const scale = Scale.get(scaleName);
      const scaleType = scale.type?.toLowerCase() || '';
      return scaleType === 'major' || scaleType === 'minor';
    });

    const scalesToCheck = majorMinorScales.length > 0 ? majorMinorScales : detectedScales;

    // Check if the new note fits the prioritized scales
    const newNoteName = Note.fromMidi(note.midi);
    const newNoteChroma = Note.chroma(newNoteName);

    const fitsScales = scalesToCheck.some(scaleName => {
      const scale = Scale.get(scaleName);
      if (!scale.notes || scale.notes.length === 0) {
        return false;
      }
      return scale.notes.some(scaleNote => Note.chroma(scaleNote) === newNoteChroma);
    });

    if (fitsScales) {
      return { ok: true };
    }

    // Note doesn't fit detected context - return warning
    const pitchClassName = Note.pitchClass(newNoteName);
    const primaryScale = scalesToCheck[0]; // Use first prioritized scale for message

    return {
      ok: false,
      errors: [
        {
          type: 'transition',
          severity: 'warning',
          message: `This note may create a jarring transition (surrounding music suggests ${primaryScale})`,
          technicalDetail: `MIDI ${note.midi} (${pitchClassName}) does not fit detected scales: ${detectedScales.join(', ')}`,
          affectedMidi: note.midi,
        },
      ],
    };
  }
}
