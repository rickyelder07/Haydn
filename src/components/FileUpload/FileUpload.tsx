'use client';

import { useState, useCallback, useRef } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { parseMidiFile } from '@/lib/midi/parser';
import { convertMusicXmlFile } from '@/lib/musicxml/converter';

const ACCEPTED_EXTENSIONS = ['.mid', '.midi', '.musicxml', '.xml'];
const ACCEPT_STRING = ACCEPTED_EXTENSIONS.join(',');

export function FileUpload() {
  const { project, setProject, setLoading, setError, isLoading } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
      let result;
      if (isMidi) {
        result = await parseMidiFile(file);
      } else {
        result = await convertMusicXmlFile(file);
      }

      if (result.success && result.data) {
        setProject(result.data);
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }

    setLoading(false);
  }, [setProject, setLoading, setError]);

  const handleFile = useCallback((file: File) => {
    // If project exists, show confirmation
    if (project) {
      setPendingFile(file);
      setShowConfirm(true);
    } else {
      processFile(file);
    }
  }, [project, processFile]);

  const confirmReimport = useCallback(() => {
    if (pendingFile) {
      processFile(pendingFile);
    }
    setShowConfirm(false);
    setPendingFile(null);
  }, [pendingFile, processFile]);

  const cancelReimport = useCallback(() => {
    setShowConfirm(false);
    setPendingFile(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="w-full">
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-base font-semibold text-primary mb-2">
              Replace current project?
            </h3>
            <p className="text-secondary text-sm mb-5">
              Importing a new file will replace your current project.
              Export your current work first if you want to keep it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelReimport}
                className="px-4 py-2 text-sm text-secondary hover:text-primary border border-white/10 hover:border-white/20 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReimport}
                className="px-4 py-2 text-sm text-white bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl transition-colors"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-cyan-500/50 bg-cyan-500/5'
            : 'border-white/10 bg-[#131824] hover:border-white/20 hover:bg-[#161d2e]'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="text-secondary">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-white/10 border-t-cyan-500 rounded-full mb-3" />
            <p className="text-sm">Processing file...</p>
          </div>
        ) : (
          <>
            <div className={`mb-4 transition-colors ${isDragging ? 'text-cyan-400' : 'text-white/25'}`}>
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-primary font-medium text-sm mb-1">
              Drop a MIDI or MusicXML file here
            </p>
            <p className="text-secondary text-sm">
              or click to browse
            </p>
            <p className="text-tertiary text-xs mt-3">
              Supports .mid, .midi, .musicxml, .xml
            </p>
          </>
        )}
      </div>
    </div>
  );
}
