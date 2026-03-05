import { create } from 'zustand';
import type { HaydnNote } from '@/lib/midi/types';
import { HistoryManager } from './historyManager';
import { useProjectStore } from './projectStore';
import { useValidationStore } from './validationStore';
import { createDefaultPipeline } from '@/lib/music-theory/validators/ValidationPipeline';
import { GENRE_PRESETS } from '@/lib/music-theory/rules/genres';
import type { ValidationContext } from '@/lib/music-theory/types';
import { getPlaybackController } from '@/audio/playback/PlaybackController';

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
  updateNoteDirectly: (noteIndex: number, updates: Partial<HaydnNote>) => void;
  applyBatchEdit: (notes: HaydnNote[]) => void;
  undo: () => void;
  redo: () => void;
  selectNote: (noteId: string) => void;
  toggleNoteSelection: (noteId: string) => void;
  selectAll: (noteIds: string[]) => void;
  clearSelection: () => void;
  setEditing: (editing: boolean) => void;
}

/**
 * Validate a note before applying an edit
 * @returns true if edit should proceed, false if validation failed
 */
function validateNote(
  note: HaydnNote,
  trackIndex: number,
  editType: 'add' | 'move' | 'update'
): boolean {
  const validationState = useValidationStore.getState();
  const projectState = useProjectStore.getState();

  // Clear previous validation result
  validationState.clearResult();

  // If validation disabled, allow edit
  if (!validationState.enabled) {
    return true;
  }

  // Get project and track
  const project = projectState.project;
  if (!project || trackIndex < 0 || trackIndex >= project.tracks.length) {
    return true; // No project/track = allow edit
  }

  const track = project.tracks[trackIndex];

  // Build validation context
  const context: ValidationContext = {
    note,
    track,
    project,
    editType,
  };

  // Get genre rules
  const genreRules = GENRE_PRESETS[validationState.activeGenre];

  // Create and run validation pipeline
  const pipeline = createDefaultPipeline(genreRules);
  const result = pipeline.validate(context);

  // Store validation result
  validationState.setLastResult(result.errors, result.warnings);

  // Return whether edit is valid (true = allow, false = block)
  return result.valid;
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

    // Validate note before applying edit
    const isValid = validateNote(note, state.selectedTrackIndex, 'add');
    if (!isValid) {
      // Validation failed (errors present) - do NOT apply edit
      return;
    }

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

    // Create updated note for validation
    const updatedNote: HaydnNote = {
      ...currentNotes[noteIndex],
      midi: newMidi,
      ticks: newTicks,
    };

    // Validate note before applying edit
    const isValid = validateNote(updatedNote, state.selectedTrackIndex, 'move');
    if (!isValid) {
      // Validation failed - do NOT apply move
      return;
    }

    // Update note position
    currentNotes[noteIndex] = updatedNote;

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

    // Create updated note
    const updatedNote: HaydnNote = {
      ...currentNotes[noteIndex],
      ...updates,
    };

    // Only validate if midi or ticks changed (not for velocity-only changes)
    const shouldValidate = updates.midi !== undefined || updates.ticks !== undefined;

    if (shouldValidate) {
      const isValid = validateNote(updatedNote, state.selectedTrackIndex, 'update');
      if (!isValid) {
        // Validation failed - do NOT apply update
        return;
      }
    }

    // Apply updates
    currentNotes[noteIndex] = updatedNote;

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

  // Update note WITHOUT pushing to history — for real-time drag operations (velocity lane)
  // Call editStore.updateNote() on mouseup to record one undo-able history entry
  updateNoteDirectly: (noteIndex, updates) => {
    const state = get();
    if (state.selectedTrackIndex === null) return;

    const project = useProjectStore.getState().project;
    if (!project) return;

    const currentNotes = [...project.tracks[state.selectedTrackIndex].notes];
    if (noteIndex < 0 || noteIndex >= currentNotes.length) return;

    currentNotes[noteIndex] = { ...currentNotes[noteIndex], ...updates };

    // Write directly to project store — do NOT call state._history.push()
    syncToProjectStore(state.selectedTrackIndex, currentNotes);
    // Note: canUndo/canRedo flags intentionally unchanged
  },

  // Apply batch edit (for NL edits - single undo/redo step)
  applyBatchEdit: (notes) => {
    const state = get();
    if (state.selectedTrackIndex === null || !state._history) {
      return;
    }

    // Sort notes by ticks
    const sortedNotes = [...notes].sort((a, b) => a.ticks - b.ticks);

    // Push to history as single entry
    state._history.push(sortedNotes);

    // Sync to project store
    syncToProjectStore(state.selectedTrackIndex, sortedNotes);

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

  // Select a note by ID (replaces previous selection for single-select behavior)
  selectNote: (noteId) => {
    set({ selectedNoteIds: new Set([noteId]) });
  },

  toggleNoteSelection: (noteId) => {
    const current = get().selectedNoteIds;
    const next = new Set(current);
    if (next.has(noteId)) {
      next.delete(noteId);
    } else {
      next.add(noteId);
    }
    set({ selectedNoteIds: next });
  },

  selectAll: (noteIds) => {
    set({ selectedNoteIds: new Set(noteIds) });
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

  // Keep playback engine in sync with edited notes.
  // updateProject() re-schedules when stopped, or defers to next stop() when playing.
  if (typeof window !== 'undefined') {
    getPlaybackController().updateProject(newProject);
  }
}
