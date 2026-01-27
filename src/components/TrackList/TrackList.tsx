'use client';

import { useProjectStore } from '@/state/projectStore';
import { useNoteHighlighter } from '@/audio/playback/NoteHighlighter';
import { useEditStore } from '@/state/editStore';

export function TrackList() {
  const { project, trackDisplayInfo } = useProjectStore();
  const { activeNoteCountByTrack } = useNoteHighlighter();
  const { selectedTrackIndex, selectTrack } = useEditStore();

  if (!project || trackDisplayInfo.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Tracks ({trackDisplayInfo.length})
      </h2>
      <div className="space-y-2">
        {trackDisplayInfo.map((track, index) => {
          const isSelected = selectedTrackIndex === index;
          return (
            <div
              key={index}
              onClick={() => selectTrack(index)}
              className={`bg-white border rounded-lg p-4 transition-colors cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate flex items-center">
                  {track.name}
                  {isSelected && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Editing
                    </span>
                  )}
                  {activeNoteCountByTrack.get(index) ? (
                    <span className="inline-flex items-center ml-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="ml-1 text-xs text-green-600">
                        {activeNoteCountByTrack.get(index)} notes
                      </span>
                    </span>
                  ) : null}
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
          );
        })}
      </div>
    </div>
  );
}
