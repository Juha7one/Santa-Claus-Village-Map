import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline, Tooltip, Pane } from 'react-leaflet';
import L from 'leaflet';
import { Place, LineData, Coordinates, Bounds, RouteSegment } from '../types';
import { ViewState } from '../App';
import { useTranslations } from '../hooks/useTranslations';
import { getCategoryColor } from '../constants';
import { placeMarkerIcon, userPlaceMarkerIcon, userMarkerIcon } from './MapIcons';
import { getLangString, matchesSearch } from '../utils/langUtils';
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
    center, zoom, route, userLocation, bounds, viewState, places, userPlaces, lines, selectedCategory, isVillageFocused, searchQuery, currentLang, selectedPlace, viewVersion
}: {
    center: Coordinates;
    zoom: number;
    route: { start: Coordinates, end: Coordinates } | null;
    userLocation: Coordinates | null;
    bounds: Bounds | null;
    viewState: ViewState;
    places: Place[];
    userPlaces: Place[];
    selectedCategory: string | null;
    lines: LineData[];
    isVillageFocused: boolean;
    searchQuery?: string;
    currentLang: string;
    selectedPlace?: Place | null;
    viewVersion: number;
}) {
    const map = useMap();
    const zoomedRouteRef = useRef<string | null>(null);
    const zoomedCategoryRef = useRef<string | null>(null);
    const hasSetInitialView = useRef(false);
    const lastViewState = useRef<ViewState | null>(null);
    const lastSearchRef = useRef<string>('');
    const lastSelectedPlaceRef = useRef<Place | null>(null);
    const lastViewVersionRef = useRef<number>(0);

    const villageBounds = useMemo(() => {
        // Village bounds should only include paths and facilities inside the village area
        const villageLines = lines.filter(l => l.categoryKey === 'Paths' || l.categoryKey === 'Facilities');
        const points = villageLines.flatMap(line => line.coordinates);
        if (points.length === 0) return null;
        return L.latLngBounds(points);
    }, [lines]);

    useEffect(() => {
        const isNewAllPlacesView = (viewState === 'all-places' && lastViewState.current !== 'all-places');
        const focusChanged = lastViewState.current !== null && lastViewState.current === viewState && isVillageFocused !== (map as any)._lastVillageFocus;
        const placeDeselected = lastSelectedPlaceRef.current !== null && selectedPlace === null;
        const versionChanged = viewVersion !== lastViewVersionRef.current;

        (map as any)._lastVillageFocus = isVillageFocused;
        lastSelectedPlaceRef.current = selectedPlace;
        lastViewVersionRef.current = viewVersion;

        // If a place is currently selected, we let App.tsx handle the zooming to that place
        // and we don't want the ViewManager to override it with Village/All bounds.
        // HOWEVER, if versionChanged is true (User clicked Village/All), we DO want to zoom to bounds (App.tsx should close the popup).
        if (selectedPlace && !versionChanged) {
            lastViewState.current = viewState;
            return;
        }

        if (viewState === 'route' && route) {
            const routeId = `${route.start.lat},${route.start.lng}-${route.end.lat},${route.end.lng}`;
            if (routeId !== zoomedRouteRef.current) {
                const points = [route.start, route.end];
                const boundsToFit = L.latLngBounds(points);
                map.flyToBounds(boundsToFit, { padding: [100, 100], maxZoom: 16 });
                zoomedRouteRef.current = routeId;
            }
            hasSetInitialView.current = false;
            lastViewState.current = viewState;
            return;
        }
        zoomedRouteRef.current = null;

        // --- Handle Real-time Search Zoom ---
        if (searchQuery && searchQuery.length >= 2) {
            if (searchQuery !== lastSearchRef.current) {
                const allAvailablePlaces = [...places, ...userPlaces];
                const matchingPoints = allAvailablePlaces
                    .filter(p => matchesSearch(p, searchQuery))
                    .map(p => p.location);

                if (matchingPoints.length > 0) {
                    const boundsToFit = L.latLngBounds(matchingPoints);
                    map.flyToBounds(boundsToFit, { padding: [100, 100], maxZoom: 17 });
                }
                lastSearchRef.current = searchQuery;
            }
            return;
        } else {
            lastSearchRef.current = '';
        }

        if (viewState === 'category-view' && selectedCategory) {
            if (selectedCategory !== zoomedCategoryRef.current || focusChanged) {
                const allPlaces = [...places, ...userPlaces];
                const filteredPoints = allPlaces
                    .filter(p => {
                        const inCat = isPlaceVisibleInCategory(p, selectedCategory);
                        if (!inCat) return false;
                        if (isVillageFocused && villageBounds) {
                            return villageBounds.contains(p.location);
                        }
                        return true;
                    })
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

        if ((viewState === 'initial' && !hasSetInitialView.current) ||
            isNewAllPlacesView ||
            (viewState === 'all-places' && (focusChanged || !hasSetInitialView.current || placeDeselected || versionChanged)) ||
            (viewState === 'category-view' && (!selectedCategory || focusChanged || placeDeselected || versionChanged))) {
            if (isVillageFocused && bounds) {
                // If Village is focused, zoom to the predefined village area
                map.flyToBounds(bounds, { padding: [50, 50] });
            } else {
                // Show everything or falling back
                const allAvailablePlaces = [...places, ...userPlaces];
                const points = allAvailablePlaces.map(p => p.location);

                if (points.length > 0) {
                    const boundsToFit = L.latLngBounds(points);
                    map.flyToBounds(boundsToFit, { padding: [50, 50] });
                } else if (bounds) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                } else {
                    map.flyTo(center, zoom);
                }
            }

            hasSetInitialView.current = true;
        }

        lastViewState.current = viewState;
    }, [viewState, route, selectedCategory, userLocation, map, bounds, center, zoom, places, userPlaces, lines, isVillageFocused, villageBounds, searchQuery, currentLang, selectedPlace, viewVersion]);

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
    isDbAdminMode?: boolean;
    onMarkerDragEnd?: (place: Place, newCoords: Coordinates) => void;
    dbAdminClickedCoords?: Coordinates | null;
    selectedPlace?: Place | null;
    isVillageFocused: boolean;
    onVillageFocusChange: (focused: boolean) => void;
    searchQuery?: string;
    viewVersion: number;
}

interface PlaceMarkerProps {
    place: Place;
    route: { start: Coordinates; end: Coordinates } | null;
    selectedCategory: string | null;
    routeInfo: RouteInfo | null;
    onSelectPlace: (place: Place) => void;
    lovedPlaceIds: Set<string>;
    isDraggable?: boolean;
    onDragEnd?: (place: Place, newCoords: Coordinates) => void;
    isVillageFocused?: boolean;
    villageBounds?: L.LatLngBounds | null;
    searchQuery?: string;
    currentLang: string;
}

const PlaceMarker = React.memo(({ place, route, selectedCategory, routeInfo, onSelectPlace, lovedPlaceIds, isDraggable, onDragEnd, isVillageFocused, villageBounds, searchQuery, currentLang }: PlaceMarkerProps) => {
    const isSelected = route?.end.lat === place.location.lat && route?.end.lng === place.location.lng;
    const isLoved = lovedPlaceIds.has(place.id);
    const isVisible = isPlaceVisibleInCategory(place, selectedCategory);

    const isInsideVillage = !villageBounds || villageBounds.contains(place.location);
    if (isVillageFocused && !isInsideVillage && !isSelected) {
        return null;
    }

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

    if (searchQuery && searchQuery.length >= 2) {
        if (!matchesSearch(place, searchQuery)) {
            opacity = 0.2;
        } else {
            opacity = 1.0;
        }
    }

    const isClickable = !selectedCategory || isVisible;
    const baseZIndex = isSelected ? 1000 : 0;
    // Boost z-index for visible markers when a category filter is active
    const zIndex = (selectedCategory && isVisible && !isSelected) ? baseZIndex + 500 : baseZIndex;

    return (
        <Marker
            position={place.location}
            // We pass categoryKey to determine color from constant palette
            icon={placeMarkerIcon(place.categoryKey, isSelected, isLoved, place.id, place.subCategory, place.originalId)}
            zIndexOffset={zIndex}
            opacity={opacity}
            draggable={isDraggable}
            interactive={isClickable}
            eventHandlers={{
                ...(isClickable ? { click: () => onSelectPlace(place) } : {}),
                ...(isDraggable && onDragEnd ? {
                    dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        onDragEnd(place, { lat: position.lat, lng: position.lng });
                    }
                } : {})
            }}
        />
    );
});

const UserPlaceMarker = React.memo(({ place, route, selectedCategory, routeInfo, onSelectPlace, isDraggable, onDragEnd, isVillageFocused, villageBounds, searchQuery, currentLang }: PlaceMarkerProps) => {
    const isSelected = route?.end.lat === place.location.lat && route?.end.lng === place.location.lng;

    const isVisible = isPlaceVisibleInCategory(place, selectedCategory);

    const isInsideVillage = !villageBounds || villageBounds.contains(place.location);
    if (isVillageFocused && !isInsideVillage && !isSelected) {
        return null;
    }

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

    if (searchQuery && searchQuery.length >= 2) {
        if (!matchesSearch(place, searchQuery)) {
            opacity = 0.2;
        } else {
            opacity = 1.0;
        }
    }

    const isClickable = !selectedCategory || isVisible;
    const baseZIndex = isSelected ? 1000 : 500;
    // Boost z-index for visible markers when a category filter is active
    const zIndex = (selectedCategory && isVisible && !isSelected) ? baseZIndex + 500 : baseZIndex;

    return (
        <Marker
            position={place.location}
            icon={userPlaceMarkerIcon(place, isSelected, selectedCategory)}
            zIndexOffset={zIndex}
            opacity={opacity}
            draggable={isDraggable}
            interactive={isClickable}
            eventHandlers={{
                ...(isClickable ? { click: () => onSelectPlace(place) } : {}),
                ...(isDraggable && onDragEnd ? {
                    dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        onDragEnd(place, { lat: position.lat, lng: position.lng });
                    }
                } : {})
            }}
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
    isFollowingUser, setIsFollowingUser,
    isDbAdminMode, onMarkerDragEnd,
    dbAdminClickedCoords, selectedPlace,
    isVillageFocused,
    onVillageFocusChange,
    searchQuery,
    viewVersion
}) => {
    const defaultZoom = 16;
    const t = useTranslations();
    const { i18n } = useTranslation();
    const currentLang = i18n.language?.split('-')[0] || 'en';
    const [animationDetails, setAnimationDetails] = useState<{ location: Coordinates, color: string } | null>(null);

    const villageBounds = useMemo(() => {
        // Village bounds should only include paths and facilities inside the village area
        const villageLines = lines.filter(l => l.categoryKey === 'Paths' || l.categoryKey === 'Facilities');
        const points = villageLines.flatMap(line => line.coordinates);
        if (points.length === 0) return null;
        return L.latLngBounds(points);
    }, [lines]);

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
        isDraggable: isDbAdminMode,
        onDragEnd: onMarkerDragEnd,
        isVillageFocused,
        villageBounds,
        searchQuery,
        currentLang
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
                    lines={lines}
                    isVillageFocused={isVillageFocused}
                    searchQuery={searchQuery}
                    currentLang={currentLang}
                    selectedPlace={selectedPlace}
                    viewVersion={viewVersion}
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
                }).map(place => {
                    const displayPlace = (isDbAdminMode && selectedPlace && selectedPlace.id === place.id)
                        ? selectedPlace
                        : place;
                    return <PlaceMarker key={place.id} place={displayPlace} {...markerProps} />;
                })}

                {userPlaces.map(place => {
                    const displayPlace = (isDbAdminMode && selectedPlace && selectedPlace.id === place.id)
                        ? selectedPlace
                        : place;
                    return <UserPlaceMarker key={place.id} place={displayPlace} {...markerProps} />;
                })}

                {isDbAdminMode && dbAdminClickedCoords && (
                    <Marker
                        position={dbAdminClickedCoords}
                        icon={placeMarkerIcon('Attractions', true, false, 'new_temp_marker')} // Highlighted icon for new marker
                    />
                )}

                {lines.filter(line => line.categoryKey !== 'Facilities' && line.categoryKey !== 'Paths').map(line => {
                    const displayName = getLangString(line.name, currentLang);
                    
                    // Special rendering for Arctic Circle Line with Tilt and Gradient
                    if (line.id === 'arctic-circle-line') {
                        const midpoint = line.coordinates[Math.floor(line.coordinates.length / 2)];
                        if (!midpoint) return null;

                        const tiltDegrees = 339; // User specified tilt
                        const tiltRad = (tiltDegrees * Math.PI) / 180;
                        const totalLengthMeters = 800; // Total visible length
                        const segmentCount = 40; // Number of segments for the gradient
                        const stepMeters = totalLengthMeters / segmentCount;
                        
                        // Earth radius approximation for lat/lng math
                        const R_LAT = 111320; 
                        const R_LNG = 111320 * Math.cos((midpoint.lat * Math.PI) / 180);

                        return (
                            <React.Fragment key={line.id}>
                                {Array.from({ length: segmentCount }).map((_, i) => {
                                    // Calculate center-relative position of this segment
                                    const distFromCenter = (i - segmentCount / 2) * stepMeters;
                                    const nextDistFromCenter = (i + 1 - segmentCount / 2) * stepMeters;
                                    
                                    // Opacity: 1.0 at center, 0.0 at edges
                                    const normalizedPos = Math.abs((i + 0.5) / segmentCount - 0.5) * 2; // 0 at center, 1 at edges
                                    const opacity = Math.max(0, 1 - normalizedPos);
                                    
                                    const p1 = {
                                        lat: midpoint.lat + (distFromCenter * Math.sin(tiltRad)) / R_LAT,
                                        lng: midpoint.lng + (distFromCenter * Math.cos(tiltRad)) / R_LNG
                                    };
                                    const p2 = {
                                        lat: midpoint.lat + (nextDistFromCenter * Math.sin(tiltRad)) / R_LAT,
                                        lng: midpoint.lng + (nextDistFromCenter * Math.cos(tiltRad)) / R_LNG
                                    };

                                    return (
                                        <Polyline
                                            key={`${line.id}-seg-${i}`}
                                            positions={[p1, p2]}
                                            pane="routePane"
                                            pathOptions={{
                                                color: line.color || "#b0279c",
                                                weight: line.weight || 8,
                                                opacity: opacity,
                                                lineCap: 'round'
                                            }}
                                        />
                                    );
                                })}
                                {/* Invisible broad polyline for tooltip/hover */}
                                <Polyline
                                    positions={[
                                        {
                                            lat: midpoint.lat - (totalLengthMeters/2 * Math.sin(tiltRad)) / R_LAT,
                                            lng: midpoint.lng - (totalLengthMeters/2 * Math.cos(tiltRad)) / R_LNG
                                        },
                                        {
                                            lat: midpoint.lat + (totalLengthMeters/2 * Math.sin(tiltRad)) / R_LAT,
                                            lng: midpoint.lng + (totalLengthMeters/2 * Math.cos(tiltRad)) / R_LNG
                                        }
                                    ]}
                                    pane="routePane"
                                    pathOptions={{ color: 'transparent', weight: 20 }}
                                >
                                    <Tooltip sticky>{displayName}</Tooltip>
                                </Polyline>
                            </React.Fragment>
                        );
                    }

                    return (
                        <Polyline
                            key={line.id}
                            positions={line.coordinates}
                            pane="routePane"
                            pathOptions={{
                                color: line.color || "rgba(0, 181, 255, 0.19)",
                                weight: line.weight || 5
                            }}
                        >
                            <Tooltip>{displayName}</Tooltip>
                        </Polyline>
                    );
                })}

                {lines.filter(line => line.categoryKey === 'Facilities' || line.categoryKey === 'Paths').map(line => {
                    const displayName = getLangString(line.name, currentLang);
                    return (
                        <Polyline
                            key={line.id}
                            positions={line.coordinates}
                            pane="kmlPathPane"
                            pathOptions={{
                                color: '#FFFFFF',
                                weight: line.weight || 4,
                                opacity: line.categoryKey === 'Paths' ? 0.1 : 0.2,
                            }}
                        >
                            <Tooltip>{displayName}</Tooltip>
                        </Polyline>
                    );
                })}

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
                isVillageFocused={isVillageFocused}
                setIsVillageFocused={onVillageFocusChange}
            />
        </div>
    );
};

export default MapView;
