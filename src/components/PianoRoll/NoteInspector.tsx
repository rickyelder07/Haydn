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
      <div className="w-48 bg-gray-800 border-l border-gray-700 p-4 text-gray-400 text-xs">
        Select a note to view properties
      </div>
    );
  }

  const noteName = midiToNoteName(note.midi);
  const position = ticksToBarsBeat(note.ticks, ppq);
  const durationBeats = (note.durationTicks / ppq).toFixed(2);
  const velocityPercent = Math.round(note.velocity * 100);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value, 10);
    if (!isNaN(newDuration) && newDuration > 0) {
      onUpdate(noteIndex, { durationTicks: newDuration });
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
    <div className="w-48 bg-gray-800 border-l border-gray-700 p-4 text-xs flex flex-col gap-3">
      <div className="text-gray-200 font-semibold border-b border-gray-700 pb-2">
        Note Properties
      </div>

      {/* Pitch */}
      <div>
        <label className="block text-gray-400 mb-1">Pitch</label>
        <div className="text-gray-200">
          {noteName} ({note.midi})
        </div>
      </div>

      {/* Position */}
      <div>
        <label className="block text-gray-400 mb-1">Position</label>
        <div className="text-gray-200">
          {note.ticks} ticks
        </div>
        <div className="text-gray-500 text-xs">
          {position}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-gray-400 mb-1">Duration</label>
        <input
          type="number"
          value={note.durationTicks}
          onChange={handleDurationChange}
          min="1"
          step="1"
          className="w-full px-2 py-1 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <div className="text-gray-500 text-xs mt-1">
          {durationBeats} beats
        </div>
      </div>

      {/* Velocity */}
      <div>
        <label className="block text-gray-400 mb-1">
          Velocity ({velocityPercent}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={note.velocity}
          onChange={handleVelocityChange}
          className="w-full"
        />
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
      >
        Delete Note
      </button>
    </div>
  );
}
