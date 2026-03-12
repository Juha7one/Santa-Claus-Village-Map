import { useState, useEffect } from 'react';
import { Coordinates } from '../types';

export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    if (navigator.geolocation) {
      // 1. Try to get a cached location immediately (very fast)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 } // 10 min old cache is fine for start
      );

      // 2. Start watching for real-time updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setError(null);
        },
        (err) => {
          console.warn(`Geolocation error: ${err.message}.`);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
    
    return () => {
      if(watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    // Force prompt or fresh lookup
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        console.warn("Manual location request failed:", err.message);
        setError(err.message);
      },
      // More relaxed options for faster response
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return { location, error, requestLocation };
}