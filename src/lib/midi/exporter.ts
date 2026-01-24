import { Midi } from '@tonejs/midi';
import type { HaydnProject, HaydnTrack } from './types';

/**
 * Export HaydnProject to MIDI binary format
 * Returns Uint8Array suitable for file download
 */
export function exportProjectToMidi(project: HaydnProject): Uint8Array {
  const midi = new Midi();

  // Set header info
  midi.header.name = project.metadata.name || project.originalFileName || 'Untitled';
  // Note: @tonejs/midi doesn't allow setting ppq directly after construction
  // It uses 480 by default which is standard

  // Add tempo events
  // @tonejs/midi uses setTempo for the first, then we'd need to manipulate header directly
  // The library handles most common cases
  if (project.metadata.tempos.length > 0) {
    const firstTempo = project.metadata.tempos[0];
    midi.header.setTempo(firstTempo.bpm, firstTempo.ticks);

    // Add additional tempo changes
    for (let i = 1; i < project.metadata.tempos.length; i++) {
      const tempo = project.metadata.tempos[i];
      midi.header.tempos.push({
        bpm: tempo.bpm,
        ticks: tempo.ticks,
      });
    }
  }

  // Add time signatures
  for (const ts of project.metadata.timeSignatures) {
    midi.header.timeSignatures.push({
      ticks: ts.ticks,
      timeSignature: [ts.numerator, ts.denominator],
    });
  }

  // Add key signatures
  for (const ks of project.metadata.keySignatures) {
    midi.header.keySignatures.push({
      ticks: ks.ticks,
      key: ks.key,
      scale: ks.scale,
    });
  }

  // Add tracks
  for (const trackData of project.tracks) {
    const track = midi.addTrack();
    addTrackData(track, trackData);
  }

  return midi.toArray();
}

/**
 * Add track data to a @tonejs/midi Track
 */
function addTrackData(track: any, trackData: HaydnTrack): void {
  // Set track properties
  track.name = trackData.name;
  track.channel = trackData.channel;

  // Set instrument
  if (track.instrument) {
    track.instrument.number = trackData.instrumentNumber;
    track.instrument.name = trackData.instrumentName;
  }

  // Add notes using ticks for precision
  for (const note of trackData.notes) {
    track.addNote({
      midi: note.midi,
      ticks: note.ticks,
      durationTicks: note.durationTicks,
      velocity: note.velocity,
    });
  }

  // Add control changes
  for (const cc of trackData.controlChanges) {
    track.addCC({
      number: cc.number,
      value: cc.value / 127, // @tonejs/midi expects 0-1 range
      ticks: cc.ticks,
    });
  }
}

/**
 * Trigger browser download of MIDI file
 */
export function downloadMidiFile(data: Uint8Array, filename: string): void {
  // Ensure filename has .mid extension
  const finalFilename = filename.endsWith('.mid') || filename.endsWith('.midi')
    ? filename
    : `${filename}.mid`;

  // Create blob with MIDI mime type
  const blob = new Blob([data as BlobPart], { type: 'audio/midi' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export project and download in one step
 */
export function exportAndDownload(project: HaydnProject, filename?: string): void {
  const midiData = exportProjectToMidi(project);

  // Use original filename or project name
  const exportFilename = filename
    || project.originalFileName?.replace(/\.(musicxml|xml)$/i, '.mid')
    || project.metadata.name
    || 'export';

  downloadMidiFile(midiData, exportFilename);
}

/**
 * Create a minimal valid MIDI file (for testing)
 */
export function createEmptyMidi(name: string = 'New Project'): Uint8Array {
  const midi = new Midi();
  midi.header.name = name;
  midi.header.setTempo(120);
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: [4, 4],
  });

  // Add one empty track
  const track = midi.addTrack();
  track.name = 'Track 1';

  return midi.toArray();
}
