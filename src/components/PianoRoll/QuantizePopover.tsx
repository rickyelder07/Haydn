'use client';

import { useEffect, useRef, useState } from 'react';
import { gridTicksForValue, QuantizeParams } from './quantizeUtils';

export interface QuantizePopoverProps {
  ppq: number;
  onApply: (params: QuantizeParams) => void;
}

const GRID_OPTIONS = ['1/4', '1/8', '1/16', '1/32', '1/4T', '1/8T', '1/16T'] as const;

export function QuantizePopover({ ppq, onApply }: QuantizePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [gridValue, setGridValue] = useState('1/16');
  const [strength, setStrength] = useState(80);
  const [thresholdPct, setThresholdPct] = useState(0);
  const [swingPct, setSwingPct] = useState(50);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleApply = () => {
    const gridTicks = gridTicksForValue(ppq, gridValue);
    onApply({ gridTicks, strength, thresholdPct, swingPct });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
          isOpen
            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
            : 'bg-white/5 text-secondary border border-white/10 hover:bg-white/10 hover:text-primary'
        }`}
        title="Quantize notes"
      >
        Q
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#131824] border border-white/10 rounded-lg p-3 w-56 shadow-xl">
          {/* Grid selector */}
          <div className="mb-3">
            <label className="block text-xs text-secondary mb-1">Grid</label>
            <select
              value={gridValue}
              onChange={e => setGridValue(e.target.value)}
              className="bg-[#1A2030] border border-white/10 text-primary text-sm rounded px-2 py-1 w-full"
            >
              {GRID_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Strength slider */}
          <div className="mb-3">
            <label className="block text-xs text-secondary mb-1">Strength {strength}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={e => setStrength(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Threshold slider */}
          <div className="mb-3">
            <label className="block text-xs text-secondary mb-1">Threshold {thresholdPct}%</label>
            <input
              type="range"
              min={0}
              max={50}
              value={thresholdPct}
              onChange={e => setThresholdPct(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Swing slider */}
          <div className="mb-3">
            <label className="block text-xs text-secondary mb-1">Swing {swingPct}%</label>
            <input
              type="range"
              min={50}
              max={75}
              value={swingPct}
              onChange={e => setSwingPct(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Apply button */}
          <button
            onClick={handleApply}
            className="bg-gradient-to-r from-amber-500 to-orange-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg w-full"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export default QuantizePopover;
