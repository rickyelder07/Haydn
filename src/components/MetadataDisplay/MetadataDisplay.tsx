'use client';

import { useState } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { InlineEdit } from '@/components/InlineEdit';

export function MetadataDisplay() {
  const { project, updateProjectName } = useProjectStore();
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
          <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <InlineEdit
            value={project.originalFileName || 'Untitled Project'}
            onSave={(name) => updateProjectName(name)}
            className="font-medium text-primary"
          />
          <span className="text-xs text-tertiary flex-shrink-0">
            ({project.sourceFormat.toUpperCase()})
          </span>
        </div>
      </div>

      {/* Collapsible Metadata Section */}
      <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <span className="font-medium text-secondary">Project Info</span>
          <svg
            className={`w-5 h-5 text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Tempo */}
              <div>
                <dt className="text-xs text-tertiary uppercase tracking-wide mono">Tempo</dt>
                <dd className="text-primary font-medium mt-1">
                  {firstTempo ? `${Math.round(firstTempo.bpm)} BPM` : '120 BPM'}
                  {metadata.tempos.length > 1 && (
                    <span className="text-xs text-tertiary ml-1">
                      (+{metadata.tempos.length - 1} changes)
                    </span>
                  )}
                </dd>
              </div>

              {/* Time Signature */}
              <div>
                <dt className="text-xs text-tertiary uppercase tracking-wide mono">Time Signature</dt>
                <dd className="text-primary font-medium mt-1">
                  {firstTimeSig ? `${firstTimeSig.numerator}/${firstTimeSig.denominator}` : '4/4'}
                  {metadata.timeSignatures.length > 1 && (
                    <span className="text-xs text-tertiary ml-1">
                      (+{metadata.timeSignatures.length - 1} changes)
                    </span>
                  )}
                </dd>
              </div>

              {/* Key Signature */}
              <div>
                <dt className="text-xs text-tertiary uppercase tracking-wide mono">Key</dt>
                <dd className="text-primary font-medium mt-1">
                  {firstKeySig ? `${firstKeySig.key} ${firstKeySig.scale}` : 'Not specified'}
                </dd>
              </div>

              {/* PPQ / Resolution */}
              <div>
                <dt className="text-xs text-tertiary uppercase tracking-wide mono">Resolution</dt>
                <dd className="text-primary font-medium mt-1">{metadata.ppq} PPQ</dd>
              </div>

              {/* Duration */}
              <div>
                <dt className="text-xs text-tertiary uppercase tracking-wide mono">Duration</dt>
                <dd className="text-primary font-medium mt-1">
                  {formatDuration(project.durationTicks, metadata.ppq, firstTempo?.bpm || 120)}
                </dd>
              </div>

              {/* Total Tracks */}
              <div>
                <dt className="text-xs text-tertiary uppercase tracking-wide mono">Tracks</dt>
                <dd className="text-primary font-medium mt-1">{project.tracks.length}</dd>
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
