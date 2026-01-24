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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Replace current project?
            </h3>
            <p className="text-gray-600 mb-4">
              You have unsaved changes. Importing a new file will replace your current project.
              Export your current work first if you want to keep it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelReimport}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReimport}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
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
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
          <div className="text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mb-2" />
            <p>Processing file...</p>
          </div>
        ) : (
          <>
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">
              Drop a MIDI or MusicXML file here
            </p>
            <p className="text-gray-500 text-sm mt-1">
              or click to browse
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Supports .mid, .midi, .musicxml, .xml
            </p>
          </>
        )}
      </div>
    </div>
  );
}
