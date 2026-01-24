'use client';

import { useState } from 'react';
import { useProjectStore } from '@/state/projectStore';

export function MetadataDisplay() {
  const { project } = useProjectStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!project) {
    return null;
  }

  const { metadata } = project;
  const firstTempo = metadata.tempos[0];
  const firstTimeSig = metadata.timeSignatures[0];
  const firstKeySig = metadata.keySignatures[0];

  return (
    <div className="w-full">
      {/* Header with current file */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <span className="font-medium text-gray-900 truncate">
            {project.originalFileName || 'Untitled Project'}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            ({project.sourceFormat.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Collapsible Metadata Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium text-gray-700">Project Info</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Tempo */}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Tempo</dt>
                <dd className="text-gray-900 font-medium">
                  {firstTempo ? `${Math.round(firstTempo.bpm)} BPM` : '120 BPM'}
                  {metadata.tempos.length > 1 && (
                    <span className="text-xs text-gray-400 ml-1">
                      (+{metadata.tempos.length - 1} changes)
                    </span>
                  )}
                </dd>
              </div>

              {/* Time Signature */}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Time Signature</dt>
                <dd className="text-gray-900 font-medium">
                  {firstTimeSig ? `${firstTimeSig.numerator}/${firstTimeSig.denominator}` : '4/4'}
                  {metadata.timeSignatures.length > 1 && (
                    <span className="text-xs text-gray-400 ml-1">
                      (+{metadata.timeSignatures.length - 1} changes)
                    </span>
                  )}
                </dd>
              </div>

              {/* Key Signature */}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Key</dt>
                <dd className="text-gray-900 font-medium">
                  {firstKeySig ? `${firstKeySig.key} ${firstKeySig.scale}` : 'Not specified'}
                </dd>
              </div>

              {/* PPQ / Resolution */}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Resolution</dt>
                <dd className="text-gray-900 font-medium">{metadata.ppq} PPQ</dd>
              </div>

              {/* Duration */}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Duration</dt>
                <dd className="text-gray-900 font-medium">
                  {formatDuration(project.durationTicks, metadata.ppq, firstTempo?.bpm || 120)}
                </dd>
              </div>

              {/* Total Tracks */}
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Tracks</dt>
                <dd className="text-gray-900 font-medium">{project.tracks.length}</dd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(ticks: number, ppq: number, bpm: number): string {
  const seconds = (ticks / ppq) * (60 / bpm);
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
