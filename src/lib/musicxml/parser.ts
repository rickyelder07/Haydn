import { parseScore, ScoreTimewise, ScorePartwise } from 'musicxml-interfaces';
import type { ParseResult } from '@/lib/midi/types';

export interface MusicXmlParseResult {
  document: ScoreTimewise | ScorePartwise;
  isTimewise: boolean;
}

/**
 * Validate MusicXML file before parsing
 */
export function validateMusicXmlFile(file: File): { valid: boolean; error?: string } {
  const extension = file.name.toLowerCase().split('.').pop();

  // Accept .musicxml and .xml extensions
  if (extension !== 'musicxml' && extension !== 'xml') {
    return {
      valid: false,
      error: `Invalid file extension ".${extension}". Expected .musicxml or .xml`,
    };
  }

  // Size check (MusicXML files can be larger than MIDI, allow 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Parse a MusicXML file
 */
export async function parseMusicXmlFile(
  file: File
): Promise<ParseResult<MusicXmlParseResult>> {
  // Validate first
  const validation = validateMusicXmlFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    const text = await file.text();

    // Quick check that it looks like XML
    if (!text.trim().startsWith('<?xml') && !text.trim().startsWith('<')) {
      return {
        success: false,
        error: 'File does not appear to be valid XML',
      };
    }

    // Parse with musicxml-interfaces
    const document = parseScore(text);

    // Determine if timewise or partwise
    // musicxml-interfaces returns ScorePartwise for most files
    const isTimewise = 'measure' in document && Array.isArray((document as any).measure);

    return {
      success: true,
      data: {
        document,
        isTimewise,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error';
    return {
      success: false,
      error: `Failed to parse MusicXML: ${message}`,
    };
  }
}

/**
 * Parse MusicXML from string (for testing)
 */
export function parseMusicXmlFromString(
  xml: string,
  fileName: string = 'Untitled.musicxml'
): ParseResult<MusicXmlParseResult> {
  try {
    if (!xml.trim().startsWith('<?xml') && !xml.trim().startsWith('<')) {
      return {
        success: false,
        error: 'String does not appear to be valid XML',
      };
    }

    const document = parseScore(xml);
    const isTimewise = 'measure' in document && Array.isArray((document as any).measure);

    return {
      success: true,
      data: {
        document,
        isTimewise,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error';
    return {
      success: false,
      error: `Failed to parse MusicXML: ${message}`,
    };
  }
}
