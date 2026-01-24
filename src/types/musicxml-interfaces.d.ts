declare module 'musicxml-interfaces' {
  export function parseScore(xml: string): ScorePartwise | ScoreTimewise;

  export interface ScorePartwise {
    'movement-title'?: string;
    'work'?: { 'work-title'?: string };
    'part-list'?: { 'score-part': ScorePart[] };
    'part'?: Part[];
  }

  export interface ScoreTimewise {
    'movement-title'?: string;
    'measure'?: any[];
  }

  export interface ScorePart {
    'id': string;
    'part-name'?: string;
  }

  export interface Part {
    'id': string;
    'measure'?: Measure[];
  }

  export interface Measure {
    'number': string;
    'attributes'?: Attributes;
    'direction'?: Direction[];
    'note'?: Note[];
  }

  export interface Attributes {
    'divisions'?: number;
    'time'?: { 'beats': string; 'beat-type': string };
    'key'?: { 'fifths': number; 'mode'?: string };
  }

  export interface Direction {
    'sound'?: { 'tempo'?: number };
  }

  export interface Note {
    'pitch'?: { 'step': string; 'alter'?: number; 'octave': number };
    'duration'?: number;
    'type'?: string;
    'rest'?: {};
    'chord'?: {};
  }
}
