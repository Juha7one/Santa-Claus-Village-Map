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
  const [version, setVersion] = useState(0);

  const refresh = () => setVersion(v => v + 1);

  useEffect(() => {
    async function fetchPlacesAndLines() {
      // 1. Parse KML ONLY for Lines and Basic Setup (Center/Bounds)
      const parsedData = parseKML(kmlDataString, translations);
      setMapCenter(parsedData.mapCenter);
      setLines(parsedData.lines);

      // Calculate village-specific bounds from paths/facilities lines.
      const villageLines = parsedData.lines.filter(l => l.categoryKey === 'Paths' || l.categoryKey === 'Facilities');
      if (villageLines.length > 0) {
        const points = villageLines.flatMap(l => l.coordinates);
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        points.forEach(p => {
          minLat = Math.min(minLat, p.lat);
          maxLat = Math.max(maxLat, p.lat);
          minLng = Math.min(minLng, p.lng);
          maxLng = Math.max(maxLng, p.lng);
        });
        setBounds([[minLat, minLng], [maxLat, maxLng]]);
      } else {
        setBounds(parsedData.bounds);
      }

      // 2. Fetch ALL Points from Supabase
      if (!hasSupabaseConfig) {
        // Fallback to KML only if no database config is found (emergency mode)
        setPlaces(parsedData.places);
        return;
      }

      try {
        const { data: supabasePlaces, error: placesError } = await supabase
          .from('places')
          .select('*')
          .is('is_deleted', false); // Only fetch non-deleted places

        if (placesError || !supabasePlaces) {
          console.warn('Database fetch failed, markers might be missing', placesError);
          // If DB fails, we still show KML as a safety net? 
          // User said "all should be in Supabase", so if DB fails it's an error.
          // But let's fallback to KML points just so the app isn't empty on network error.
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
            subCategory: sp.sub_category,
            status: sp.status
          }));

          // SUCCESS: Use ONLY the database points. 
          // The migration tool ensures all KML points are now in the database.
          setPlaces(formattedPlaces);
        }
      } catch (err) {
        console.warn('Failed to fetch from Supabase, falling back to KML', err);
        setPlaces(parsedData.places);
      }
    }

    fetchPlacesAndLines();
  }, [translations, version]);

  return { places, lines, mapCenter, bounds, refresh };
}