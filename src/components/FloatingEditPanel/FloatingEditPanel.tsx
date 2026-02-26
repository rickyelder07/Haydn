'use client';

import { useState, useRef, useEffect } from 'react';
import { EditModeToggle } from '@/components/EditModeToggle';
import { CommandInput } from '@/components/CommandInput';
import { ConversationPanel } from '@/components/ConversationPanel/ConversationPanel';
import { useEditStore } from '@/state/editStore';

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const TITLE_BAR_HEIGHT = 44;

export function FloatingEditPanel() {
  const selectedTrackIndex = useEditStore((state) => state.selectedTrackIndex);
  const [editMode, setEditMode] = useState<'single-shot' | 'conversation'>('single-shot');
  const [minimized, setMinimized] = useState(false);
  const [snapped, setSnapped] = useState(true);
  const [position, setPosition] = useState({ x: 16, y: 200 });
  const [size, setSize] = useState({ width: 420, height: 420 });

  const dragRef = useRef<{
    startX: number; startY: number; startPosX: number; startPosY: number;
  } | null>(null);

  const resizeRef = useRef<{
    startX: number; startY: number; startWidth: number; startHeight: number;
  } | null>(null);

  // Set initial position on mount (safe from SSR)
  useEffect(() => {
    setPosition({ x: 16, y: Math.max(100, window.innerHeight - 480) });
  }, []);

  const handleDragStart = (e: React.MouseEvent) => {
    if (snapped) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };

    const handleMouseMove = (moveE: MouseEvent) => {
      if (!dragRef.current) return;
      const newX = dragRef.current.startPosX + (moveE.clientX - dragRef.current.startX);
      const newY = dragRef.current.startPosY + (moveE.clientY - dragRef.current.startY);
      const panelH = minimized ? TITLE_BAR_HEIGHT : size.height;
      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - size.width)),
        y: Math.max(0, Math.min(newY, window.innerHeight - panelH)),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };

    const handleMouseMove = (moveE: MouseEvent) => {
      if (!resizeRef.current) return;
      setSize({
        width: Math.max(MIN_WIDTH, resizeRef.current.startWidth + (moveE.clientX - resizeRef.current.startX)),
        height: Math.max(MIN_HEIGHT, resizeRef.current.startHeight + (moveE.clientY - resizeRef.current.startY)),
      });
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const hasTrack = selectedTrackIndex !== null;

  const positionStyle = snapped
    ? { right: 16, bottom: 16, width: size.width, height: minimized ? 'auto' : size.height }
    : { left: position.x, top: position.y, width: size.width, height: minimized ? 'auto' : size.height };

  return (
    <div
      className="fixed z-50 shadow-2xl rounded-xl flex flex-col"
      style={positionStyle}
    >
      {/* Title bar — draggable when not snapped */}
      <div
        className={`flex items-center justify-between px-4 py-3 bg-gray-900/95 border border-white/10 flex-shrink-0 select-none backdrop-blur-sm ${snapped ? 'cursor-default' : 'cursor-move'}`}
        style={{
          borderRadius: minimized ? '0.75rem' : '0.75rem 0.75rem 0 0',
        }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-sm font-medium text-secondary truncate">AI Editor</span>
          {!hasTrack && !minimized && (
            <span className="text-xs text-tertiary ml-1 truncate">— select a track to begin</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {/* Snap / float toggle button */}
          <button
            onClick={() => setSnapped((v) => !v)}
            className={`p-1 rounded transition-colors ${snapped ? 'text-cyan-400 hover:text-cyan-300 hover:bg-white/10' : 'text-tertiary hover:text-secondary hover:bg-white/10'}`}
            title={snapped ? 'Float freely' : 'Snap to bottom-right'}
          >
            {snapped ? (
              /* Unpin / float icon */
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
              </svg>
            ) : (
              /* Pin to corner icon */
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14M19 5v6m0-6h-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19H5V5" />
              </svg>
            )}
          </button>

          {/* Minimize button */}
          <button
            onClick={() => setMinimized((v) => !v)}
            className="p-1 rounded hover:bg-white/10 text-tertiary hover:text-secondary transition-colors"
            title={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900/95 border-x border-b border-white/10 rounded-b-xl backdrop-blur-sm">
          {!hasTrack ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center">
              <div className="w-10 h-10 mb-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-cyan-300 mb-1">Select a Track</p>
              <p className="text-xs text-secondary">Choose a track in the sidebar to start editing with AI</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              {/* Mode toggle */}
              <div className="flex justify-center flex-shrink-0">
                <EditModeToggle mode={editMode} onChange={setEditMode} />
              </div>

              {/* Editor content — fills remaining height */}
              <div className="flex-1 min-h-0">
                {editMode === 'single-shot' ? (
                  <CommandInput />
                ) : (
                  <div className="h-full">
                    <ConversationPanel />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resize handle — bottom-right corner */}
      {!minimized && (
        <div
          className="absolute bottom-1 right-1 p-1 cursor-se-resize text-gray-600 hover:text-gray-400 transition-colors"
          onMouseDown={handleResizeStart}
          title="Resize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="8.5" cy="8.5" r="1.2" />
            <circle cx="4.5" cy="8.5" r="1.2" />
            <circle cx="8.5" cy="4.5" r="1.2" />
          </svg>
        </div>
      )}
    </div>
  );
}
