'use client';

import { useProjectStore } from '@/state/projectStore';

export function TrackList() {
  const { project, trackDisplayInfo } = useProjectStore();

  if (!project || trackDisplayInfo.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Tracks ({trackDisplayInfo.length})
      </h2>
      <div className="space-y-2">
        {trackDisplayInfo.map((track, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {track.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {track.instrumentName}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 ml-4">
                <span className="whitespace-nowrap">
                  {track.noteCount} {track.noteCount === 1 ? 'note' : 'notes'}
                </span>
                <span className="whitespace-nowrap text-gray-400">
                  {track.formattedDuration}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
