'use client';

import { useState, useRef, useEffect } from 'react';

const HOTKEYS = [
  { group: 'Notes' },
  { key: 'Click', action: 'Add note / Select note' },
  { key: 'Shift + Click', action: 'Add/remove note from selection' },
  { key: 'Right-click', action: 'Delete note' },
  { key: 'Drag note', action: 'Move note' },
  { group: 'Selection' },
  { key: 'Cmd + A', action: 'Select all notes' },
  { key: 'Click empty space', action: 'Deselect all' },
  { group: 'Editing' },
  { key: 'Cmd + Z', action: 'Undo' },
  { key: 'Cmd + Shift + Z', action: 'Redo' },
  { group: 'Velocity' },
  { key: 'Drag stalk tip', action: 'Change note velocity' },
  { key: 'Drag stalk (multi-select)', action: 'Adjust all selected velocities' },
  { group: 'View' },
  { key: 'Ctrl + Scroll', action: 'Horizontal zoom' },
  { key: 'Scroll', action: 'Vertical scroll' },
  { key: 'Shift + Scroll', action: 'Horizontal scroll' },
] as const;

export function HotkeyReference() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`flex items-center justify-center w-7 h-7 rounded-lg text-sm transition-colors ${
          isOpen
            ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
            : 'bg-white/5 text-secondary border border-white/10 hover:bg-white/10 hover:text-primary'
        }`}
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 rounded-lg bg-[#1A2030] border border-white/10 shadow-xl shadow-black/40 p-3">
          <p className="text-xs font-semibold text-primary mb-2 pb-2 border-b border-white/10">Keyboard Shortcuts</p>
          <div className="space-y-0.5">
            {HOTKEYS.map((item, i) => {
              if ('group' in item) {
                return (
                  <p key={i} className="text-[10px] font-semibold text-tertiary uppercase tracking-wider pt-2 pb-1">
                    {item.group}
                  </p>
                );
              }
              return (
                <div key={i} className="flex items-center justify-between gap-3 py-0.5">
                  <span className="text-xs text-secondary shrink-0">{item.action}</span>
                  <kbd className="text-[10px] font-mono text-cyan-400/80 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {item.key}
                  </kbd>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
