
import { useState, useEffect } from 'react';
import { Place, LineData, Coordinates, Bounds } from '../types';
import { kmlDataString } from '../data';
import { parseKML } from '../utils/kmlParser';
import { supabase, hasSupabaseConfig } from '../src/lib/supabase';

export function usePlaces(translations: any) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [lines, setLines] = useState<LineData[]>([]);
  const [mapCenter, setMapCenter] = useState<Coordinates>({ lat: 66.543, lng: 25.846 });
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    async function fetchPlacesAndLines() {
      // First, get default KML parsed data as fallback and base setup
      const parsedData = parseKML(kmlDataString, translations);
      setMapCenter(parsedData.mapCenter);
      setBounds(parsedData.bounds);

      // Always use the local KML data directly for lines, as requested.
      setLines(parsedData.lines);

      if (!hasSupabaseConfig) {
        setPlaces(parsedData.places);
        return;
      }

      try {
        const { data: supabasePlaces, error: placesError } = await supabase.from('places').select('*');

        if (placesError || !supabasePlaces) {
          setPlaces(parsedData.places);
        } else {
          const formattedPlaces: Place[] = supabasePlaces.map((sp: any) => ({
            id: sp.id,
            name: sp.name,
            category: sp.category,
            categoryKey: sp.category_key,
            description: sp.description,
            imageUrl: sp.image_url,
            location: { lat: sp.location_lat, lng: sp.location_lng },
            color: sp.color,
            originalId: sp.original_id,
            originalCategoryKey: sp.original_category_key,
            bookingUrl: sp.booking_url,
            linkedWpUrl: sp.linked_wp_url,
            address: sp.address,
            phone: sp.phone,
            email: sp.email,
            website: sp.website,
            openingHours: sp.opening_hours,
            facebookUrl: sp.facebook_url,
            instagramUrl: sp.instagram_url,
            subCategory: sp.sub_category
          }));

          // Filter out KML places that have been customized/overridden in the database
          const customizedOriginalIds = new Set(formattedPlaces.map(p => p.originalId).filter(Boolean));
          const untouchedKmlPlaces = parsedData.places.filter(p => !customizedOriginalIds.has(p.id));

          setPlaces([...untouchedKmlPlaces, ...formattedPlaces]);
        }
      } catch (err) {
        console.warn('Failed to fetch from Supabase, falling back to KML', err);
        setPlaces(parsedData.places);
      }
    }

    fetchPlacesAndLines();
  }, [translations]);

  return { places, lines, mapCenter, bounds };
}