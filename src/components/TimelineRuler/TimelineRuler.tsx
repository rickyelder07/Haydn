'use client';

import { useRef, useEffect, useCallback } from 'react';
import { TransportStrip } from './TransportStrip';
import { Playhead } from './Playhead';
import { PIANO_KEY_WIDTH } from '@/components/PianoRoll/gridUtils';

interface TimeSignature {
  numerator: number;
  denominator: number;
}

interface TimelineRulerProps {
  /** Horizontal scroll offset in pixels (same as piano roll scrollX) */
  scrollX: number;
  /** Horizontal zoom factor (same as piano roll zoomX) */
  zoomX: number;
  /** Pulses per quarter note */
  ppq: number;
  /** Current time signature */
  timeSignature: TimeSignature;
  /** Total canvas width (ruler area, not including transport strip) */
  width: number;
  /** Height of the ruler strip in pixels */
  height?: number;
  /** Current playhead position in ticks */
  playheadTicks?: number;
  /** Whether playback is currently active */
  isPlaying?: boolean;
  /** Called when user seeks to a new tick position */
  onSeek?: (ticks: number) => void;
  /** Maximum ticks (used to clamp seek position) */
  durationTicks?: number;
}

// Base pixels per tick at zoomX=1 — must match PianoRollCanvas constant
const BASE_PIXELS_PER_TICK = 0.1;

export function TimelineRuler({
  scrollX,
  zoomX,
  ppq,
  timeSignature,
  width,
  height = 32,
  playheadTicks = 0,
  isPlaying = false,
  onSeek,
  durationTicks = 0,
}: TimelineRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pixels per tick at current zoom
  const pixelsPerTick = BASE_PIXELS_PER_TICK * zoomX;

  // Playhead x position relative to the ruler canvas (not transport strip)
  // The canvas starts at x=0 inside the ruler div, but scrollX offsets it
  const playheadX = playheadTicks * pixelsPerTick - scrollX;

  // Only show playhead when it's within the visible ruler area
  const isPlayheadVisible = playheadX >= 0 && playheadX <= width;

  // Absolute position within the outer container (accounting for transport strip)
  const playheadAbsoluteX = playheadX + PIANO_KEY_WIDTH;

  // Handle playhead drag: deltaX (pixels) -> tick delta -> seek
  const handlePlayheadDrag = useCallback((deltaX: number) => {
    if (!onSeek) return;
    const deltaTicks = deltaX / pixelsPerTick;
    const newTicks = Math.max(0, Math.min(durationTicks, playheadTicks + deltaTicks));
    onSeek(newTicks);
  }, [onSeek, pixelsPerTick, playheadTicks, durationTicks]);

  // Handle click on ruler canvas to seek
  const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;

    // Get click position relative to the ruler canvas div (not transport strip)
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    // Convert to ticks: x pixel + scrollX offset = absolute pixel, then / pixelsPerTick
    const ticks = Math.max(0, Math.min(durationTicks, (clickX + scrollX) / pixelsPerTick));
    onSeek(ticks);
  }, [onSeek, scrollX, pixelsPerTick, durationTicks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    const ppt = BASE_PIXELS_PER_TICK * zoomX;

    // Ticks per beat depends on time signature denominator
    // e.g. 4/4: ticksPerBeat = ppq, 6/8: ticksPerBeat = ppq/2
    const ticksPerBeat = ppq * (4 / timeSignature.denominator);
    const ticksPerMeasure = ticksPerBeat * timeSignature.numerator;
    // Subdivision: 16th notes
    const ticksPerSubdivision = ticksPerBeat / 4;

    // Visible range in ticks
    const startTick = scrollX / ppt;
    const endTick = startTick + width / ppt;

    // Draw background for the ruler
    ctx.fillStyle = '#1f2937'; // bg-gray-800
    ctx.fillRect(0, 0, width, height);

    // Draw ticks
    // --- Subdivisions (16th notes) — only when zoomed in ---
    if (zoomX > 1.5) {
      const subdivStart = Math.floor(startTick / ticksPerSubdivision) * ticksPerSubdivision;
      for (let tick = subdivStart; tick <= endTick; tick += ticksPerSubdivision) {
        // Skip if it's a beat or measure tick (those draw over it)
        const isBeat = Math.abs(tick % ticksPerBeat) < 0.5;
        if (isBeat) continue;

        const x = tick * ppt - scrollX;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, height - 10);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // --- Beat ticks ---
    const beatStart = Math.floor(startTick / ticksPerBeat) * ticksPerBeat;
    for (let tick = beatStart; tick <= endTick; tick += ticksPerBeat) {
      // Skip measure downbeats (they get full treatment below)
      const isMeasure = Math.abs(tick % ticksPerMeasure) < 0.5;
      if (isMeasure) continue;

      const x = tick * ppt - scrollX;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // --- Measure ticks + labels ---
    const measureStart = Math.floor(startTick / ticksPerMeasure) * ticksPerMeasure;
    for (let tick = measureStart; tick <= endTick; tick += ticksPerMeasure) {
      const x = tick * ppt - scrollX;
      const measureNumber = Math.round(tick / ticksPerMeasure) + 1;

      // Full-height tick line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Measure number label
      if (x >= 0 && x < width - 4) {
        ctx.fillStyle = 'rgba(156, 163, 175, 0.9)'; // text-gray-400
        ctx.font = `${Math.round(9 * Math.min(1, zoomX))}px monospace`;
        ctx.fillText(String(measureNumber), x + 3, 11);
      }
    }

    // Bottom border line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 0.5);
    ctx.lineTo(width, height - 0.5);
    ctx.stroke();
  }, [scrollX, zoomX, ppq, timeSignature, width, height]);

  return (
    <div
      className="flex border-b border-white/10"
      style={{ height: `${height}px`, position: 'relative' }}
    >
      {/* Transport strip on left side, aligned with piano keys sidebar */}
      <TransportStrip width={PIANO_KEY_WIDTH} />

      {/* Timeline ruler canvas — click-to-seek */}
      <div
        className="flex-1 relative overflow-hidden"
        onClick={handleRulerClick}
        style={{ cursor: onSeek ? 'pointer' : 'default' }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: 'none', // Let parent div handle clicks
          }}
          aria-label="Timeline ruler"
        />
      </div>

      {/* Playhead — absolutely positioned within outer flex container */}
      {isPlayheadVisible && (
        <Playhead
          position={playheadAbsoluteX}
          height={height}
          onDrag={handlePlayheadDrag}
          onDragEnd={() => {
            // No additional cleanup needed — seek updates store in real-time
          }}
        />
      )}
    </div>
  );
}
