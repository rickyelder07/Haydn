'use client';

import { useEffect, useCallback } from 'react';
import { usePlaybackStore } from '@/state/playbackStore';
import { useProjectStore } from '@/state/projectStore';

/**
 * Hook that registers DAW-style keyboard shortcuts.
 * Per CONTEXT.md: Spacebar (play/pause), Enter (stop), Home (jump to start)
 */
export function useKeyboardShortcuts() {
  const { togglePlayPause, stop, seekTo } = usePlaybackStore();
  const { project } = useProjectStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Only handle shortcuts when project is loaded
    if (!project) return;

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
  }, [project, togglePlayPause, stop, seekTo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
