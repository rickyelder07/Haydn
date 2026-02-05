/**
 * Genre-specific musical templates for rule-based generation
 *
 * Defines chord progressions, drum patterns, instrumentation, and melodic/bass
 * configurations for each supported genre. Used by generator modules to produce
 * musically coherent MIDI from structured parameters.
 */

// Section types for song structure
export type SectionType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro';

// Drum pattern definition with tick offsets (PPQ=480)
export interface DrumPattern {
  kick: number[];           // Tick offsets for kick drum (MIDI 36)
  snare: number[];          // Tick offsets for snare drum (MIDI 38)
  hihat: number[];          // Tick offsets for closed hi-hat (MIDI 42)
  openHihat: number[];      // Tick offsets for open hi-hat (MIDI 46)
  velocityVariation: number; // 0-1, amount of random velocity variation
}

// Melody generation configuration
export interface MelodyConfig {
  noteDensityRange: [number, number]; // Min/max notes per bar
  stepwiseRatio: number;              // 0-1, preference for stepwise motion
  octaveRange: [number, number];      // MIDI octave range
}

// Bass generation configuration
export interface BassConfig {
  rhythmStyle: 'root-notes' | 'walking' | 'arpeggiated';
  octave: number; // MIDI octave for bass notes
}

// Complete genre template
export interface GenreTemplate {
  name: string;
  chordProgressions: Record<SectionType, string[][]>; // Roman numerals
  drumPatterns: Record<SectionType, DrumPattern>;
  defaultInstrumentation: {
    drums: number;   // GM program number (0 for standard kit)
    bass: number;    // GM program number
    chords: number;  // GM program number
    melody: number;  // GM program number
  };
  melodyConfig: MelodyConfig;
  bassConfig: BassConfig;
}

// Genre template database
export const GENRE_TEMPLATES: Record<string, GenreTemplate> = {
  lofi: {
    name: 'lofi',
    chordProgressions: {
      verse: [
        ['ii7', 'V7', 'Imaj7', 'vi7'],
        ['Imaj7', 'IVmaj7', 'vi7', 'V7']
      ],
      chorus: [
        ['IVmaj7', 'V7', 'iii7', 'vi7'],
        ['Imaj7', 'vi7', 'IVmaj7', 'V7']
      ],
      bridge: [
        ['iii7', 'vi7', 'ii7', 'V7']
      ],
      intro: [
        ['Imaj7', 'vi7', 'IVmaj7', 'V7']
      ],
      outro: [
        ['ii7', 'V7', 'Imaj7', 'Imaj7']
      ]
    },
    drumPatterns: {
      verse: {
        kick: [0, 960],           // Beats 1 and 3
        snare: [480, 1440],       // Beats 2 and 4
        hihat: [0, 480, 960, 1440], // Quarter notes
        openHihat: [],
        velocityVariation: 0.15
      },
      chorus: {
        kick: [0, 960],
        snare: [480, 1440],
        hihat: [0, 480, 960, 1440],
        openHihat: [960],         // Accent on beat 3
        velocityVariation: 0.15
      },
      bridge: {
        kick: [0, 960],
        snare: [480, 1440],
        hihat: [0, 480, 960, 1440],
        openHihat: [],
        velocityVariation: 0.15
      },
      intro: {
        kick: [0],                // Sparse intro
        snare: [1440],
        hihat: [0, 480, 960, 1440],
        openHihat: [],
        velocityVariation: 0.15
      },
      outro: {
        kick: [0],
        snare: [],
        hihat: [0, 960],          // Sparse outro
        openHihat: [],
        velocityVariation: 0.15
      }
    },
    defaultInstrumentation: {
      drums: 0,
      bass: 33,  // Electric bass (finger)
      chords: 4, // Electric piano 1
      melody: 11 // Vibraphone
    },
    melodyConfig: {
      noteDensityRange: [4, 8],
      stepwiseRatio: 0.7,
      octaveRange: [4, 5]
    },
    bassConfig: {
      rhythmStyle: 'root-notes',
      octave: 2
    }
  },

  trap: {
    name: 'trap',
    chordProgressions: {
      verse: [
        ['i', 'VI', 'III', 'VII'],
        ['i', 'iv', 'VI', 'VII']
      ],
      chorus: [
        ['i', 'VII', 'VI', 'V'],
        ['i', 'iv', 'VII', 'III']
      ],
      bridge: [
        ['VI', 'VII', 'i', 'i']
      ],
      intro: [
        ['i', 'VI', 'VII', 'VII']
      ],
      outro: [
        ['i', 'VII', 'i', 'i']
      ]
    },
    drumPatterns: {
      verse: {
        kick: [0, 720, 960, 1680],           // Irregular pattern
        snare: [480, 1440],                  // Beats 2 and 4
        hihat: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800], // 16th notes
        openHihat: [],
        velocityVariation: 0.2
      },
      chorus: {
        kick: [0, 720, 960, 1680],
        snare: [480, 1440],
        hihat: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800],
        openHihat: [1800],                   // Fast roll accent
        velocityVariation: 0.2
      },
      bridge: {
        kick: [0, 960],
        snare: [480, 1440],
        hihat: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800],
        openHihat: [],
        velocityVariation: 0.2
      },
      intro: {
        kick: [],
        snare: [],
        hihat: [0, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560, 1680, 1800],
        openHihat: [],
        velocityVariation: 0.2
      },
      outro: {
        kick: [0],
        snare: [1440],
        hihat: [0, 480, 960, 1440],
        openHihat: [],
        velocityVariation: 0.2
      }
    },
    defaultInstrumentation: {
      drums: 0,
      bass: 38,  // Synth bass 1
      chords: 90, // Pad 3 (polysynth)
      melody: 81  // Lead 2 (sawtooth)
    },
    melodyConfig: {
      noteDensityRange: [6, 12],
      stepwiseRatio: 0.5,
      octaveRange: [4, 5]
    },
    bassConfig: {
      rhythmStyle: 'root-notes',
      octave: 1  // Deep 808-style bass
    }
  },

  'boom-bap': {
    name: 'boom-bap',
    chordProgressions: {
      verse: [
        ['ii7', 'V7', 'Imaj7', 'Imaj7'],
        ['i7', 'iv7', 'i7', 'V7']
      ],
      chorus: [
        ['IVmaj7', 'iii7', 'vi7', 'V7'],
        ['Imaj7', 'IVmaj7', 'V7', 'Imaj7']
      ],
      bridge: [
        ['ii7', 'V7', 'iii7', 'vi7']
      ],
      intro: [
        ['Imaj7', 'IVmaj7', 'V7', 'V7']
      ],
      outro: [
        ['ii7', 'V7', 'Imaj7', 'Imaj7']
      ]
    },
    drumPatterns: {
      verse: {
        kick: [0, 720],              // Boom-bap rhythm
        snare: [480, 1440],          // Bap
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680], // 8th notes
        openHihat: [],
        velocityVariation: 0.1
      },
      chorus: {
        kick: [0, 720],
        snare: [480, 1440],
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680],
        openHihat: [1680],           // Accent
        velocityVariation: 0.1
      },
      bridge: {
        kick: [0, 960],
        snare: [480, 1440],
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680],
        openHihat: [],
        velocityVariation: 0.1
      },
      intro: {
        kick: [0],
        snare: [],
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680],
        openHihat: [],
        velocityVariation: 0.1
      },
      outro: {
        kick: [0],
        snare: [1440],
        hihat: [0, 480, 960],
        openHihat: [],
        velocityVariation: 0.1
      }
    },
    defaultInstrumentation: {
      drums: 0,
      bass: 33,  // Electric bass (finger)
      chords: 4, // Electric piano 1
      melody: 65 // Alto sax
    },
    melodyConfig: {
      noteDensityRange: [4, 8],
      stepwiseRatio: 0.65,
      octaveRange: [4, 5]
    },
    bassConfig: {
      rhythmStyle: 'walking',
      octave: 2
    }
  },

  jazz: {
    name: 'jazz',
    chordProgressions: {
      verse: [
        ['ii7', 'V7', 'Imaj7', 'vi7'],
        ['iii7', 'VI7', 'ii7', 'V7']
      ],
      chorus: [
        ['Imaj7', 'vi7', 'ii7', 'V7'],
        ['IVmaj7', 'iv7', 'iii7', 'VI7']
      ],
      bridge: [
        ['bIIImaj7', 'bVImaj7', 'ii7', 'V7']
      ],
      intro: [
        ['ii7', 'V7', 'Imaj7', 'Imaj7']
      ],
      outro: [
        ['ii7', 'V7', 'Imaj7', 'Imaj7']
      ]
    },
    drumPatterns: {
      verse: {
        kick: [0, 960],              // Sparse kick
        snare: [720, 1680],          // Light ghost notes
        hihat: [0, 480, 960, 1440],  // Ride pattern (using hihat)
        openHihat: [],
        velocityVariation: 0.25
      },
      chorus: {
        kick: [0, 960],
        snare: [720, 1680],
        hihat: [0, 480, 960, 1440],
        openHihat: [1440],
        velocityVariation: 0.25
      },
      bridge: {
        kick: [0, 960],
        snare: [720, 1680],
        hihat: [0, 480, 960, 1440],
        openHihat: [],
        velocityVariation: 0.25
      },
      intro: {
        kick: [0],
        snare: [],
        hihat: [0, 480, 960, 1440],
        openHihat: [],
        velocityVariation: 0.25
      },
      outro: {
        kick: [0],
        snare: [1440],
        hihat: [0, 960],
        openHihat: [],
        velocityVariation: 0.25
      }
    },
    defaultInstrumentation: {
      drums: 0,
      bass: 32,  // Acoustic bass
      chords: 0, // Acoustic grand piano
      melody: 66 // Tenor sax
    },
    melodyConfig: {
      noteDensityRange: [8, 16],
      stepwiseRatio: 0.4,  // Jazz allows larger leaps
      octaveRange: [4, 5]
    },
    bassConfig: {
      rhythmStyle: 'walking',
      octave: 2
    }
  },

  classical: {
    name: 'classical',
    chordProgressions: {
      verse: [
        ['I', 'IV', 'V', 'I'],
        ['I', 'vi', 'IV', 'V']
      ],
      chorus: [
        ['IV', 'V', 'vi', 'IV'],
        ['I', 'V', 'vi', 'IV']
      ],
      bridge: [
        ['ii', 'V', 'I', 'I']
      ],
      intro: [
        ['I', 'IV', 'I', 'V']
      ],
      outro: [
        ['IV', 'V', 'I', 'I']
      ]
    },
    drumPatterns: {
      verse: {
        kick: [],
        snare: [],
        hihat: [],
        openHihat: [],
        velocityVariation: 0
      },
      chorus: {
        kick: [],
        snare: [],
        hihat: [],
        openHihat: [],
        velocityVariation: 0
      },
      bridge: {
        kick: [],
        snare: [],
        hihat: [],
        openHihat: [],
        velocityVariation: 0
      },
      intro: {
        kick: [],
        snare: [],
        hihat: [],
        openHihat: [],
        velocityVariation: 0
      },
      outro: {
        kick: [],
        snare: [],
        hihat: [],
        openHihat: [],
        velocityVariation: 0
      }
    },
    defaultInstrumentation: {
      drums: 0,
      bass: 42,  // Cello
      chords: 0, // Acoustic grand piano
      melody: 40 // Violin
    },
    melodyConfig: {
      noteDensityRange: [8, 12],
      stepwiseRatio: 0.75,
      octaveRange: [4, 6]
    },
    bassConfig: {
      rhythmStyle: 'arpeggiated',
      octave: 2
    }
  },

  pop: {
    name: 'pop',
    chordProgressions: {
      verse: [
        ['I', 'V', 'vi', 'IV'],
        ['I', 'IV', 'vi', 'V']
      ],
      chorus: [
        ['IV', 'V', 'I', 'I'],
        ['I', 'V', 'vi', 'IV']
      ],
      bridge: [
        ['vi', 'IV', 'I', 'V']
      ],
      intro: [
        ['I', 'V', 'vi', 'IV']
      ],
      outro: [
        ['I', 'IV', 'I', 'I']
      ]
    },
    drumPatterns: {
      verse: {
        kick: [0, 960],                  // Beats 1 and 3
        snare: [480, 1440],              // Beats 2 and 4
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680], // 8th notes
        openHihat: [],
        velocityVariation: 0.1
      },
      chorus: {
        kick: [0, 960],
        snare: [480, 1440],
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680],
        openHihat: [1680],
        velocityVariation: 0.1
      },
      bridge: {
        kick: [0, 960],
        snare: [480, 1440],
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680],
        openHihat: [],
        velocityVariation: 0.1
      },
      intro: {
        kick: [0],
        snare: [],
        hihat: [0, 240, 480, 720, 960, 1200, 1440, 1680],
        openHihat: [],
        velocityVariation: 0.1
      },
      outro: {
        kick: [0],
        snare: [1440],
        hihat: [0, 480, 960],
        openHihat: [],
        velocityVariation: 0.1
      }
    },
    defaultInstrumentation: {
      drums: 0,
      bass: 33,  // Electric bass (finger)
      chords: 0, // Acoustic grand piano
      melody: 0  // Acoustic grand piano
    },
    melodyConfig: {
      noteDensityRange: [4, 8],
      stepwiseRatio: 0.7,
      octaveRange: [4, 5]
    },
    bassConfig: {
      rhythmStyle: 'root-notes',
      octave: 2
    }
  }
};
