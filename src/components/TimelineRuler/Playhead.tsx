'use client';

import { useEffect, useRef } from 'react';

interface PlayheadProps {
  /** X position of the playhead in pixels (from left of ruler container) */
  position: number;
  /** Height of the ruler in pixels (used to draw the vertical line) */
  height: number;
  /** Called with deltaX (pixels) during drag */
  onDrag: (deltaX: number) => void;
  /** Called when drag ends */
  onDragEnd: () => void;
}

// Triangle dimensions
const TRIANGLE_WIDTH = 10;
const TRIANGLE_HEIGHT = 8;

export function Playhead({ position, height, onDrag, onDragEnd }: PlayheadProps) {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  // Clean up listeners if component unmounts during drag
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Don't bubble to ruler click handler

    isDraggingRef.current = true;
    startXRef.current = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      onDrag(deltaX);
      // Update startX so subsequent deltas are relative to last known position
      startXRef.current = moveEvent.clientX;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      onDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: `${position}px`,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        height: `${height}px`,
        zIndex: 10,
      }}
    >
      {/* Triangle (caret pointing down) — interactive */}
      <svg
        width={TRIANGLE_WIDTH}
        height={TRIANGLE_HEIGHT}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          pointerEvents: 'all',
          overflow: 'visible',
        }}
        onMouseDown={handleMouseDown}
      >
        <polygon
          points={`0,0 ${TRIANGLE_WIDTH},0 ${TRIANGLE_WIDTH / 2},${TRIANGLE_HEIGHT}`}
          fill="#22d3ee" /* cyan-400 */
          stroke="none"
        />
      </svg>

      {/* Vertical line — decorative only */}
      <div
        style={{
          position: 'absolute',
          top: `${TRIANGLE_HEIGHT}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1px',
          height: `${height - TRIANGLE_HEIGHT}px`,
          backgroundColor: '#22d3ee',
          opacity: 0.75,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
