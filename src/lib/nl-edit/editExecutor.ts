import type { EditOperation, EditResponse } from '@/lib/openai/schemas';
import type { HaydnNote } from '@/lib/midi/types';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { useValidationStore } from '@/state/validationStore';

/**
 * Result of executing edit operations
 */
export interface ExecutionResult {
  success: boolean;
  appliedOps: number;
  errors: string[];
}

/**
 * Execute structured edit operations from GPT-4o response.
 *
 * Applies all operations to project state using editStore actions to preserve
 * undo/redo support. Continues on errors (partial execution allowed).
 *
 * @param operations Array of edit operations to execute
 * @returns ExecutionResult with success flag, applied count, and errors
 */
export function executeEditOperations(
  operations: EditOperation[]
): ExecutionResult {
  const projectState = useProjectStore.getState();
  const editState = useEditStore.getState();
  const validationState = useValidationStore.getState();

  const errors: string[] = [];
  let appliedOps = 0;

  // Validate project and track
  const project = projectState.project;
  const selectedTrackIndex = editState.selectedTrackIndex;

  if (!project) {
    errors.push('No project loaded');
    return { success: false, appliedOps: 0, errors };
  }

  if (selectedTrackIndex === null) {
    errors.push('No track selected');
    return { success: false, appliedOps: 0, errors };
  }

  if (selectedTrackIndex < 0 || selectedTrackIndex >= project.tracks.length) {
    errors.push('Invalid track selection');
    return { success: false, appliedOps: 0, errors };
  }

  const track = project.tracks[selectedTrackIndex];

  // Execute each operation
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];

    try {
      switch (operation.operation) {
        case 'add_notes': {
          const notes = operation.parameters.notes;
          if (!notes || notes.length === 0) {
            errors.push(
              `Operation ${i + 1} (add_notes): Missing or empty notes array`
            );
            continue;
          }

          // Add each note using editStore action (preserves undo/redo)
          for (const note of notes) {
            editState.addNote(note);
          }

          appliedOps++;
          break;
        }

        case 'remove_notes': {
          const noteIndices = operation.parameters.noteIndices;
          if (!noteIndices || noteIndices.length === 0) {
            errors.push(
              `Operation ${i + 1} (remove_notes): Missing or empty noteIndices array`
            );
            continue;
          }

          // Sort indices in reverse order to avoid index shifting during deletion
          const sortedIndices = [...noteIndices].sort((a, b) => b - a);

          // Delete each note by index
          for (const index of sortedIndices) {
            if (index < 0 || index >= track.notes.length) {
              errors.push(
                `Operation ${i + 1} (remove_notes): Invalid note index ${index}`
              );
              continue;
            }
            editState.deleteNote(index);
          }

          appliedOps++;
          break;
        }

        case 'modify_notes': {
          const modifications = operation.parameters.modifications;
          if (!modifications || modifications.length === 0) {
            errors.push(
              `Operation ${i + 1} (modify_notes): Missing or empty modifications array`
            );
            continue;
          }

          // Apply each modification
          for (const mod of modifications) {
            if (mod.noteIndex < 0 || mod.noteIndex >= track.notes.length) {
              errors.push(
                `Operation ${i + 1} (modify_notes): Invalid note index ${mod.noteIndex}`
              );
              continue;
            }

            editState.updateNote(mod.noteIndex, mod.updates);
          }

          appliedOps++;
          break;
        }

        case 'transpose': {
          const semitones = operation.parameters.semitones;
          if (semitones === undefined) {
            errors.push(
              `Operation ${i + 1} (transpose): Missing semitones parameter`
            );
            continue;
          }

          const startTick = operation.parameters.startTick ?? 0;
          const endTick = operation.parameters.endTick ?? Infinity;

          // Filter notes in range
          const notesToTranspose = track.notes
            .map((note, index) => ({ note, index }))
            .filter(
              ({ note }) => note.ticks >= startTick && note.ticks < endTick
            );

          // Transpose each note using updateNote (preserves undo/redo)
          for (const { note, index } of notesToTranspose) {
            const newMidi = Math.max(0, Math.min(127, note.midi + semitones));
            editState.updateNote(index, { midi: newMidi });
          }

          appliedOps++;
          break;
        }

        case 'change_tempo': {
          const newTempo = operation.parameters.newTempo;
          if (newTempo === undefined) {
            errors.push(
              `Operation ${i + 1} (change_tempo): Missing newTempo parameter`
            );
            continue;
          }

          // Update tempo in project metadata
          if (project.metadata.tempos.length === 0) {
            // Create initial tempo if none exists
            project.metadata.tempos = [{ ticks: 0, bpm: newTempo }];
          } else {
            // Update first tempo
            project.metadata.tempos[0].bpm = newTempo;
          }

          // Trigger project update
          projectState.setProject({ ...project });

          appliedOps++;
          break;
        }

        case 'change_key': {
          const newKey = operation.parameters.newKey;
          const newScale = operation.parameters.newScale;

          if (!newKey || !newScale) {
            errors.push(
              `Operation ${i + 1} (change_key): Missing newKey or newScale parameter`
            );
            continue;
          }

          // Update key signature in project metadata
          if (project.metadata.keySignatures.length === 0) {
            // Create initial key signature if none exists
            project.metadata.keySignatures = [
              { ticks: 0, key: newKey, scale: newScale },
            ];
          } else {
            // Update first key signature
            project.metadata.keySignatures[0].key = newKey;
            project.metadata.keySignatures[0].scale = newScale;
          }

          // Trigger project update
          projectState.setProject({ ...project });

          // Update validation store scale info if validation enabled
          if (validationState.enabled) {
            validationState.updateScaleInfo(
              project.metadata.keySignatures,
              0
            );
          }

          appliedOps++;
          break;
        }

        default: {
          errors.push(
            `Operation ${i + 1}: Unknown operation type ${(operation as any).operation}`
          );
        }
      }
    } catch (error) {
      errors.push(
        `Operation ${i + 1} (${operation.operation}): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    success: errors.length === 0,
    appliedOps,
    errors,
  };
}
