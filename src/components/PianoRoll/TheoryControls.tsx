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
    <div className="flex items-center gap-3 text-sm">
      {/* Validation toggle */}
      <button
        onClick={() => setEnabled(!enabled)}
        className={`flex items-center gap-2 px-2 py-1 rounded ${
          enabled
            ? 'bg-green-900/30 text-green-300 hover:bg-green-900/40'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
        title={enabled ? 'Validation enabled' : 'Validation disabled'}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            enabled ? 'bg-green-400' : 'bg-gray-500'
          }`}
        />
        <span>Theory</span>
      </button>

      {/* Genre selector */}
      <select
        value={activeGenre}
        onChange={(e) => setGenre(e.target.value as GenrePresetKey)}
        className="px-2 py-1 rounded bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Genre preset"
      >
        {Object.entries(GENRE_PRESETS).map(([key, rules]) => (
          <option key={key} value={key}>
            {rules.displayName}
          </option>
        ))}
      </select>

      {/* Current scale display */}
      <div className="text-gray-400">
        <span className="text-gray-500">Key:</span>{' '}
        <span className="text-gray-300">
          {currentScaleName || '--'}
        </span>
      </div>
    </div>
  );
}
