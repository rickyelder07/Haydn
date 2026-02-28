'use client';

import { useState } from 'react';
import type { DebugLogEntry, DebugLogType } from '@/state/aiCompositionStore';

const TYPE_STYLES: Record<DebugLogType, { bar: string; badge: string; label: string }> = {
  'clarify-request':   { bar: 'bg-blue-500/60',    badge: 'bg-blue-500/15 text-blue-300',    label: 'CLARIFY →' },
  'clarify-response':  { bar: 'bg-cyan-500/60',    badge: 'bg-cyan-500/15 text-cyan-300',    label: 'CLARIFY ←' },
  'generate-request':  { bar: 'bg-purple-500/60',  badge: 'bg-purple-500/15 text-purple-300', label: 'GENERATE →' },
  'generate-response': { bar: 'bg-emerald-500/60', badge: 'bg-emerald-500/15 text-emerald-300', label: 'GENERATE ←' },
  'validation-pass':   { bar: 'bg-green-500/60',   badge: 'bg-green-500/15 text-green-300',  label: 'VALID ✓' },
  'validation-fail':   { bar: 'bg-red-500/60',     badge: 'bg-red-500/15 text-red-300',      label: 'INVALID ✗' },
  'fallback':          { bar: 'bg-amber-500/60',   badge: 'bg-amber-500/15 text-amber-300',  label: 'FALLBACK' },
};

function formatMs(ms: number): string {
  if (ms < 1000) return `+${ms}ms`;
  return `+${(ms / 1000).toFixed(1)}s`;
}

function LogEntry({ entry }: { entry: DebugLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[entry.type];
  const hasDetail = entry.detail.trim().length > 0;

  return (
    <div className="flex gap-2">
      {/* left color bar */}
      <div className={`w-0.5 rounded-full flex-shrink-0 ${style.bar}`} />

      <div className="flex-1 min-w-0">
        <div
          className={`flex items-center gap-2 ${hasDetail ? 'cursor-pointer' : ''}`}
          onClick={() => hasDetail && setExpanded(v => !v)}
        >
          <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${style.badge} flex-shrink-0`}>
            {style.label}
          </span>
          <span className="text-xs text-gray-300 truncate flex-1">{entry.label}</span>
          <span className="text-[10px] text-gray-600 flex-shrink-0 font-mono">
            {formatMs(entry.timestamp)}
          </span>
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
          <pre className="mt-1.5 text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap break-words bg-[#0B0F1A] rounded-lg px-3 py-2 border border-white/5">
            {entry.detail}
          </pre>
        )}
      </div>
    </div>
  );
}

interface AiDebugPanelProps {
  logs: DebugLogEntry[];
}

export function AiDebugPanel({ logs }: AiDebugPanelProps) {
  const [open, setOpen] = useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#131824] hover:bg-[#1A2030] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span className="text-xs text-gray-500 font-medium">Generation log</span>
          <span className="text-[10px] text-gray-600 font-mono">{logs.length} events</span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Log entries */}
      {open && (
        <div className="px-3 py-2 space-y-2 max-h-72 overflow-y-auto bg-[#0D1117]">
          {logs.map((entry, i) => (
            <LogEntry key={i} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
