import { Scale, Note } from 'tonal';
import { getCurrentKeySignature } from '../keySignature';
import type { Validator, ValidationResult, ValidationContext } from '../types';

export class ScaleValidator implements Validator {
  name = 'ScaleValidator';

  validate(context: ValidationContext): ValidationResult {
    const { note, project } = context;

    // Get the key signature at this note's tick position
    const keySignature = getCurrentKeySignature(
      project.metadata.keySignatures,
      note.ticks
    );

    // No key signature = permissive (project is chromatic/atonal)
    if (!keySignature) {
      return { ok: true };
    }

    // Build scale name from key signature
    const scaleName = `${keySignature.key} ${keySignature.scale}`;
    const scale = Scale.get(scaleName);

    // Invalid or empty scale = permissive (don't block on bad data)
    if (!scale.notes || scale.notes.length === 0) {
      return { ok: true };
    }

    // Get note's pitch class using chroma for enharmonic equivalence
    const noteName = Note.fromMidi(note.midi);
    const pitchClassName = Note.pitchClass(noteName);
    const noteChroma = Note.chroma(noteName);

    // Check if note's pitch class is in the scale (using chroma comparison)
    const isInScale = scale.notes.some(
      scaleNote => Note.chroma(scaleNote) === noteChroma
    );

    if (isInScale) {
      return { ok: true };
    }

    // Note is not in scale - return error
    return {
      ok: false,
      errors: [
        {
          type: 'scale',
          severity: 'error',
          message: `${pitchClassName} is not in ${scaleName} scale`,
          technicalDetail: `MIDI ${note.midi} pitch class ${noteChroma} not in scale [${scale.notes.map(n => Note.chroma(n)).join(',')}]`,
          affectedMidi: note.midi,
        },
      ],
    };
  }
}
