import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline, Tooltip, Pane } from 'react-leaflet';
import L from 'leaflet';
import { Place, LineData, Coordinates, Bounds, RouteSegment } from '../types';
import { ViewState } from '../App';
import { useTranslations } from '../hooks/useTranslations';
import { getCategoryColor } from '../constants';
import { placeMarkerIcon, userPlaceMarkerIcon, userMarkerIcon } from './MapIcons';
import CategoryFilter from './CategoryFilter';
import PulsatingAnimationMarker from './PulsatingAnimationMarker';

// --- START: NEW HELPER COMPONENTS for User Following ---

// Deactivates follow mode and sets view state to manual when the user interacts with the map.
function MapInteractionsManager({ setIsFollowingUser, setViewState }: { setIsFollowingUser: (following: boolean) => void; setViewState: (state: ViewState) => void; }) {
    useMapEvents({
        dragstart() {
            setIsFollowingUser(false);
            setViewState('manual');
        },
        zoomstart() {
            setIsFollowingUser(false);
            setViewState('manual');
        }
    });
    return null;
}

// Pans the map to the user's location when follow mode is active.
function UserFollower({ userLocation, isFollowing }: { userLocation: Coordinates | null, isFollowing: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (isFollowing && userLocation) {
            map.panTo(userLocation);
        }
    }, [isFollowing, userLocation, map]);
    return null;
}
// --- END: NEW HELPER COMPONENTS ---


// Helper to check if a place should be visible in the current category context
const isPlaceVisibleInCategory = (place: Place, selectedCategory: string | null) => {
    if (!selectedCategory) return true; // Always visible when no filter
    if (place.categoryKey === selectedCategory) return true; // Visible if its own category is selected
    
    // A user place (like 'Love this') should be visible if its original category is selected
    if (place.originalCategoryKey && place.originalCategoryKey === selectedCategory) return true;
    
    // Show 'My Stay' when 'Accommodation' category is conceptually active
    if (selectedCategory === 'Accommodation' && place.categoryKey === 'My Stay') return true;
    
    // The 'Love this' filter should show all favorited items
    if (selectedCategory === 'Love this') {
        return ['Love this', 'My Stay', 'My Car'].includes(place.categoryKey);
    }
    // The 'Transportation' filter should also show 'My Car'
    if (selectedCategory === 'Transportation' && place.categoryKey === 'My Car') {
        return true;
    }
    
    return false;
};

function ViewManager({ 
    center, zoom, route, userLocation, bounds, viewState, places, userPlaces, selectedCategory
}: { 
    center: Coordinates, 
    zoom: number, 
    route: { start: Coordinates, end: Coordinates } | null, 
    userLocation: Coordinates | null,
    bounds: Bounds | null,
    viewState: ViewState,
    places: Place[],
    userPlaces: Place[],
    selectedCategory: string | null
}) {
    const map = useMap();
    const hasSetInitialView = useRef(false);
    const zoomedCategoryRef = useRef<string | null>(null);
    const zoomedRouteRef = useRef<string | null>(null);
    const lastViewState = useRef(viewState);

    useEffect(() => {
        const isNewAllPlacesView = viewState === 'all-places' && lastViewState.current !== 'all-places';

        if (viewState === 'route' && route) {
            const currentRouteId = `${route.start.lat},${route.start.lng}-${route.end.lat},${route.end.lng}`;
            if (currentRouteId !== zoomedRouteRef.current) {
                const routeBounds = L.latLngBounds([route.start, route.end]);
                if(userLocation) {
                  routeBounds.extend(userLocation);
                }
                map.flyToBounds(routeBounds, { padding: [50, 50] });
                zoomedRouteRef.current = currentRouteId;
            }
            hasSetInitialView.current = false;
            zoomedCategoryRef.current = null;
            lastViewState.current = viewState;
            return;
        }
        zoomedRouteRef.current = null;

        if (viewState === 'category-view' && selectedCategory) {
            if (selectedCategory !== zoomedCategoryRef.current) {
                const allPlaces = [...places, ...userPlaces];
                const filteredPoints = allPlaces
                    .filter(p => isPlaceVisibleInCategory(p, selectedCategory))
                    .map(p => p.location);

                if (filteredPoints.length > 0) {
                    const boundsToFit = L.latLngBounds(filteredPoints);
                    if (filteredPoints.length === 1) {
                        map.flyTo(boundsToFit.getCenter(), 17, { animate: true, duration: 1 });
                    } else {
                        map.flyToBounds(boundsToFit, { padding: [50, 50] });
                    }
                }
                zoomedCategoryRef.current = selectedCategory;
            }
            hasSetInitialView.current = false;
            lastViewState.current = viewState;
            return;
        }
        zoomedCategoryRef.current = null;

        if ((viewState === 'initial' && !hasSetInitialView.current) || isNewAllPlacesView) {
            const allInterestPoints = [
                ...places.map(p => p.location), 
                ...userPlaces.map(p => p.location)
            ];

            if (allInterestPoints.length > 0) {
                const boundsToFit = L.latLngBounds(allInterestPoints);
                map.flyToBounds(boundsToFit, { padding: [50, 50] });
            } else if (bounds) {
                map.fitBounds(bounds, { padding: [50, 50] });
            } else {
                map.flyTo(center, zoom);
            }
            
            if (viewState === 'initial') {
              hasSetInitialView.current = true;
            }
        }

        lastViewState.current = viewState;
    }, [viewState, route, selectedCategory, userLocation, map, bounds, center, zoom, places, userPlaces]);

    return null;
}

function MapClickHandler({ onClick, isLocationSelectMode }: { onClick: (coords: Coordinates) => void, isLocationSelectMode: boolean }) {
  const map = useMap();
  
  useEffect(() => {
      map.getContainer().style.cursor = isLocationSelectMode ? 'crosshair' : '';
  }, [isLocationSelectMode, map]);
  
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

const LocateControl = ({ 
    userLocation, 
    isNavigating, 
    setIsFollowingUser,
    setViewState
}: { 
    userLocation: Coordinates | null;
    isNavigating: boolean;
    setIsFollowingUser: (following: boolean) => void;
    setViewState: (state: ViewState) => void;
}) => {
    const map = useMap();
    const t = useTranslations();

    const handleLocate = () => {
        if (userLocation) {
            map.flyTo(userLocation, 17, { animate: true, duration: 1 });
            setViewState('manual');
            if (isNavigating) {
                setIsFollowingUser(true);
            }
        }
    };

    return (
        <div 
            className="absolute top-4 right-4 z-[1000]"
        >
            <button
                onClick={handleLocate}
                disabled={!userLocation}
                className="bg-white/80 backdrop-blur-sm w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-gray-200"
                title={t.ui.centerOnLocation}
                aria-label={t.ui.centerOnLocation}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${userLocation ? 'text-red-700' : 'text-gray-500'}`}>
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
            </button>
        </div>
    );
};

function SetMapReference({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
    const map = useMap();
    useEffect(() => {
        mapRef.current = map;
    }, [map, mapRef]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        const container = map.getContainer();
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [map]);
    return null;
}

type RouteInfo = {
    segments: RouteSegment[];
    mode: 'walk' | 'car';
    bestParking: Place | null;
}

interface MapViewProps {
  mapRef: React.RefObject<L.Map | null>;
  places: Place[];
  userPlaces: Place[];
  lines: LineData[];
  mapCenter: Coordinates;
  bounds: Bounds | null;
  userLocation: Coordinates | null;
  onSelectPlace: (place: Place) => void;
  route: { start: Coordinates, end: Coordinates } | null;
  routeInfo: RouteInfo | null;
  favouriteRouteSegments: RouteSegment[] | null;
  onMapClick: (coords: Coordinates) => void;
  isLocationSelectMode: boolean;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  showFavouritesRoute: boolean;
  setShowFavouritesRoute: (show: boolean) => void;
  animatedPlaceId: string | null;
  setAnimatedPlaceId: (id: string | null) => void;
  lovedPlaceIds: Set<string>;
  isMyStayActive: boolean;
  isFollowingUser: boolean;
  setIsFollowingUser: (following: boolean) => void;
}

interface PlaceMarkerProps {
    place: Place;
    route: { start: Coordinates; end: Coordinates } | null;
    selectedCategory: string | null;
    routeInfo: RouteInfo | null;
    onSelectPlace: (place: Place) => void;
    lovedPlaceIds: Set<string>;
}

const PlaceMarker = React.memo(({ place, route, selectedCategory, routeInfo, onSelectPlace, lovedPlaceIds }: PlaceMarkerProps) => {
    const isSelected = route?.end.lat === place.location.lat && route?.end.lng === place.location.lng;
    const isLoved = lovedPlaceIds.has(place.id);
    const isVisible = isPlaceVisibleInCategory(place, selectedCategory);
                
    let opacity = 1.0;
    if (selectedCategory && !isVisible) {
        opacity = 0.2;
    }

    if (routeInfo) {
        const isBestParking = place.id === routeInfo.bestParking?.id;
        if (!isSelected && !isBestParking) {
            opacity = 0.2;
        } else {
            opacity = 1.0;
        }
    }
    
    const isClickable = !selectedCategory || isVisible;

    return (
        <Marker 
            position={place.location} 
            // We pass categoryKey to determine color from constant palette
            icon={placeMarkerIcon(place.categoryKey, isSelected, isLoved, place.id)}
            zIndexOffset={isSelected ? 1000 : 0}
            opacity={opacity}
            eventHandlers={isClickable ? { click: () => onSelectPlace(place) } : {}}
        />
    );
});

const UserPlaceMarker = React.memo(({ place, route, selectedCategory, routeInfo, onSelectPlace }: PlaceMarkerProps) => {
    const isSelected = route?.end.lat === place.location.lat && route?.end.lng === place.location.lng;
    
    const isVisible = isPlaceVisibleInCategory(place, selectedCategory);
                 
    let opacity = 1.0;
    if (selectedCategory && !isVisible) {
        opacity = 0.2;
    }

    if (routeInfo) {
        if (!isSelected) {
            opacity = 0.2;
        } else {
            opacity = 1.0;
        }
    }
    
    const isClickable = !selectedCategory || isVisible;
                 
    return (
        <Marker 
            position={place.location} 
            icon={userPlaceMarkerIcon(place, isSelected, selectedCategory)}
            zIndexOffset={isSelected ? 1000 : 500}
            opacity={opacity}
            eventHandlers={isClickable ? { click: () => onSelectPlace(place) } : {}}
        />
    );
});

const formatRouteInfo = (distance: number, duration: number, type: 'road' | 'path', t: any) => {
    const distStr = distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
    const durStr = duration > 60 ? `${Math.round(duration / 60)} ${t.ui.min}` : `< 1 ${t.ui.min}`;
    const modeStr = type === 'road' ? t.ui.drive : t.ui.walk;
    return `${modeStr}: ${distStr} (${durStr})`;
};


const MapView: React.FC<MapViewProps> = ({ 
    mapRef, places, userPlaces, lines, mapCenter, bounds, userLocation, 
    onSelectPlace, route, routeInfo,
    favouriteRouteSegments, onMapClick, isLocationSelectMode, viewState, setViewState,
    selectedCategory, onSelectCategory,
    showFavouritesRoute, setShowFavouritesRoute,
    animatedPlaceId, setAnimatedPlaceId,
    lovedPlaceIds,
    isMyStayActive,
    isFollowingUser, setIsFollowingUser
}) => {
  const defaultZoom = 16;
  const t = useTranslations();
  const [animationDetails, setAnimationDetails] = useState<{location: Coordinates, color: string} | null>(null);
  
  // Memoize the set of original IDs from user places to efficiently filter KML places
  const userPlaceOriginalIds = useMemo(() => 
    new Set(userPlaces.map(p => p.originalId).filter(Boolean))
  , [userPlaces]);

  useEffect(() => {
    if (animatedPlaceId) {
        const newlyAddedPlace = userPlaces.find(p => p.id === animatedPlaceId);
        if (newlyAddedPlace) {
            const color = getCategoryColor(newlyAddedPlace.categoryKey);
            setAnimationDetails({ location: newlyAddedPlace.location, color });
            
            if (mapRef.current) {
                mapRef.current.flyTo(newlyAddedPlace.location, mapRef.current.getZoom(), { animate: true, duration: 0.5 });
            }
            
            const timer = setTimeout(() => {
                setAnimationDetails(null);
                setAnimatedPlaceId(null);
            }, 1500); // Corresponds to CSS animation duration

            return () => clearTimeout(timer);
        } else {
            // If place not found (e.g., deleted quickly), just reset.
            setAnimatedPlaceId(null);
        }
    }
  }, [animatedPlaceId, userPlaces, setAnimatedPlaceId, mapRef]);
  
  const markerProps: Omit<PlaceMarkerProps, 'place'> = {
      route,
      selectedCategory,
      routeInfo,
      onSelectPlace,
      lovedPlaceIds,
  };

  return (
    <div className="w-full h-full relative">
        <MapContainer center={mapCenter} zoom={defaultZoom} scrollWheelZoom={true} className="w-full h-full relative z-0">
            <SetMapReference mapRef={mapRef} />
            <MapResizer />
            {/* Define panes in order of z-index for correct layering */}
            <Pane name="kmlPathPane" style={{ zIndex: 410 }} />
            <Pane name="routePane" style={{ zIndex: 420 }} />

            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <ViewManager 
                center={mapCenter} 
                zoom={defaultZoom} 
                route={route} 
                userLocation={userLocation} 
                bounds={bounds} 
                viewState={viewState}
                places={places}
                userPlaces={userPlaces}
                selectedCategory={selectedCategory}
            />
            <MapClickHandler onClick={onMapClick} isLocationSelectMode={isLocationSelectMode} />
            <LocateControl 
                userLocation={userLocation} 
                isNavigating={!!route} 
                setIsFollowingUser={setIsFollowingUser} 
                setViewState={setViewState}
            />

            {/* Components for handling user following and interaction */}
            <MapInteractionsManager setIsFollowingUser={setIsFollowingUser} setViewState={setViewState} />
            <UserFollower userLocation={userLocation} isFollowing={isFollowingUser} />

            {/* Render KML places, with filtering logic */}
            {places.filter(p => {
                // Hide if there's an equivalent user place (like My Stay or Love this)
                if (userPlaceOriginalIds.has(p.id)) {
                    return false;
                }
                // If a "My Stay" is set, hide all other original accommodation places
                if (isMyStayActive && p.categoryKey === 'Accommodation') {
                    return false;
                }
                return true;
            }).map(place => (
                <PlaceMarker key={place.id} place={place} {...markerProps} />
            ))}

            {userPlaces.map(place => (
                 <UserPlaceMarker key={place.id} place={place} {...markerProps} />
            ))}
            
            {lines.filter(line => line.categoryKey !== 'Facilities' && line.categoryKey !== 'Paths').map(line => (
                <Polyline 
                    key={line.id} 
                    positions={line.coordinates} 
                    pathOptions={{
                        color: line.color || "rgba(0, 181, 255, 0.19)",
                        weight: 5
                    }}
                >
                <Tooltip>{line.name}</Tooltip>
                </Polyline>
            ))}

            {lines.filter(line => line.categoryKey === 'Facilities' || line.categoryKey === 'Paths').map(line => (
                <Polyline
                    key={line.id}
                    positions={line.coordinates}
                    pane="kmlPathPane"
                    pathOptions={{
                        color: line.categoryKey === 'Paths' ? '#0000FF' : '#FFFFFF', 
                        weight: 4,
                        opacity: line.categoryKey === 'Paths' ? 1.0 : 0.2, 
                    }}
                >
                    <Tooltip>{line.name}</Tooltip>
                </Polyline>
            ))}
            
            {userLocation && (
                <Marker position={userLocation} icon={userMarkerIcon} >
                    <Tooltip>{t.ui.yourLocation}</Tooltip>
                </Marker>
            )}
            
            {route && routeInfo && (
                routeInfo.segments.map((segment, index) => {
                    const getPathOptions = () => {
                        switch (segment.type) {
                            case 'road':
                                return { color: '#2962FF', weight: 8, opacity: 0.7 }; // Blue for driving
                            case 'path':
                                return { 
                                    color: '#D50000', // Red
                                    weight: 6, 
                                    opacity: 0.9, 
                                    dashArray: '0, 12', 
                                    lineCap: 'round' as L.LineCapShape
                                };
                            default:
                                return { color: '#FF0000', weight: 4, opacity: 1, dashArray: '4, 4' };
                        }
                    }
                    return (
                        <Polyline
                            key={index}
                            pane="routePane"
                            pathOptions={getPathOptions()}
                            positions={segment.geometry}
                        >
                            <Tooltip permanent className="route-label">
                                {formatRouteInfo(segment.distance, segment.duration, segment.type, t)}
                            </Tooltip>
                        </Polyline>
                    );
                })
            )}

            {favouriteRouteSegments && favouriteRouteSegments.map((segment, index) => (
                <Polyline
                    key={`fav-route-${index}`}
                    positions={segment.geometry}
                    pathOptions={{
                        color: '#FF4081', // Lighter Pink for Love path
                        weight: 6,
                        opacity: 0.9,
                        dashArray: '0, 12', // Dotted line style
                        lineCap: 'round' as L.LineCapShape
                    }}
                    pane="routePane"
                >
                    <Tooltip permanent className="route-label">
                        {formatRouteInfo(segment.distance, segment.duration, segment.type, t)}
                    </Tooltip>
                </Polyline>
            ))}
            {animationDetails && <PulsatingAnimationMarker position={animationDetails.location} color={animationDetails.color} />}
        </MapContainer>
        <CategoryFilter
            places={places}
            userPlaces={userPlaces}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            showFavouritesRoute={showFavouritesRoute}
            setShowFavouritesRoute={setShowFavouritesRoute}
            isMyStayActive={isMyStayActive}
        />
    </div>
  );
};

export default MapView;
