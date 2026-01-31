import { create } from 'zustand';
import type { ValidationError } from '@/lib/music-theory/types';
import type { HaydnKeySignature } from '@/lib/midi/types';
import type { GenrePresetKey } from '@/lib/music-theory/rules/genres';
import { getScaleAtTick } from '@/lib/music-theory/keySignature';

interface ValidationState {
  // Configuration
  enabled: boolean;
  activeGenre: GenrePresetKey;

  // Last validation result
  lastErrors: ValidationError[];
  lastWarnings: ValidationError[];

  // Current scale info (for visual feedback)
  scalePitchClasses: Set<number> | null;
  currentScaleName: string | null;

  // Actions
  setEnabled: (enabled: boolean) => void;
  setGenre: (genre: GenrePresetKey) => void;
  setLastResult: (errors: ValidationError[], warnings: ValidationError[]) => void;
  clearResult: () => void;
  updateScaleInfo: (keySignatures: HaydnKeySignature[], ticks: number) => void;
}

export const useValidationStore = create<ValidationState>((set) => ({
  // Initial state
  enabled: true, // Validation on by default
  activeGenre: 'none', // No genre constraint initially

  lastErrors: [],
  lastWarnings: [],

  scalePitchClasses: null,
  currentScaleName: null,

  // Actions
  setEnabled: (enabled) => set({ enabled }),

  setGenre: (genre) => set({ activeGenre: genre }),

  setLastResult: (errors, warnings) =>
    set({
      lastErrors: errors,
      lastWarnings: warnings,
    }),

  clearResult: () =>
    set({
      lastErrors: [],
      lastWarnings: [],
    }),

  updateScaleInfo: (keySignatures, ticks) => {
    const scaleInfo = getScaleAtTick(keySignatures, ticks);

    if (!scaleInfo) {
      set({
        scalePitchClasses: null,
        currentScaleName: null,
      });
      return;
    }

    set({
      scalePitchClasses: scaleInfo.pitchClasses,
      currentScaleName: scaleInfo.scaleName,
    });
  },
}));
