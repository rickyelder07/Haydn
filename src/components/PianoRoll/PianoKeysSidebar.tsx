'use client';

import { useEffect, useRef } from 'react';
import { NOTE_HEIGHT, PIANO_KEY_WIDTH, MIDI_MAX, midiToY } from './gridUtils';

interface PianoKeysSidebarProps {
  scrollY: number;
  height: number;
  zoomY?: number;
}

export function PianoKeysSidebar({ scrollY, height, zoomY = 1.0 }: PianoKeysSidebarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = PIANO_KEY_WIDTH;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate visible MIDI range
    const startMidi = MIDI_MAX - Math.floor((height + scrollY) / NOTE_HEIGHT);
    const endMidi = MIDI_MAX - Math.floor(scrollY / NOTE_HEIGHT) + 1;

    // Draw piano keys
    for (let midi = startMidi; midi <= endMidi; midi++) {
      const y = midiToY(midi, scrollY);
      const keyHeight = NOTE_HEIGHT;

      // Determine if this is a black key
      const note = midi % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(note); // C#, D#, F#, G#, A#
      const isC = note === 0;

      if (!isBlackKey) {
        // Draw white key
        ctx.fillStyle = isC ? '#f0f0f0' : '#ffffff';
        ctx.fillRect(0, y, PIANO_KEY_WIDTH, keyHeight);

        // Draw border
        ctx.strokeStyle = '#cccccc';
        ctx.strokeRect(0, y, PIANO_KEY_WIDTH, keyHeight);

        // Label C notes
        if (isC) {
          const octave = Math.floor(midi / 12) - 1;
          ctx.fillStyle = '#666666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(`C${octave}`, PIANO_KEY_WIDTH - 5, y + keyHeight / 2);
        }
      }
    }

    // Draw black keys on top
    for (let midi = startMidi; midi <= endMidi; midi++) {
      const y = midiToY(midi, scrollY);
      const keyHeight = NOTE_HEIGHT;

      const note = midi % 12;
      const isBlackKey = [1, 3, 6, 8, 10].includes(note);

      if (isBlackKey) {
        // Draw black key (shorter width)
        const blackKeyWidth = PIANO_KEY_WIDTH * 0.6;
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, y, blackKeyWidth, keyHeight);

        // Draw border
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(0, y, blackKeyWidth, keyHeight);
      }
    }
  }, [scrollY, height, zoomY]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: `${PIANO_KEY_WIDTH}px`,
        height: `${height}px`,
      }}
    />
  );
}
