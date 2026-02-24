import { useState, useEffect, useCallback } from 'react';
import { Place } from '../types';

const USER_PLACES_STORAGE_KEY = 'santa_village_user_places';

// Helper to generate a unique ID
const generateId = () => `user_place_${new Date().getTime()}_${Math.random()}`;

// Categories that should only have one instance
const SINGLE_INSTANCE_CATEGORIES = ['My Car', 'My Stay'];

export function useUserPlaces() {
  const [userPlaces, setUserPlaces] = useState<Place[]>([]);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const storedPlaces = localStorage.getItem(USER_PLACES_STORAGE_KEY);
      if (storedPlaces) {
        setUserPlaces(JSON.parse(storedPlaces));
      }
    } catch (error) {
      console.error("Failed to load user places from localStorage:", error);
    }
  }, []);

  // Save to localStorage whenever userPlaces changes
  useEffect(() => {
    try {
      localStorage.setItem(USER_PLACES_STORAGE_KEY, JSON.stringify(userPlaces));
    } catch (error) {
      console.error("Failed to save user places to localStorage:", error);
    }
  }, [userPlaces]);

  const addUserPlace = useCallback((place: Omit<Place, 'id'>): Place | null => {
    // Check for duplicates before creating the new place
    if (place.categoryKey === 'Love this') {
      const isDuplicate = userPlaces.some(p => {
        if (p.categoryKey !== 'Love this') return false;
        if (place.originalId) {
          return p.originalId === place.originalId || (!p.originalId && p.name === place.name);
        } else {
          return !p.originalId && p.name === place.name;
        }
      });
      if (isDuplicate) {
        return null;
      }
    }

    const newPlace: Place = {
      id: generateId(),
      ...place,
    };

    setUserPlaces(currentPlaces => {
      // Use categoryKey to identify single instance categories properly regardless of localization
      if (SINGLE_INSTANCE_CATEGORIES.includes(newPlace.categoryKey)) {
        const filteredPlaces = currentPlaces.filter(p => p.categoryKey !== newPlace.categoryKey);
        return [...filteredPlaces, newPlace];
      }
      return [...currentPlaces, newPlace];
    });

    return newPlace;
  }, [userPlaces]);

  const deleteUserPlace = useCallback((placeId: string) => {
    setUserPlaces(currentPlaces => currentPlaces.filter(p => p.id !== placeId));
  }, []);

  const updateUserPlaces = useCallback((newPlaces: Place[]) => {
    setUserPlaces(newPlaces);
  }, []);


  return { userPlaces, addUserPlace, deleteUserPlace, updateUserPlaces };
}