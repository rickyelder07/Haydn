'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { FileUpload } from '@/components/FileUpload';
import { TrackList } from '@/components/TrackList';
import { MetadataDisplay } from '@/components/MetadataDisplay';
import { ExportButton } from '@/components/ExportButton';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { TransportControls } from '@/components/TransportControls';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
  const { project } = useProjectStore();
  const { loadProject } = usePlaybackStore();

  // Add keyboard shortcuts
  useKeyboardShortcuts();

  // Load project into playback engine when project changes
  useEffect(() => {
    if (project) {
      loadProject(project);
    }
  }, [project, loadProject]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Haydn
          </h1>
          {project && <ExportButton />}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Display */}
        <div className="mb-6">
          <ErrorDisplay />
        </div>

        {/* File Upload - always visible */}
        <div className="mb-8">
          <FileUpload />
        </div>

        {/* Transport Controls - only when project loaded */}
        {project && (
          <div className="mb-6">
            <TransportControls />
          </div>
        )}

        {/* Project Content - only when project loaded */}
        {project && (
          <div className="space-y-8">
            {/* Metadata Section */}
            <MetadataDisplay />

            {/* Track List */}
            <TrackList />
          </div>
        )}

        {/* Empty State */}
        {!project && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Upload a MIDI or MusicXML file to get started
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-400">
          Haydn - Natural Language MIDI Editing
        </div>
      </footer>
    </main>
  );
}
