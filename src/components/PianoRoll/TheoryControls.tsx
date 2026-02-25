'use client';

import { useValidationStore } from '@/state/validationStore';
import { GENRE_PRESETS, type GenrePresetKey } from '@/lib/music-theory/rules/genres';

export function TheoryControls() {
  const enabled = useValidationStore((state) => state.enabled);
  const activeGenre = useValidationStore((state) => state.activeGenre);
  const currentScaleName = useValidationStore((state) => state.currentScaleName);
  const setEnabled = useValidationStore((state) => state.setEnabled);
  const setGenre = useValidationStore((state) => state.setGenre);

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Validation toggle */}
      <button
        onClick={() => setEnabled(!enabled)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          enabled
            ? 'bg-green-500/15 text-green-300 border border-green-500/20 hover:bg-green-500/20'
            : 'bg-white/5 text-secondary border border-white/10 hover:bg-white/10 hover:text-primary'
        }`}
        title={enabled ? 'Theory validation enabled' : 'Theory validation disabled'}
      >
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            enabled ? 'bg-green-400' : 'bg-white/30'
          }`}
        />
        <span>Theory</span>
      </button>

      {/* Genre selector */}
      <select
        value={activeGenre}
        onChange={(e) => setGenre(e.target.value as GenrePresetKey)}
        className="px-2 py-1.5 rounded-lg bg-[#1A2030] text-secondary border border-white/10 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-sm"
        title="Genre preset"
      >
        {Object.entries(GENRE_PRESETS).map(([key, rules]) => (
          <option key={key} value={key}>
            {rules.displayName}
          </option>
        ))}
      </select>

      {/* Current scale display */}
      <div className="text-sm">
        <span className="text-tertiary">Key:</span>{' '}
        <span className="text-primary font-medium">
          {currentScaleName || '--'}
        </span>
      </div>
    </div>
  );
}
