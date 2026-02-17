'use client';

import { useCallback, useRef } from 'react';

interface ResizeHandleProps {
  onResize: (deltaX: number) => void;
}

export function ResizeHandle({ onResize }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      lastX.current = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const deltaX = moveEvent.clientX - lastX.current;
        lastX.current = moveEvent.clientX;
        onResize(deltaX);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onResize]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute top-0 right-0 h-full w-1 group cursor-col-resize z-10 select-none"
      title="Drag to resize sidebar"
    >
      {/* Invisible wider hit target */}
      <div className="absolute top-0 -right-1 h-full w-3" />
      {/* Visual indicator */}
      <div className="h-full w-full bg-transparent group-hover:bg-white/10 transition-colors duration-150" />
    </div>
  );
}
