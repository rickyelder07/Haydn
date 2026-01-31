import { describe, it, expect } from 'vitest';
import { TransitionValidator } from '../TransitionValidator';
import type { ValidationContext, HaydnNote, HaydnTrack, HaydnProject } from '@/lib/music-theory/types';

// Helper to create mock validation context with surrounding notes
function createContext(
  midi: number,
  ticks: number,
  surroundingNotes: Array<{ midi: number; ticks: number }> = []
): ValidationContext {
  const note: HaydnNote = {
    midi,
    ticks,
    durationTicks: 480,
    velocity: 0.8,
  };

  const allNotes: HaydnNote[] = [
    note,
    ...surroundingNotes.map(n => ({
      midi: n.midi,
      ticks: n.ticks,
      durationTicks: 480,
      velocity: 0.8,
    })),
  ];

  const track: HaydnTrack = {
    id: 'test-track',
    name: 'Test Track',
    channel: 0,
    program: 0,
    notes: allNotes,
  };

  const project: HaydnProject = {
    metadata: {
      name: 'Test Project',
      ppq: 480, // Important: ppq * 2 = 960 ticks is the neighborhood window
      keySignatures: [],
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

describe('TransitionValidator', () => {
  const validator = new TransitionValidator();

  it('accepts C4 when added near C major context (C, D, E, F, G notes)', () => {
    // C major context: C, D, E, F, G (MIDI 60, 62, 64, 65, 67)
    const context = createContext(60, 480, [
      { midi: 62, ticks: 240 },  // D
      { midi: 64, ticks: 360 },  // E
      { midi: 65, ticks: 600 },  // F
      { midi: 67, ticks: 720 },  // G
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('warns when F#4 is added near C major context', () => {
    // C major context: C, D, E, F, G
    const context = createContext(66, 480, [ // F# (MIDI 66)
      { midi: 60, ticks: 240 },  // C
      { midi: 62, ticks: 360 },  // D
      { midi: 64, ticks: 600 },  // E
      { midi: 65, ticks: 720 },  // F
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('transition');
      expect(result.errors[0].severity).toBe('warning');
    }
  });

  it('accepts any note when no surrounding notes exist (empty track)', () => {
    const context = createContext(66, 480, []); // F# with no neighbors
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('accepts any note when fewer than 3 surrounding notes exist', () => {
    const context = createContext(66, 480, [
      { midi: 60, ticks: 240 },  // C
      { midi: 62, ticks: 360 },  // D
    ]); // Only 2 neighbors
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('returns severity as "warning" (not error)', () => {
    const context = createContext(66, 480, [
      { midi: 60, ticks: 240 },  // C
      { midi: 62, ticks: 360 },  // D
      { midi: 64, ticks: 600 },  // E
      { midi: 65, ticks: 720 },  // F
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].severity).toBe('warning');
    }
  });

  it('returns error type as "transition"', () => {
    const context = createContext(66, 480, [
      { midi: 60, ticks: 240 },  // C
      { midi: 62, ticks: 360 },  // D
      { midi: 64, ticks: 600 },  // E
      { midi: 65, ticks: 720 },  // F
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].type).toBe('transition');
    }
  });

  it('uses neighborhood window of ppq * 2 ticks (2 beats)', () => {
    // ppq = 480, so window is 960 ticks (2 beats)
    // Note at tick 480 should consider notes from tick -480 to 1440
    const context = createContext(66, 480, [
      { midi: 60, ticks: 0 },      // C - within window (480 ticks before)
      { midi: 62, ticks: 240 },    // D - within window
      { midi: 64, ticks: 720 },    // E - within window
      { midi: 65, ticks: 1200 },   // F - within window (720 ticks after)
      { midi: 67, ticks: 1500 },   // G - OUTSIDE window (1020 ticks after)
    ]);
    const result = validator.validate(context);
    // Should detect C major from C, D, E, F (ignoring G which is out of range)
    // F# should clash
    expect(result.ok).toBe(false);
  });

  it('excludes the note being validated from neighborhood detection', () => {
    // Add F# surrounded by other F# notes - should pass because
    // the new F# itself is excluded from context detection
    const context = createContext(66, 480, [
      { midi: 66, ticks: 240 },  // F# neighbor 1
      { midi: 66, ticks: 360 },  // F# neighbor 2
      { midi: 66, ticks: 600 },  // F# neighbor 3
    ]);
    // All neighbors are F#, but scale detection might fail with only one pitch class
    // Should return ok: true due to insufficient scale detection
    const result = validator.validate(context);
    expect(result.ok).toBe(true);
  });

  it('includes notes with same tick position as target in context', () => {
    // Chord at tick 480: C, E, G (C major chord)
    // Adding F# at same tick should warn
    const context = createContext(66, 480, [ // F#
      { midi: 60, ticks: 480 },  // C - same tick
      { midi: 64, ticks: 480 },  // E - same tick
      { midi: 67, ticks: 480 },  // G - same tick
      { midi: 62, ticks: 360 },  // D - nearby for scale detection
    ]);
    const result = validator.validate(context);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].severity).toBe('warning');
    }
  });
});
