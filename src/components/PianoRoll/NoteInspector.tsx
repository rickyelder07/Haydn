'use client';

import type { HaydnNote } from '@/lib/midi/types';
import { midiToNoteName, ticksToBarsBeat } from '@/audio/utils/timeConversion';

interface NoteInspectorProps {
  note: HaydnNote | null;
  noteIndex: number | null;
  ppq: number;
  onUpdate: (noteIndex: number, updates: Partial<HaydnNote>) => void;
  onDelete: (noteIndex: number) => void;
}

export function NoteInspector({ note, noteIndex, ppq, onUpdate, onDelete }: NoteInspectorProps) {
  if (!note || noteIndex === null) {
    return (
      <div className="w-48 bg-[#131824] border-l border-white/10 p-4 text-tertiary text-xs flex items-start">
        Select a note to view properties
      </div>
    );
  }

  const noteName = midiToNoteName(note.midi);
  const position = ticksToBarsBeat(note.ticks, ppq);
  const durationBeats = (note.durationTicks / ppq).toFixed(2);
  const velocityPercent = Math.round(note.velocity * 100);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDurationBeats = parseFloat(e.target.value);
    if (!isNaN(newDurationBeats) && newDurationBeats > 0) {
      const newDurationTicks = Math.round(newDurationBeats * ppq);
      onUpdate(noteIndex, { durationTicks: newDurationTicks });
    }
  };

  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVelocity = parseFloat(e.target.value);
    if (!isNaN(newVelocity)) {
      onUpdate(noteIndex, { velocity: newVelocity });
    }
  };

  const handleDelete = () => {
    onDelete(noteIndex);
  };

  return (
    <div className="w-48 bg-[#131824] border-l border-white/10 p-4 text-xs flex flex-col gap-3">
      <div className="text-primary font-semibold border-b border-white/10 pb-2">
        Note Properties
      </div>

      {/* Pitch */}
      <div>
        <label className="block text-tertiary mb-1">Pitch</label>
        <div className="text-primary font-medium">
          {noteName} ({note.midi})
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-tertiary mb-1">Position</label>
        <div className="text-primary font-medium">
          {note.ticks} ticks
        </div>
        <div className="text-tertiary mt-0.5">
          {position}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-tertiary mb-1">Duration (beats)</label>
        <input
          type="number"
          value={durationBeats}
          onChange={handleDurationChange}
          min="0.01"
          step="0.25"
          className="w-full px-2 py-1 bg-[#1A2030] text-primary rounded border border-white/10 focus:border-cyan-500/50 focus:outline-none"
        />
        <div className="text-tertiary mt-1">
          {note.durationTicks} ticks
        </div>
      </div>

      {/* Velocity */}
      <div>
        <label className="block text-tertiary mb-1">
          Velocity ({velocityPercent}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={note.velocity}
          onChange={handleVelocityChange}
          className="w-full accent-cyan-400"
        />
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="mt-2 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors"
      >
        Delete Note
      </button>
    </div>
  );
}
