'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TrackDisplayInfo } from '@/lib/midi/types';
import { TrackControls } from './TrackControls';

interface TrackItemProps {
  id: string;
  track: TrackDisplayInfo;
  trackIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function TrackItem({
  id,
  track,
  trackIndex,
  isSelected,
  onSelect,
}: TrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      className={`flex items-center rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50 border-blue-500 border-l-4'
          : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'
      } border border-gray-200 overflow-hidden`}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing px-3 py-4 hover:bg-gray-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grip dots (6 dots in 2 columns) */}
          <circle cx="6" cy="3" r="1.5" fill="currentColor" className="text-gray-400" />
          <circle cx="10" cy="3" r="1.5" fill="currentColor" className="text-gray-400" />
          <circle cx="6" cy="8" r="1.5" fill="currentColor" className="text-gray-400" />
          <circle cx="10" cy="8" r="1.5" fill="currentColor" className="text-gray-400" />
          <circle cx="6" cy="13" r="1.5" fill="currentColor" className="text-gray-400" />
          <circle cx="10" cy="13" r="1.5" fill="currentColor" className="text-gray-400" />
        </svg>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0 py-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">
            {track.name}
          </h3>
          {isSelected && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Editing
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {track.instrumentName}
        </p>
      </div>

      {/* Track controls (mute/solo) */}
      <div className="px-3">
        <TrackControls trackIndex={trackIndex} />
      </div>

      {/* Track stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 px-4 py-4 border-l border-gray-200">
        <span className="whitespace-nowrap">
          {track.noteCount} {track.noteCount === 1 ? 'note' : 'notes'}
        </span>
        <span className="whitespace-nowrap text-gray-400">
          {track.formattedDuration}
        </span>
      </div>
    </div>
  );
}
