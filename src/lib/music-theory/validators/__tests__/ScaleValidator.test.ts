import { describe, it, expect } from 'vitest';
import { ScaleValidator } from '../ScaleValidator';
import type { ValidationContext, HaydnNote, HaydnTrack, HaydnProject } from '@/lib/music-theory/types';

// Helper to create mock validation context
function createContext(
  midi: number,
  ticks: number = 0,
  keySignatures: Array<{ ticks: number; key: string; scale: string }> = []
): ValidationContext {
  const note: HaydnNote = {
    midi,
    ticks,
    durationTicks: 480,
    velocity: 0.8,
  };

  const track: HaydnTrack = {
    id: 'test-track',
    name: 'Test Track',
    channel: 0,
    program: 0,
    notes: [note],
  };

  const project: HaydnProject = {
    metadata: {
      name: 'Test Project',
      ppq: 480,
      keySignatures,
      timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
      tempos: [{ ticks: 0, bpm: 120 }],
    },
    tracks: [track],
  };

  return {
    note,
    track,
    project,
    editType: 'add',
  };
}

describe('ScaleValidator', () => {
  const validator = new ScaleValidator();

  it('accepts C4 (MIDI 60) in C major scale', () => {
    const context = createContext(60, 0, [
      { ticks: 0, key: 'C', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('rejects F#4 (MIDI 66) in C major scale', () => {
    const context = createContext(66, 0, [
      { ticks: 0, key: 'C', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('scale');
      expect(result.errors[0].severity).toBe('error');
      expect(result.errors[0].message).toContain('F#');
      expect(result.errors[0].message).toContain('C major');
    }
  });

  it('accepts Bb3 (MIDI 58) in F major scale (enharmonic test)', () => {
    const context = createContext(58, 0, [
      { ticks: 0, key: 'F', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('accepts C#5 (MIDI 73) in D major scale', () => {
    const context = createContext(73, 0, [
      { ticks: 0, key: 'D', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('accepts any note when no key signature exists (permissive default)', () => {
    const context = createContext(66, 0, []); // F# with no key signature
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('validates against correct key after key change mid-song', () => {
    const context = createContext(66, 960, [ // F# at tick 960
      { ticks: 0, key: 'C', scale: 'major' },    // C major at start
      { ticks: 480, key: 'G', scale: 'major' },  // G major at tick 480
    ]);
    // F# is in G major (not in C major), so should pass
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('validates against correct key when note is at exact key change tick', () => {
    const context = createContext(66, 480, [ // F# at tick 480
      { ticks: 0, key: 'C', scale: 'major' },    // C major at start
      { ticks: 480, key: 'G', scale: 'major' },  // G major at tick 480
    ]);
    // At exact key change tick, should use new key (G major where F# is valid)
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('is permissive for invalid/unknown scale (returns ok: true)', () => {
    const context = createContext(60, 0, [
      { ticks: 0, key: 'X', scale: 'unknown' }, // Invalid scale
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('returns error severity as "error" (not warning)', () => {
    const context = createContext(66, 0, [ // F# in C major
      { ticks: 0, key: 'C', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].severity).toBe('error');
    }
  });

  it('returns error type as "scale"', () => {
    const context = createContext(66, 0, [ // F# in C major
      { ticks: 0, key: 'C', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].type).toBe('scale');
    }
  });

  it('provides user-friendly error message with note name and scale name', () => {
    const context = createContext(66, 0, [ // F# in C major
      { ticks: 0, key: 'C', scale: 'major' },
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Message should contain note name and scale
      const message = result.errors[0].message;
      expect(message).toMatch(/F#|F♯/i); // Allow either sharp notation
      expect(message).toContain('C major');
      expect(message.toLowerCase()).toContain('scale');
    }
  });
});
