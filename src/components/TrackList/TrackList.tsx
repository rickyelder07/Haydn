'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';
import { useTrackUIStore } from '@/state/trackUIStore';
import { TrackItem } from './TrackItem';
import { AddTrackModal } from './AddTrackModal';

export function TrackList() {
  const { project, trackDisplayInfo, addTrack } = useProjectStore();
  const { selectedTrackIndex, selectTrack } = useEditStore();
  const { trackOrder, reorderTracks, resetAllStates } = useTrackUIStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initialize track order when project loads
  useEffect(() => {
    if (project && trackOrder.length === 0) {
      useTrackUIStore.getState().initializeOrder(project.tracks.length);
    }
  }, [project, trackOrder.length]);

  // Set up sensors for drag and drop.
  // PointerSensor needs a minimum distance before activating a drag so that
  // a plain click on a track card always fires onClick without dnd-kit
  // capturing the pointer first.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // px — pointer must move 8px before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = trackOrder.indexOf(Number(active.id));
      const newIndex = trackOrder.indexOf(Number(over.id));
      reorderTracks(oldIndex, newIndex);
    }
  }

  if (!project || trackDisplayInfo.length === 0) {
    return null;
  }

  // If trackOrder not initialized yet, return null
  if (trackOrder.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-primary">
          Tracks ({trackDisplayInfo.length}/32)
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={trackDisplayInfo.length >= 32}
            className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Add Track
          </button>
          <button
            onClick={resetAllStates}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            Reset Mute/Solo
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={trackOrder.map(String)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {trackOrder.map((originalIndex) => {
              const track = trackDisplayInfo[originalIndex];
              if (!track) return null;
              return (
                <TrackItem
                  key={originalIndex}
                  id={String(originalIndex)}
                  track={track}
                  trackIndex={originalIndex}
                  isSelected={selectedTrackIndex === originalIndex}
                  onSelect={() => selectTrack(originalIndex)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <AddTrackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(instrumentNumber, name) => {
          addTrack(instrumentNumber, name);
          setIsAddModalOpen(false);
        }}
      />
    </div>
  );
}
