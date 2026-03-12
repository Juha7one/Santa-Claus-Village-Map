import { useState, useEffect } from 'react';
import { Coordinates } from '../types';

export function useUserLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let watchId: number;

    if (navigator.geolocation) {
      // Set initial location quickly
      navigator.geolocation.getCurrentPosition(
        (position) => {
           if (!location) {
             setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
           }
        },
        () => {
          // Fail silently if initial position isn't available
        }
      );

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
          timeout: 5000,
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return { location, error, requestLocation };
}