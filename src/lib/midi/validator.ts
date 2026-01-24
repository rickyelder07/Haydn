export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileSize?: number;
}

// MIDI files start with "MThd" header (4D 54 68 64 in hex)
const MIDI_HEADER = new Uint8Array([0x4D, 0x54, 0x68, 0x64]);

// Maximum file size we'll attempt to parse (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function validateMidiFile(file: File): Promise<ValidationResult> {
  // Check file extension first (quick check)
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension !== 'mid' && extension !== 'midi') {
    return {
      valid: false,
      error: `Invalid file extension ".${extension}". Expected .mid or .midi`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
      fileSize: file.size,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
      fileSize: 0,
    };
  }

  // Read first 4 bytes to check MIDI header
  try {
    const headerBuffer = await file.slice(0, 4).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);

    const isValidHeader = headerBytes.every(
      (byte, index) => byte === MIDI_HEADER[index]
    );

    if (!isValidHeader) {
      return {
        valid: false,
        error: 'File does not have a valid MIDI header. The file may be corrupted or not a MIDI file.',
        fileSize: file.size,
      };
    }

    return {
      valid: true,
      fileSize: file.size,
    };
  } catch (err) {
    return {
      valid: false,
      error: 'Could not read file. Please try again.',
    };
  }
}

// Utility to check if ArrayBuffer has valid MIDI header
export function hasValidMidiHeader(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const header = new Uint8Array(buffer, 0, 4);
  return header.every((byte, index) => byte === MIDI_HEADER[index]);
}
