'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { usePlaybackStore } from '@/state/playbackStore';
import { useEditStore } from '@/state/editStore';
import { FileUpload } from '@/components/FileUpload';
import { TrackList } from '@/components/TrackList';
import { MetadataDisplay } from '@/components/MetadataDisplay';
import { ExportButton } from '@/components/ExportButton';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PianoRollEditor } from '@/components/PianoRoll';
import { GenerationInput } from '@/components/GenerationInput';
import { FloatingEditPanel } from '@/components/FloatingEditPanel';
import { FloatingDebugPanel } from '@/components/FloatingDebugPanel';
import { Sidebar } from '@/components/Sidebar';
import { NewProjectButton } from '@/components/NewProjectButton';
import { InlineEdit } from '@/components/InlineEdit';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Toaster } from 'sonner';

export default function Home() {
  const { project, updateProjectName, error, projectLoadId } = useProjectStore();
  const { loadProject } = usePlaybackStore();
  const { selectedTrackIndex, selectTrack } = useEditStore();
  const [showAiEditor, setShowAiEditor] = useState(true);

  // Add keyboard shortcuts
  useKeyboardShortcuts();

  // Load project into playback engine only when a new project is loaded.
  // Depends on projectLoadId (bumped by loadNewProject) rather than the project
  // object itself, so note edits don't reinitialize the audio engine.
  useEffect(() => {
    if (project) {
      loadProject(project);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectLoadId, loadProject]);

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
    <div className="flex flex-col h-screen overflow-hidden relative">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-1 h-1 rounded-full bg-cyan-400/20"
          style={{
            top: '20%',
            left: '10%',
            animation: 'particle-float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-purple-400/20"
          style={{
            top: '60%',
            left: '80%',
            animation: 'particle-float 10s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute w-1 h-1 rounded-full bg-amber-400/20"
          style={{
            top: '40%',
            left: '50%',
            animation: 'particle-float 12s ease-in-out infinite 4s',
          }}
        />
      </div>

      {/* Header - spans full width */}
      <header className="relative z-10 glass-panel border-b border-white/5 shrink-0">
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Logo/Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-gradient">Haydn</span>
              </h1>
            </div>
            {project && (
              <div className="ml-4 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-xs font-medium text-cyan-400 mono">PROJECT LOADED</span>
              </div>
            )}
            {project && (
              <div className="hidden sm:flex items-center gap-1.5 group">
                <InlineEdit
                  value={project.originalFileName || 'Untitled Project'}
                  onSave={(name) => updateProjectName(name)}
                  className="text-sm text-secondary mono"
                  inputClassName="text-sm mono"
                />
                <svg
                  className="w-3 h-3 text-tertiary group-hover:text-cyan-400/60 transition-colors pointer-events-none flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Double-click to rename"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            )}
          </div>
          {project ? (
            <div className="flex items-center gap-3">
              <NewProjectButton />
              <ExportButton />
            </div>
          ) : null}
        </div>
      </header>

      {/* Body: Sidebar + Main Content */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Sidebar with project info (only shown when project loaded) */}
        {project && (
          <Sidebar>
            <TrackList />
          </Sidebar>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {project ? (
            <>
              {/* Error Display — only rendered when there is an error */}
              {error && (
                <div className="px-4 pt-2">
                  <ErrorDisplay />
                </div>
              )}

              {/* Piano Roll Editor — edge-to-edge */}
              {selectedTrackIndex !== null && (
                <PianoRollEditor />
              )}

            </>
          ) : (
            /* Empty State - Generation and Upload */
            <div className="px-6 py-8">
              <div className="max-w-4xl mx-auto space-y-10">
                {/* Generation Section */}
                <div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-4">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                      <span className="text-xs font-medium text-cyan-300 mono">AI-POWERED GENERATION</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">
                      <span className="text-gradient">Create Music from Text</span>
                    </h2>
                    <p className="text-secondary text-sm">Describe your musical idea and let AI compose it for you</p>
                  </div>
                  <GenerationInput />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-6 bg-primary text-tertiary font-medium">OR</span>
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs font-medium text-amber-300 mono">IMPORT EXISTING</span>
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">
                      Upload Your Files
                    </h2>
                    <p className="text-secondary text-sm">
                      Import MIDI or MusicXML files to edit with AI
                    </p>
                  </div>
                  <FileUpload />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="border-t border-white/5 mt-auto shrink-0">
            {project ? (
              <div className="px-4 py-1 flex items-center justify-between">
                <span className="text-[10px] text-white/20 mono tracking-widest">HAYDN</span>
                <button
                  onClick={() => setShowAiEditor((v) => !v)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors text-xs ${
                    showAiEditor
                      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15'
                      : 'bg-white/5 border-white/10 text-tertiary hover:bg-white/10 hover:text-secondary'
                  }`}
                  title={showAiEditor ? 'Hide AI Editor' : 'Show AI Editor'}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span>AI Editor</span>
                </button>
              </div>
            ) : (
              <div className="px-6 py-6">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="mono">HAYDN</span>
                    <span>•</span>
                    <span>AI-Powered MIDI Editing</span>
                  </div>
                  <div className="flex items-center gap-4 text-tertiary">
                    <span className="hover:text-cyan-400 transition-colors cursor-pointer">About</span>
                    <span className="hover:text-cyan-400 transition-colors cursor-pointer">Docs</span>
                    <span className="hover:text-cyan-400 transition-colors cursor-pointer">Support</span>
                  </div>
                </div>
              </div>
            )}
          </footer>
        </main>
      </div>

      {/* Floating AI Editor — toggled via the footer AI Editor button */}
      {project && showAiEditor && <FloatingEditPanel />}

      {/* Floating generation log — persists through project load */}
      <FloatingDebugPanel />

      {/* Toast notifications for theory violations and other alerts */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
