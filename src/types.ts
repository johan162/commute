

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CommuteRecord {
  id: number;
  date: string;
  duration: number; // in seconds
}

export type View = 'main' | 'stats' | 'history' | 'settings';