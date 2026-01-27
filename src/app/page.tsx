'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { useEditStore } from '@/state/editStore';
import { FileUpload } from '@/components/FileUpload';
import { TrackList } from '@/components/TrackList';
import { MetadataDisplay } from '@/components/MetadataDisplay';
import { ExportButton } from '@/components/ExportButton';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { TransportControls } from '@/components/TransportControls';
import { PianoRollEditor } from '@/components/PianoRoll';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
  const { project } = useProjectStore();
  const { loadProject } = usePlaybackStore();
  const { selectedTrackIndex, selectTrack } = useEditStore();

  // Add keyboard shortcuts
  useKeyboardShortcuts();

  // Load project into playback engine when project changes
  useEffect(() => {
    if (project) {
      loadProject(project);
    }
  }, [project, loadProject]);

  // Auto-select first track with notes when project loads
  useEffect(() => {
    if (project && selectedTrackIndex === null) {
      // Find first track with notes
      const firstTrackIndex = project.tracks.findIndex(track => track.notes.length > 0);
      if (firstTrackIndex !== -1) {
        selectTrack(firstTrackIndex);
      }
    }
  }, [project, selectedTrackIndex, selectTrack]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Haydn
          </h1>
          {project && <ExportButton />}
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full px-4 py-8">
        {/* Error Display - centered */}
        <div className="max-w-4xl mx-auto mb-6">
          <ErrorDisplay />
        </div>

        {/* File Upload - centered */}
        <div className="max-w-4xl mx-auto mb-8">
          <FileUpload />
        </div>

        {/* Transport Controls - wider for piano roll */}
        {project && (
          <div className="max-w-7xl mx-auto mb-6">
            <TransportControls />
          </div>
        )}

        {/* Piano Roll Editor - full width when track selected */}
        {project && selectedTrackIndex !== null && (
          <div className="max-w-7xl mx-auto mb-6">
            <PianoRollEditor />
          </div>
        )}

        {/* Project Content - centered */}
        {project && (
          <div className="max-w-4xl mx-auto space-y-8">
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
