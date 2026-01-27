import { create } from 'zustand';
import type { HaydnNote } from '@/lib/midi/types';
import { HistoryManager } from './historyManager';
import { useProjectStore } from './projectStore';

interface EditState {
  // State
  selectedTrackIndex: number | null;
  selectedNoteIds: Set<string>;
  canUndo: boolean;
  canRedo: boolean;
  isEditing: boolean;

  // Internal history manager (not exposed directly)
  _history: HistoryManager<HaydnNote[]> | null;

  // Actions
  selectTrack: (index: number) => void;
  addNote: (note: HaydnNote) => void;
  deleteNote: (noteIndex: number) => void;
  moveNote: (noteIndex: number, newMidi: number, newTicks: number) => void;
  updateNote: (noteIndex: number, updates: Partial<HaydnNote>) => void;
  undo: () => void;
  redo: () => void;
  selectNote: (noteId: string) => void;
  clearSelection: () => void;
  setEditing: (editing: boolean) => void;
}

export const useEditStore = create<EditState>((set, get) => ({
  // Initial state
  selectedTrackIndex: null,
  selectedNoteIds: new Set(),
  canUndo: false,
  canRedo: false,
  isEditing: false,
  _history: null,

  // Select a track and initialize history for its notes
  selectTrack: (index) => {
    const project = useProjectStore.getState().project;
    if (!project || index < 0 || index >= project.tracks.length) {
      return;
    }

    const track = project.tracks[index];
    const history = new HistoryManager<HaydnNote[]>(track.notes);

    set({
      selectedTrackIndex: index,
      selectedNoteIds: new Set(),
      _history: history,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  // Add a note to the selected track
  addNote: (note) => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    const project = useProjectStore.getState().project;
    if (!project) return;

    // Get current notes, add new note, sort by ticks
    const currentNotes = [...project.tracks[state.selectedTrackIndex].notes];
    currentNotes.push(note);
    currentNotes.sort((a, b) => a.ticks - b.ticks);

    // Push to history
    state._history.push(currentNotes);

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, currentNotes);

    // Update undo/redo flags
    set({
      canUndo: state._history.canUndo(),
      canRedo: state._history.canRedo(),
    });
  },

  // Delete a note by index
  deleteNote: (noteIndex) => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    const project = useProjectStore.getState().project;
    if (!project) return;

    const currentNotes = [...project.tracks[state.selectedTrackIndex].notes];
    if (noteIndex < 0 || noteIndex >= currentNotes.length) {
      return;
    }

    // Remove note
    currentNotes.splice(noteIndex, 1);

    // Push to history
    state._history.push(currentNotes);

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, currentNotes);

    // Update undo/redo flags
    set({
      canUndo: state._history.canUndo(),
      canRedo: state._history.canRedo(),
    });
  },

  // Move a note to a new position
  moveNote: (noteIndex, newMidi, newTicks) => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    const project = useProjectStore.getState().project;
    if (!project) return;

    const currentNotes = [...project.tracks[state.selectedTrackIndex].notes];
    if (noteIndex < 0 || noteIndex >= currentNotes.length) {
      return;
    }

    // Update note position
    currentNotes[noteIndex] = {
      ...currentNotes[noteIndex],
      midi: newMidi,
      ticks: newTicks,
    };

    // Re-sort by ticks
    currentNotes.sort((a, b) => a.ticks - b.ticks);

    // Push to history
    state._history.push(currentNotes);

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, currentNotes);

    // Update undo/redo flags
    set({
      canUndo: state._history.canUndo(),
      canRedo: state._history.canRedo(),
    });
  },

  // Update note properties
  updateNote: (noteIndex, updates) => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    const project = useProjectStore.getState().project;
    if (!project) return;

    const currentNotes = [...project.tracks[state.selectedTrackIndex].notes];
    if (noteIndex < 0 || noteIndex >= currentNotes.length) {
      return;
    }

    // Apply updates
    currentNotes[noteIndex] = {
      ...currentNotes[noteIndex],
      ...updates,
    };

    // Re-sort if ticks changed
    if (updates.ticks !== undefined) {
      currentNotes.sort((a, b) => a.ticks - b.ticks);
    }

    // Push to history
    state._history.push(currentNotes);

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, currentNotes);

    // Update undo/redo flags
    set({
      canUndo: state._history.canUndo(),
      canRedo: state._history.canRedo(),
    });
  },

  // Undo last action
  undo: () => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    const previousState = state._history.undo();
    if (previousState === null) {
      return;
    }

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, previousState);

    // Update undo/redo flags
    set({
      canUndo: state._history.canUndo(),
      canRedo: state._history.canRedo(),
    });
  },

  // Redo last undone action
  redo: () => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    const nextState = state._history.redo();
    if (nextState === null) {
      return;
    }

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, nextState);

    // Update undo/redo flags
    set({
      canUndo: state._history.canUndo(),
      canRedo: state._history.canRedo(),
    });
  },

  // Select a note by ID
  selectNote: (noteId) => {
    set((state) => {
      const newSelection = new Set(state.selectedNoteIds);
      newSelection.add(noteId);
      return { selectedNoteIds: newSelection };
    });
  },

  // Clear all note selections
  clearSelection: () => {
    set({ selectedNoteIds: new Set() });
  },

  // Set editing state (for drag operations, etc.)
  setEditing: (editing) => {
    set({ isEditing: editing });
  },
}));

/**
 * Helper to sync edited notes back to the project store
 */
function syncToProjectStore(trackIndex: number, notes: HaydnNote[]): void {
  const projectState = useProjectStore.getState();
  const project = projectState.project;

  if (!project) return;

  // Clone tracks array
  const newTracks = [...project.tracks];

  // Replace the edited track's notes
  newTracks[trackIndex] = {
    ...newTracks[trackIndex],
    notes: [...notes],
  };

  // Update project with new tracks
  const newProject = {
    ...project,
    tracks: newTracks,
  };

  projectState.setProject(newProject);
}
