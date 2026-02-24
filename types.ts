export interface Coordinates {
  lat: number;
  lng: number;
}

export type Bounds = [[number, number], [number, number]];

export interface Place {
  id: string;
  name: string;
  category: string;
  categoryKey: string;
  description: string;
  imageUrl: string | null;
  location: Coordinates;
  color?: string;
  originalId?: string;
  originalCategoryKey?: string;
  bookingUrl?: string;
}

export interface LineData {
  id:string;
  name: string;
  category: string;
  categoryKey: string;
  coordinates: Coordinates[];
  color?: string;
}

export interface RouteSegment {
  type: 'road' | 'path';
  geometry: Coordinates[];
  distance: number; // in meters
  duration: number; // in seconds
}