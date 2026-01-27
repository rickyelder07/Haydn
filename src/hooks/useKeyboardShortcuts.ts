'use client';

import { useEffect, useCallback } from 'react';
import { usePlaybackStore } from '@/state/playbackStore';
import { useProjectStore } from '@/state/projectStore';
import { useEditStore } from '@/state/editStore';

/**
 * Hook that registers DAW-style keyboard shortcuts.
 * Per CONTEXT.md: Spacebar (play/pause), Enter (stop), Home (jump to start)
 * Piano roll: Delete/Backspace (delete selected note), Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo)
 */
export function useKeyboardShortcuts() {
  const { togglePlayPause, stop, seekTo } = usePlaybackStore();
  const { project } = useProjectStore();
  const { selectedNoteIds, selectedTrackIndex, undo, redo } = useEditStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Only handle shortcuts when project is loaded
    if (!project) return;

    // Platform-aware modifier keys (Cmd on Mac, Ctrl elsewhere)
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    // Undo/Redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
    if (modKey && event.code === 'KeyZ' && selectedTrackIndex !== null) {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }

    // Delete selected note (Delete or Backspace)
    if ((event.code === 'Delete' || event.code === 'Backspace') && selectedNoteIds.size > 0 && selectedTrackIndex !== null) {
      event.preventDefault();

      // Get the note ID from the selected set (format: "note-{index}")
      const noteId = Array.from(selectedNoteIds)[0];
      const noteIndex = parseInt(noteId.replace('note-', ''), 10);

      // Delete the note using editStore
      if (!isNaN(noteIndex)) {
        const { deleteNote } = useEditStore.getState();
        deleteNote(noteIndex);
      }
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault(); // Prevent page scroll
        togglePlayPause();
        break;

      case 'Enter':
        event.preventDefault();
        stop();
        break;

      case 'Home':
        event.preventDefault();
        seekTo(0);
        break;

      // Future shortcuts (per CONTEXT.md, deferred)
      // case 'KeyL': // Loop toggle - deferred to later phase
      //   break;
    }
  }, [project, togglePlayPause, stop, seekTo, selectedNoteIds, selectedTrackIndex, undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
