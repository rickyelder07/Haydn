'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TrackDisplayInfo } from '@/lib/midi/types';
import { TrackControls } from './TrackControls';
import { useProjectStore } from '@/state/projectStore';
import { InlineEdit } from '@/components/InlineEdit';

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
      className={`flex items-center rounded-xl transition-all cursor-pointer glass-panel border overflow-hidden ${
        isSelected
          ? 'border-cyan-500/50 shadow-[0px_10px_15px_-3px_rgba(6,182,212,0.2),0px_4px_6px_-4px_rgba(6,182,212,0.2)]'
          : 'hover:bg-white/5 border-white/10'
      }`}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing px-3 py-4 hover:bg-white/5 transition-colors"
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
          <circle cx="6" cy="3" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="10" cy="3" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="6" cy="8" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="10" cy="8" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="6" cy="13" r="1.5" fill="currentColor" className="text-tertiary" />
          <circle cx="10" cy="13" r="1.5" fill="currentColor" className="text-tertiary" />
        </svg>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0 py-3">
        <div className="flex items-center gap-2">
          <div
            className="min-w-0 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <InlineEdit
              value={track.name}
              onSave={(name) => updateTrackName(trackIndex, name)}
              className="font-medium text-primary"
              maxLength={50}
            />
          </div>
          {isSelected && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0">
              Editing
            </span>
          )}
        </div>
      </div>

      {/* Track controls (mute/solo) */}
      <div className="px-2">
        <TrackControls trackIndex={trackIndex} />
      </div>

      {/* Delete button */}
      <div className="px-3 py-4">
        <button
          onClick={handleDelete}
          className="text-tertiary hover:text-red-400 transition-colors"
          aria-label="Remove track"
        >
          <svg
            width="16"
            height="16"
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
    </div>
  );
}
