'use client';

import { useState, useEffect, useRef } from 'react';
import { GM_INSTRUMENTS } from '@/lib/instruments/gm-mapping';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (instrumentNumber: number, name?: string) => void;
}

export function AddTrackModal({ isOpen, onClose, onAdd }: AddTrackModalProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<number>(0);
  const [trackName, setTrackName] = useState<string>('');
  const selectRef = useRef<HTMLSelectElement>(null);

  // Auto-focus select when modal opens
  useEffect(() => {
    if (isOpen && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedInstrument(0);
      setTrackName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = () => {
    onAdd(selectedInstrument, trackName.trim() || undefined);
    onClose();
  };

  // Create instrument options from GM_INSTRUMENTS
  const instrumentOptions = GM_INSTRUMENTS.map((name, index) => ({
    value: index,
    label: name,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        // Close on background click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Track</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Instrument Selection */}
          <div>
            <label
              htmlFor="instrument-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Instrument
            </label>
            <select
              id="instrument-select"
              ref={selectRef}
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {instrumentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Track Name (Optional) */}
          <div>
            <label
              htmlFor="track-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Track Name (Optional)
            </label>
            <input
              id="track-name"
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="Leave empty for auto-generated name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Track
          </button>
        </div>
      </div>
    </div>
  );
}
