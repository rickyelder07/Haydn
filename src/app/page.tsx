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
import { CommandInput } from '@/components/CommandInput';
import { GenerationInput } from '@/components/GenerationInput';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Toaster } from 'sonner';

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

        {/* Natural Language Command Input - conditionally shown */}
        {project && selectedTrackIndex !== null ? (
          <div className="max-w-4xl mx-auto mb-6">
            <CommandInput />
          </div>
        ) : project ? (
          <div className="max-w-4xl mx-auto mb-6 text-center text-gray-500 py-8">
            Select a track to use natural language editing
          </div>
        ) : null}

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

        {/* Empty State - Generation and Upload */}
        {!project && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Generation Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Generate Music from Text
              </h2>
              <GenerationInput />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500">or</span>
              </div>
            </div>

            {/* Upload Section */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload an Existing File
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Import MIDI or MusicXML files to edit
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-400">
          Haydn - Natural Language MIDI Editing
        </div>
      </footer>

      {/* Toast notifications for theory violations and other alerts */}
      <Toaster position="bottom-right" richColors />
    </main>
  );
}
