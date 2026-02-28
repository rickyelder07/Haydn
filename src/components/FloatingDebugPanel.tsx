'use client';

import { useEffect, useRef, useState } from 'react';
import { useAiCompositionStore, type DebugLogEntry, type DebugLogType } from '@/state/aiCompositionStore';

// ---------------------------------------------------------------------------
// Log entry rendering
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<DebugLogType, { bar: string; badge: string; label: string }> = {
  'clarify-request':   { bar: 'bg-blue-500/60',    badge: 'bg-blue-500/15 text-blue-300',      label: 'CLARIFY →'  },
  'clarify-response':  { bar: 'bg-cyan-500/60',    badge: 'bg-cyan-500/15 text-cyan-300',      label: 'CLARIFY ←'  },
  'generate-request':  { bar: 'bg-purple-500/60',  badge: 'bg-purple-500/15 text-purple-300',  label: 'GEN →'      },
  'generate-response': { bar: 'bg-emerald-500/60', badge: 'bg-emerald-500/15 text-emerald-300',label: 'GEN ←'      },
  'validation-pass':   { bar: 'bg-green-500/60',   badge: 'bg-green-500/15 text-green-300',    label: 'VALID ✓'    },
  'validation-fail':   { bar: 'bg-red-500/60',     badge: 'bg-red-500/15 text-red-300',        label: 'INVALID ✗'  },
  'fallback':          { bar: 'bg-amber-500/60',   badge: 'bg-amber-500/15 text-amber-300',    label: 'FALLBACK'   },
};

function formatMs(ms: number): string {
  return ms < 1000 ? `+${ms}ms` : `+${(ms / 1000).toFixed(1)}s`;
}

function LogEntry({ entry }: { entry: DebugLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[entry.type];
  const hasDetail = entry.detail.trim().length > 0;

  return (
    <div className="flex gap-2 min-w-0">
      <div className={`w-0.5 rounded-full flex-shrink-0 mt-1 self-stretch ${style.bar}`} />
      <div className="flex-1 min-w-0">
        <div
          className={`flex items-center gap-2 ${hasDetail ? 'cursor-pointer' : ''}`}
          onClick={() => hasDetail && setExpanded(v => !v)}
        >
          <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${style.badge}`}>
            {style.label}
          </span>
          <span className="text-xs text-gray-300 truncate flex-1">{entry.label}</span>
          <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{formatMs(entry.timestamp)}</span>
          {hasDetail && (
            <svg
              className={`w-3 h-3 text-gray-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        {expanded && hasDetail && (
          <pre className="mt-1.5 text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap break-all bg-[#0B0F1A] rounded-lg px-3 py-2 border border-white/5">
            {entry.detail}
          </pre>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating panel
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 380;
const TITLE_HEIGHT = 40;

export function FloatingDebugPanel() {
  const logs = useAiCompositionStore(s => s.debugLogs);

  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const positionedRef = useRef(false);

  const dragRef = useRef<{
    startX: number; startY: number; startPosX: number; startPosY: number;
  } | null>(null);

  // Set initial position once (bottom-left, clear of the footer)
  useEffect(() => {
    if (!positionedRef.current) {
      positionedRef.current = true;
      setPosition({
        x: 16,
        y: window.innerHeight - 420,
      });
    }
  }, []);

  // Auto-show (and un-minimize) when a new generation session starts
  useEffect(() => {
    if (logs.length === 1) {
      setVisible(true);
      setMinimized(false);
    }
  }, [logs.length]);

  if (!visible || logs.length === 0) return null;

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - PANEL_WIDTH, dragRef.current.startPosX + (me.clientX - dragRef.current.startX)));
      const y = Math.max(0, Math.min(window.innerHeight - TITLE_HEIGHT, dragRef.current.startPosY + (me.clientY - dragRef.current.startY)));
      setPosition({ x, y });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const panelHeight = minimized ? TITLE_HEIGHT : 360;

  return (
    <div
      className="fixed z-50 select-none"
      style={{ left: position.x, top: position.y, width: PANEL_WIDTH }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10"
        style={{ height: panelHeight, transition: 'height 0.15s ease' }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-3 bg-[#131824] border-b border-white/10 cursor-grab active:cursor-grabbing"
          style={{ height: TITLE_HEIGHT, flexShrink: 0 }}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-xs font-medium text-gray-400">Generation log</span>
            <span className="text-[10px] text-gray-600 font-mono">{logs.length} events</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized(v => !v)}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${minimized ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
              title="Close"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Log entries */}
        {!minimized && (
          <div className="overflow-y-auto bg-[#0D1117] px-3 py-2 space-y-2" style={{ height: panelHeight - TITLE_HEIGHT }}>
            {logs.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
