

import { useState, useEffect } from 'react';
import { Place, LineData, Coordinates, Bounds } from '../types';
import { kmlDataString } from '../data';
import { parseKML } from '../utils/kmlParser';

export function usePlaces(translations: any) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 66.543, lng: 25.846 });
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    // Load from KML with the provided translations
    const parsedData = parseKML(kmlDataString, translations);
    setPlaces(parsedData.places);
    setLines(parsedData.lines);
    setMapCenter(parsedData.mapCenter);
    setBounds(parsedData.bounds);
  }, [translations]);

  return { places, lines, mapCenter, bounds };
}