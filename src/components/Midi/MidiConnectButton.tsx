'use client';

import { useState, useEffect, useRef } from 'react';
import { useMidiInputStore } from '@/state/midiInputStore';
import { MidiDeviceList } from './MidiDeviceList';

// Small MIDI DIN-connector icon
function MidiIcon({ connected }: { connected: boolean }) {
  return (
    <svg
      className="w-3 h-3"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {/* 5-pin DIN connector shape approximation */}
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
      <circle cx="10" cy="14" r="1.5" />
      <circle cx="14" cy="14" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
    </svg>
  );
}

export function MidiConnectButton() {
  const [showDevices, setShowDevices] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isConnected = useMidiInputStore(s => s.isConnected);
  const devices = useMidiInputStore(s => s.devices);
  const error = useMidiInputStore(s => s.error);
  const connect = useMidiInputStore(s => s.connect);
  const disconnect = useMidiInputStore(s => s.disconnect);

  // Close device popover on outside click
  useEffect(() => {
    if (!showDevices) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowDevices(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showDevices]);

  const handleConnect = async () => {
    if (isConnected) {
      setShowDevices(v => !v);
      return;
    }
    setIsConnecting(true);
    try {
      await connect();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDevices(false);
  };

  return (
    <div className="relative flex flex-col" ref={popoverRef}>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={[
          'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors',
          isConnected
            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15'
            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
        title={
          isConnected
            ? `MIDI connected (${devices.length} device${devices.length !== 1 ? 's' : ''})`
            : 'Connect MIDI keyboard'
        }
        aria-label={isConnected ? `MIDI connected, ${devices.length} device${devices.length !== 1 ? 's' : ''}` : 'Connect MIDI keyboard'}
      >
        {isConnecting ? (
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <MidiIcon connected={isConnected} />
        )}
        <span className="mono">{isConnected ? `MIDI (${devices.length})` : 'MIDI'}</span>
      </button>

      {/* Error message — shown when not connected and error present */}
      {error && !isConnected && (
        <span className="text-[10px] text-red-400 mt-0.5 max-w-[120px] leading-tight">
          {error}
        </span>
      )}

      {/* Device list popover — shown when connected and toggled open */}
      {isConnected && showDevices && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1A2030] border border-white/10 rounded-lg shadow-xl min-w-[160px]">
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-secondary uppercase tracking-wider">
              MIDI Inputs
            </span>
            <button
              onClick={handleDisconnect}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              Disconnect
            </button>
          </div>
          <MidiDeviceList devices={devices} />
        </div>
      )}
    </div>
  );
}
