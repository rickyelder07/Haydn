'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TrackDisplayInfo } from '@/lib/midi/types';
import { TrackControls } from './TrackControls';
import { useProjectStore } from '@/state/projectStore';
import { InlineEdit } from '@/components/InlineEdit';
import { getTrackColor } from '@/lib/constants/trackColors';

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
  const { removeTrack, updateTrackName } = useProjectStore();

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remove track "${track.name}"? This cannot be undone.`)) {
      removeTrack(trackIndex);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onSelect}
      className={`flex items-stretch rounded-xl transition-all cursor-pointer glass-panel border overflow-hidden ${
        isSelected
          ? 'border-cyan-500/50 shadow-[0px_10px_15px_-3px_rgba(6,182,212,0.2),0px_4px_6px_-4px_rgba(6,182,212,0.2)]'
          : 'hover:bg-white/5 border-white/10'
      }`}
    >
      {/* Drag handle — far left, vertically centered */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex items-center px-2.5 hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="6" cy="3" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="10" cy="3" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="6" cy="8" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="10" cy="8" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="6" cy="13" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="10" cy="13" r="1.5" fill="currentColor" className="text-tertiary" />
        </svg>
      </div>

      {/* Middle: track name above buttons */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-2.5 gap-1.5">
        {/* Track name with color swatch */}
        <div className="min-w-0 flex items-center gap-2">
          <span
            className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: getTrackColor(trackIndex) }}
          />
          <InlineEdit
            value={track.name}
            onSave={(name) => updateTrackName(trackIndex, name)}
            className="font-medium text-primary text-sm"
            maxLength={50}
          />
        </div>

        {/* Buttons row: controls left, editing badge right */}
        <div className="flex items-center justify-between">
          <TrackControls trackIndex={trackIndex} />
          {isSelected && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0 mr-1">
              Editing
            </span>
          )}
        </div>
      </div>

      {/* Delete button — far right, vertically centered */}
      <button
        onClick={handleDelete}
        className="flex items-center px-2.5 text-tertiary hover:text-red-400 hover:bg-white/5 transition-colors flex-shrink-0"
        aria-label="Remove track"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>
    </div>
  );
}
