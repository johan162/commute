

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;  // GPS accuracy in meters
}

export interface WorkLocation extends Coordinates {
  timestamp: string;
  accuracy: number;   // Required for work locations
}

export interface CommuteRecord {
  id: number;
  date: string;
  duration: number; // in seconds
}

export type View = 'main' | 'stats' | 'history' | 'challenge' | 'settings';

export type DebounceMode = 'disable-button' | 'discard-record';