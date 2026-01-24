'use client';

import { useCallback, useState } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { exportAndDownload } from '@/lib/midi/exporter';

export function ExportButton() {
  const { project } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(() => {
    if (!project) return;

    setIsExporting(true);

    try {
      // Generate filename from original or project name
      let filename = project.originalFileName || project.metadata.name || 'export';

      // Remove existing extension if present
      filename = filename.replace(/\.(mid|midi|musicxml|xml)$/i, '');

      exportAndDownload(project, `${filename}.mid`);
    } catch (err) {
      console.error('Export failed:', err);
      // Could show toast/error here in future
    }

    // Small delay to show feedback
    setTimeout(() => setIsExporting(false), 500);
  }, [project]);

  if (!project) {
    return null;
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        transition-colors duration-200
        ${isExporting
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
      `}
    >
      {isExporting ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Export MIDI</span>
        </>
      )}
    </button>
  );
}
