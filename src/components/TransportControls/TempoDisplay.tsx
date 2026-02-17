'use client';

import { useState, useRef, useEffect } from 'react';

interface TempoDisplayProps {
  tempo: number;
  onTempoChange: (bpm: number) => void;
}

export function TempoDisplay({ tempo, onTempoChange }: TempoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(tempo));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync edit value when tempo prop changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(Math.round(tempo)));
    }
  }, [tempo, isEditing]);

  const enterEditMode = () => {
    setEditValue(String(Math.round(tempo)));
    setIsEditing(true);
  };

  const clamp = (val: number) => Math.max(40, Math.min(240, val));

  const commitEdit = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed)) {
      onTempoChange(clamp(parsed));
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(String(Math.round(tempo)));
    setIsEditing(false);
  };

  // Auto-focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={editValue}
        min={40}
        max={240}
        step={1}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitEdit}
        className="w-16 px-1 py-0.5 text-sm font-mono text-center rounded border border-white/20 bg-white/10 text-white focus:outline-none focus:border-cyan-400"
        aria-label="Tempo in BPM"
      />
    );
  }

  return (
    <button
      onClick={enterEditMode}
      className="text-sm font-mono text-gray-300 hover:text-white hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
      title="Click to edit tempo"
      aria-label={`Tempo: ${Math.round(tempo)} BPM. Click to edit.`}
    >
      {Math.round(tempo)} BPM
    </button>
  );
}
