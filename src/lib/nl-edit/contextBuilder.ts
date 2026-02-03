import type { HaydnNote } from '@/lib/midi/types';
import type { MIDIContext } from '@/app/api/nl-edit/route';
import { useProjectStore } from '@/state/projectStore';
import { useValidationStore } from '@/state/validationStore';
import { useEditStore } from '@/state/editStore';

/**
 * Build compact MIDI context for GPT-4o prompts.
 *
 * Serializes current track with full note data, other tracks as summaries,
 * project metadata, and optional theory validation state.
 *
 * @throws Error if no project loaded or no track selected
 */
export function buildMIDIContext(): MIDIContext {
  const projectState = useProjectStore.getState();
  const validationState = useValidationStore.getState();
  const editState = useEditStore.getState();

  const project = projectState.project;

  // Validate project exists
  if (!project) {
    throw new Error('No project loaded');
  }

  // Validate track selected
  const selectedTrackIndex = editState.selectedTrackIndex;
  if (selectedTrackIndex === null) {
    throw new Error('No track selected');
  }

  // Validate track index is valid
  if (selectedTrackIndex < 0 || selectedTrackIndex >= project.tracks.length) {
    throw new Error('Invalid track selection');
  }

  const currentTrack = project.tracks[selectedTrackIndex];

  // Build other tracks summaries (exclude current track)
  const otherTracks = project.tracks
    .filter((_, index) => index !== selectedTrackIndex)
    .map((track) => {
      // Calculate note range
      const midiValues = track.notes.map((note) => note.midi);
      const lowestNote = midiValues.length > 0 ? Math.min(...midiValues) : 0;
      const highestNote = midiValues.length > 0 ? Math.max(...midiValues) : 0;

      return {
        name: track.name,
        noteCount: track.notes.length,
        lowestNote,
        highestNote,
        instrumentName: track.instrumentName,
      };
    });

  // Calculate total ticks (max note end time)
  let totalTicks = 0;
  for (const track of project.tracks) {
    for (const note of track.notes) {
      const endTick = note.ticks + note.durationTicks;
      if (endTick > totalTicks) {
        totalTicks = endTick;
      }
    }
  }

  // Get tempo and time signature
  const tempo = project.metadata.tempos[0]?.bpm || 120;
  const timeSignature = project.metadata.timeSignatures[0];
  const timeSignatureNumerator = timeSignature?.numerator || 4;
  const timeSignatureDenominator = timeSignature?.denominator || 4;

  // Get key signature if available
  const keySignature = project.metadata.keySignatures[0];
  const keySignatureData = keySignature
    ? {
        key: keySignature.key,
        scale: keySignature.scale,
      }
    : undefined;

  // Build theory validation context if enabled
  const theoryValidation = validationState.enabled
    ? {
        enabled: true,
        genre: validationState.activeGenre,
        currentScale: validationState.currentScaleName || undefined,
        recentErrors:
          validationState.lastErrors.length > 0
            ? validationState.lastErrors
            : undefined,
      }
    : undefined;

  // Build MIDI context
  const context: MIDIContext = {
    currentTrack: {
      name: currentTrack.name,
      channel: currentTrack.channel,
      instrumentNumber: currentTrack.instrumentNumber,
      instrumentName: currentTrack.instrumentName,
      notes: [...currentTrack.notes], // Clone notes array
      controlChanges: [...currentTrack.controlChanges], // Clone CC array
    },
    otherTracks,
    project: {
      tempo,
      timeSignatureNumerator,
      timeSignatureDenominator,
      ppq: project.metadata.ppq,
      keySignature: keySignatureData,
    },
    theoryValidation,
  };

  return context;
}
