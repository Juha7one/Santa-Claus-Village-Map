import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import L from 'leaflet';
import Header from './components/Header';
import MapView from './components/MapView';
import AdminPanel from './components/AdminPanel';
import AdminMapSettings from './components/AdminMapSettings';
import AdminBulkSync from './components/AdminBulkSync';
import PlacePopup from './components/PlacePopup';
import { usePlaces } from './hooks/usePlaces';
import { useUserPlaces } from './hooks/useUserPlaces';
import { useUserLocation } from './hooks/useUserLocation';
import { useTranslations } from './hooks/useTranslations';
import { Place, Coordinates, RouteSegment } from './types';
import { getRoute, calculateWalkingRoute, calculateDistance } from './utils/routing';

export type ViewState = 'initial' | 'route' | 'all-places' | 'category-view' | 'manual';

function App() {
  const t = useTranslations();
  const { places, lines, mapCenter, bounds } = usePlaces(t);
  const { userPlaces, addUserPlace, deleteUserPlace, updateUserPlaces } = useUserPlaces();
  const { location: userLocation } = useUserLocation();

  const [route, setRoute] = useState<{ start: Coordinates, end: Coordinates } | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<{ segments: RouteSegment[], mode: 'walk' | 'car', bestParking: Place | null } | null>(null);

  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<Coordinates | null>(null);
  const [placeTypeToAdd, setPlaceTypeToAdd] = useState<string | null>(null);

  const [showFavouritesRoute, setShowFavouritesRoute] = useState(false);
  const [favouriteRouteSegments, setFavouriteRouteSegments] = useState<RouteSegment[] | null>(null);

  const [viewState, setViewState] = useState<ViewState>('initial');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [animatedPlaceId, setAnimatedPlaceId] = useState<string | null>(null);

  const [isFollowingUser, setIsFollowingUser] = useState(false);

  const [isDbAdminMode, setIsDbAdminMode] = useState(false);
  const [dbAdminClickedCoords, setDbAdminClickedCoords] = useState<Coordinates | null>(null);
  const [isVillageFocused, setIsVillageFocused] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const initialUrlCheckDone = useRef(false);

  const routeCategoriesForCount = useMemo(() => ['Love this', 'My Car', 'My Stay'], []);
  const favouritePlacesCount = useMemo(() =>
    (userPlaces || []).filter(p => p && routeCategoriesForCount.includes(p.categoryKey)).length
    , [userPlaces, routeCategoriesForCount]);
  const prevFavouritePlacesCount = useRef(favouritePlacesCount);

  // Effect to automatically show the favourites route when the user adds a second favourite item.
  // It will also hide the route if the number of items drops below two.
  useEffect(() => {
    // Turn on by default only when crossing the threshold from < 2 to >= 2 items.
    // This respects the user's choice to manually toggle it off later.
    if (favouritePlacesCount >= 2 && prevFavouritePlacesCount.current < 2) {
      setShowFavouritesRoute(true);
    } else if (favouritePlacesCount < 2) {
      // Always turn off if there aren't enough places for a route.
      setShowFavouritesRoute(false);
    }
    // Update the ref to the current count for the next render.
    prevFavouritePlacesCount.current = favouritePlacesCount;
  }, [favouritePlacesCount]);

  const lovedPlaceIds = useMemo(() =>
    new Set((userPlaces || []).filter(p => p && (p.categoryKey === 'Love this' || p.categoryKey === 'My Stay') && p.originalId).map(p => p.originalId!))
    , [userPlaces]);

  const myStayPlace = useMemo(() =>
    (userPlaces || []).find(p => p && p.categoryKey === 'My Stay')
    , [userPlaces]);

  const allPlaces = useMemo(() => [...places, ...(userPlaces || []).filter(Boolean)], [places, userPlaces]);

  // Handle deep linking from URL parameter on initial load
  useEffect(() => {
    // This effect should run only once when places are loaded.
    if (!initialUrlCheckDone.current && places.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const placeIdFromUrl = urlParams.get('place');
      const isAdmin = urlParams.get('admin');

      if (isAdmin === 'true' || isAdmin === '1') {
        setIsDbAdminMode(true);
      }

      if (placeIdFromUrl) {
        const placeToSelect = allPlaces.find(p => p.id === placeIdFromUrl);

        if (placeToSelect) {
          // Directly set place without updating URL again
          setSelectedPlace(placeToSelect);
          if (mapRef.current) {
            // Fly to the location so user sees it
            mapRef.current.flyTo(placeToSelect.location, 17, { animate: true, duration: 1 });
          }
        }
      }
      initialUrlCheckDone.current = true;
    }
  }, [places, userPlaces, allPlaces]);

  const handleClosePopup = useCallback(() => {
    setSelectedPlace(null);
    // Update URL to remove the parameter, catching potential security errors.
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('place');
      window.history.pushState({ path: url.href }, '', url.href);
    } catch (e) {
      console.warn("Could not update URL for deep-linking:", e);
    }
  }, []);

  const handleSelectPlace = (place: Place) => {
    console.log("Selecting place:", place.id, place.name);
    if (isDbAdminMode) {
      console.log("Admin mode selection");
      setSelectedPlace(place);
      setDbAdminClickedCoords(place.location);
      return;
    }

    let placeToShow = place;
    // If it's a "favourite", find and show the original place's popup
    if (place.categoryKey === 'Love this' && place.originalId) {
      const originalPlace = places.find(p => p.id === place.originalId);
      if (originalPlace) {
        placeToShow = originalPlace;
      }
    }
    console.log("Setting selected place to:", placeToShow.id);
    setSelectedPlace(placeToShow);

    // Update URL without reloading the page, catching potential security errors.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('place', placeToShow.id);
      window.history.pushState({ path: url.href }, '', url.href);
    } catch (e) {
      console.warn("Could not update URL for deep-linking:", e);
    }

    if (mapRef.current) {
      mapRef.current.flyTo(placeToShow.location, 17, { animate: true, duration: 1 });
    }
  };

  const handleGetDirections = (place: Place) => {
    if (userLocation && place) {
      handleClosePopup(); // Closes popup and clears URL
      setRoute({ start: userLocation, end: place.location });
      setViewState('route');
    }
  };

  const handleStopNavigation = () => {
    handleClosePopup();
    setRoute(null);
    setViewState('all-places');
    setIsFollowingUser(false);
  };

  const handleMapClick = (coords: Coordinates) => {
    if (isDbAdminMode) {
      setDbAdminClickedCoords(coords);
      setSelectedPlace(null);
      return;
    }

    if (isPickingLocation) {
      setPickedLocation(coords);
      setIsPickingLocation(false);
    } else {
      // Clicking on map closes any open popup and clears URL
      if (selectedPlace) {
        handleClosePopup();
      }
    }
  };

  const handleAdminDelete = (placeId: string) => {
    deleteUserPlace(placeId);
    if (selectedPlace?.id === placeId) {
      handleClosePopup();
    }
  }

  const handleToggleFavourite = (place: Place) => {
    const targetId = place.originalId || place.id;
    const isAccommodation = place.categoryKey === 'Accommodation' || place.originalCategoryKey === 'Accommodation' || place.categoryKey === 'My Stay';

    // Special handling for accommodations: "loving" them means setting/unsetting "My Stay"
    if (isAccommodation) {
      const isCurrentlyMyStay = (place.categoryKey === 'My Stay') || (myStayPlace && myStayPlace.originalId === targetId);

      if (isCurrentlyMyStay && myStayPlace) {
        deleteUserPlace(myStayPlace.id);

        if (place.id === myStayPlace.id && myStayPlace.originalId) {
          const original = places.find(p => p.id === myStayPlace.originalId);
          if (original) {
            setSelectedPlace(original);
          } else {
            handleClosePopup();
          }
        }
      } else {
        // Set as My Stay, addUserPlace handles removing any existing one
        const newPlace = addUserPlace({
          name: place.name,
          category: t.categories['My Stay'],
          categoryKey: 'My Stay',
          description: place.description,
          imageUrl: place.imageUrl,
          location: place.location,
          color: place.color,
          originalId: targetId,
          originalCategoryKey: place.categoryKey,
        });

        if (newPlace) {
          setSelectedPlace(newPlace);
          setAnimatedPlaceId(newPlace.id);
        }
      }
      return;
    }

    // Standard favorite logic for all other place types
    if (lovedPlaceIds.has(targetId)) {
      const favouriteToRemove = userPlaces.find(p => p.categoryKey === 'Love this' && p.originalId === targetId);
      if (favouriteToRemove) {
        deleteUserPlace(favouriteToRemove.id);
      }
    } else {
      const newFavouritePlace = addUserPlace({
        name: place.name,
        category: t.categories['Love this'],
        categoryKey: 'Love this',
        description: place.description,
        imageUrl: place.imageUrl,
        location: place.location,
        color: place.color,
        originalId: targetId,
        originalCategoryKey: place.categoryKey,
      });
      if (newFavouritePlace) {
        setAnimatedPlaceId(newFavouritePlace.id);
      }
    }
  }

  useEffect(() => {
    if (route) {
      const controller = new AbortController();
      const { signal } = controller;

      const fetchRoute = async () => {
        setIsRouteLoading(true);
        setRouteInfo(null);
        try {
          const result = await getRoute(route.start, route.end, allPlaces, lines, bounds, signal);
          if (!signal.aborted) {
            setRouteInfo(result);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error("Failed to fetch route:", error);
            setRouteInfo(null);
          }
        } finally {
          if (!signal.aborted) {
            setIsRouteLoading(false);
          }
        }
      };
      fetchRoute();

      return () => {
        controller.abort();
      };
    } else {
      setRouteInfo(null);
    }
  }, [route, lines, allPlaces, bounds]);

  useEffect(() => {
    if (pickedLocation && placeTypeToAdd) {
      const favourites = userPlaces.filter(p => p.categoryKey === 'Love this');
      const placeName = placeTypeToAdd === 'Love this'
        ? `${t.categories['Love this']} #${favourites.length + 1}`
        : t.categories[placeTypeToAdd] || placeTypeToAdd;

      const newPlace = addUserPlace({
        name: placeName,
        category: t.categories[placeTypeToAdd] || placeTypeToAdd,
        categoryKey: placeTypeToAdd,
        description: `${t.ui.yourCustomLocation}: ${placeName}`,
        imageUrl: null,
        location: pickedLocation,
      });

      if (newPlace) {
        setAnimatedPlaceId(newPlace.id);
      }

      setPlaceTypeToAdd(null);
      setPickedLocation(null);
    }
  }, [pickedLocation, placeTypeToAdd, userPlaces, addUserPlace, t]);

  useEffect(() => {
    // Include My Car and My Stay in the favourites route calculation
    const routeCategories = ['Love this', 'My Car', 'My Stay'];
    const favouritePlaces = userPlaces.filter(p => routeCategories.includes(p.categoryKey));

    if (!showFavouritesRoute || favouritePlaces.length < 2) {
      setFavouriteRouteSegments(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const calculateRoutes = async () => {
      try {
        const allSegments: RouteSegment[] = [];
        for (let i = 0; i < favouritePlaces.length - 1; i++) {
          if (signal.aborted) return;
          const start = favouritePlaces[i].location;
          const end = favouritePlaces[i + 1].location;

          const routeParts = await calculateWalkingRoute(start, end, lines, signal);

          if (routeParts.length > 0) {
            allSegments.push(...routeParts);
          } else {
            // Fallback for when no KML path is found, draw a straight line
            const distance = calculateDistance(start, end);
            const duration = distance / 1.4; // Assumed walking speed of 1.4 m/s
            allSegments.push({
              type: 'path',
              geometry: [start, end],
              distance,
              duration
            });
          }
        }
        if (!signal.aborted) {
          setFavouriteRouteSegments(allSegments);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error calculating favourites route:", error);
        }
        setFavouriteRouteSegments(null);
      }
    };

    calculateRoutes();

    return () => {
      controller.abort();
    };
  }, [userPlaces, showFavouritesRoute, lines]);

  useEffect(() => {
    // When viewing the 'Love this' category, if the user deletes the last favorite item,
    // automatically switch back to the 'all places' view to avoid an empty, dimmed map.
    if (selectedCategory === 'Love this') {
      const favouritePlaces = userPlaces.filter(p =>
        ['Love this', 'My Car', 'My Stay'].includes(p.categoryKey)
      );
      if (favouritePlaces.length === 0) {
        setSelectedCategory(null);
      }
    }
  }, [userPlaces, selectedCategory]);

  const closeAdminPanelAndCancel = useCallback(() => {
    setIsAdminOpen(false);
    setIsPickingLocation(false);
    setPlaceTypeToAdd(null);
  }, []);

  const startPickingLocation = useCallback((type: string) => {
    setPlaceTypeToAdd(type);
    setIsPickingLocation(true);
    setIsAdminOpen(false);
  }, []);

  const toggleAdminPanel = () => {
    if (selectedPlace) {
      handleClosePopup();
    }
    if (isAdminOpen) {
      closeAdminPanelAndCancel();
    } else {
      setIsAdminOpen(true);
    }
  };

  const handleSelectCategory = (category: string | null) => {
    if (selectedPlace) {
      handleClosePopup();
    }

    if (category === null) {
      if (viewState !== 'route') {
        setViewState('all-places');
      }
    } else {
      // When a specific category is selected, set a dedicated view state.
      setViewState('category-view');
    }

    setSelectedCategory(category);
  };

  return (
    <div className="h-full w-full bg-gray-100 flex flex-col font-sans">
      <Header
        onToggleAdmin={toggleAdminPanel}
        isNavigating={!!route}
        onStopNavigation={handleStopNavigation}
        allPlaces={allPlaces}
        onSelectPlace={handleSelectPlace}
      />
      <main className="flex-1 relative overflow-hidden">
        <MapView
          mapRef={mapRef}
          places={places}
          userPlaces={userPlaces}
          lines={lines}
          mapCenter={mapCenter}
          bounds={bounds}
          userLocation={userLocation}
          onSelectPlace={handleSelectPlace}
          route={route}
          routeInfo={routeInfo}
          favouriteRouteSegments={favouriteRouteSegments}
          onMapClick={handleMapClick}
          isLocationSelectMode={isPickingLocation}
          viewState={viewState}
          setViewState={setViewState}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          isVillageFocused={isVillageFocused}
          setIsVillageFocused={setIsVillageFocused}
          showFavouritesRoute={showFavouritesRoute}
          setShowFavouritesRoute={setShowFavouritesRoute}
          lovedPlaceIds={lovedPlaceIds}
          animatedPlaceId={animatedPlaceId}
          setAnimatedPlaceId={setAnimatedPlaceId}
          isMyStayActive={!!myStayPlace}
          isFollowingUser={isFollowingUser}
          setIsFollowingUser={setIsFollowingUser}
          isDbAdminMode={isDbAdminMode}
          onMarkerDragEnd={(place, newCoords) => {
            if (isDbAdminMode) {
              const updatedPlace = { ...place, location: newCoords };
              setSelectedPlace(updatedPlace);
              setDbAdminClickedCoords(null);
            }
          }}
          dbAdminClickedCoords={dbAdminClickedCoords}
          selectedPlace={selectedPlace}
        />
        {isAdminOpen && (
          <AdminPanel
            userPlaces={userPlaces}
            onDelete={handleAdminDelete}
            onClose={closeAdminPanelAndCancel}
            onStartPickingLocation={startPickingLocation}
            onUpdateUserPlaces={updateUserPlaces}
            showFavouritesRoute={showFavouritesRoute}
            setShowFavouritesRoute={setShowFavouritesRoute}
          />
        )}
      </main>

      {isDbAdminMode && (selectedPlace || dbAdminClickedCoords) && (
        <AdminMapSettings
          existingPlace={selectedPlace && !selectedPlace.id?.startsWith('user_place_') ? selectedPlace : null}
          clickedLocation={dbAdminClickedCoords}
          onClose={() => {
            setSelectedPlace(null);
            setDbAdminClickedCoords(null);
          }}
          onSaveSuccess={() => {
            setSelectedPlace(null);
            setDbAdminClickedCoords(null);
            window.location.reload(); // Refresh to catch new db data
          }}
          onLocationChange={(coords) => {
            if (selectedPlace) {
              setSelectedPlace({ ...selectedPlace, location: coords });
            } else {
              setDbAdminClickedCoords(coords);
            }
          }}
        />
      )}

      {isDbAdminMode && <AdminBulkSync allPlaces={allPlaces} />}

      {isRouteLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[2000]">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center space-x-3">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-semibold text-gray-700">{t.ui.calculatingRoute}</span>
          </div>
        </div>
      )}
      {selectedPlace && !isDbAdminMode && (
        <PlacePopup
          place={selectedPlace}
          userLocation={userLocation}
          onClose={handleClosePopup}
          onGetDirections={handleGetDirections}
          onStopNavigation={handleStopNavigation}
          onToggleFavourite={handleToggleFavourite}
          isLoved={lovedPlaceIds.has(selectedPlace.id) || (!!selectedPlace.originalId && lovedPlaceIds.has(selectedPlace.originalId))}
          isMyStay={selectedPlace.categoryKey === 'My Stay' || (!!myStayPlace && myStayPlace.originalId === selectedPlace.id)}
          isNavigatingTo={!!(route && route.end.lat === selectedPlace.location.lat && route.end.lng === selectedPlace.location.lng)}
          isRouteLoading={isRouteLoading}
        />
      )}
    </div>
  );
}

export default App;
