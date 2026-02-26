'use client';

import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useProjectStore } from '@/state/projectStore';
import { parseMidiFile } from '@/lib/midi/parser';
import { convertMusicXmlFile } from '@/lib/musicxml/converter';

const ACCEPT_STRING = '.mid,.midi,.musicxml,.xml';

export function NewProjectButton() {
  const { project, loadNewProject, setLoading, setError } = useProjectStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    const extension = file.name.toLowerCase().split('.').pop();
    const isMidi = extension === 'mid' || extension === 'midi';
    const isMusicXml = extension === 'musicxml' || extension === 'xml';

    if (!isMidi && !isMusicXml) {
      setError(`Unsupported file type ".${extension}". Please upload a MIDI (.mid) or MusicXML (.musicxml) file.`);
      setLoading(false);
      return;
    }

    try {
      const result = isMidi
        ? await parseMidiFile(file)
        : await convertMusicXmlFile(file);

      if (result.success && result.data) {
        loadNewProject(result.data);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }

    setLoading(false);
  }, [loadNewProject, setLoading, setError]);

  const handleClick = () => {
    if (project) {
      setShowConfirm(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 bg-white/5 border border-white/10 text-secondary hover:bg-white/10 hover:text-primary hover:border-white/20"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>New Project</span>
      </button>

      {/* Confirmation dialog — portalled to document.body to escape backdrop-filter stacking context */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Replace current project?
            </h3>
            <p className="text-secondary text-sm mb-6">
              You have unsaved changes. Importing a new file will replace your current project.
              Export your current work first if you want to keep it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-secondary hover:text-primary hover:bg-white/5 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all text-sm font-medium"
              >
                Replace
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
