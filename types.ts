export interface Coordinates {
  lat: number;
  lng: number;
}

export type Bounds = [[number, number], [number, number]];

export type LocalizedString = string | Record<string, string>;

export interface Place {
  id: string;
  name: LocalizedString;
  category: string;
  categoryKey: string;
  description: LocalizedString;
  imageUrl: string | null;
  location: Coordinates;
  color?: string;
  originalId?: string;
  originalCategoryKey?: string;
  bookingUrl?: string;
  linkedWpUrl?: string;
  address?: LocalizedString;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: LocalizedString;
  facebookUrl?: string;
  instagramUrl?: string;
  subCategory?: string;
}

export interface LineData {
  id: string;
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