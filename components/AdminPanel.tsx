
import React, { useState, useRef } from 'react';
import { Place } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { getCategoryColor } from '../constants';

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
    </svg>
);
const StayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
);
const LoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const DragHandleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 cursor-grab mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5z" fillOpacity="0" />
        <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
    </svg>
);

interface AdminPanelProps {
    userPlaces: Place[];
    onDelete: (placeId: string) => void;
    onClose: () => void;
    onStartPickingLocation: (type: string) => void;
    onUpdateUserPlaces: (places: Place[]) => void;
    showFavouritesRoute: boolean;
    setShowFavouritesRoute: (show: boolean) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
    userPlaces,
    onDelete,
    onClose,
    onStartPickingLocation,
    onUpdateUserPlaces,
    showFavouritesRoute,
    setShowFavouritesRoute,
}) => {
    const t = useTranslations();
    const [isDragging, setIsDragging] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const routeCategories = ['Love this', 'My Car', 'My Stay'];

    // EXTREMELY Defensive filtering to prevent white screen crashes
    const places = (userPlaces || []).filter(p => p && p.id && p.categoryKey);
    console.log("[AdminPanel] Rendering with valid places count:", places.length);

    const favouritePlaces = places.filter(p => routeCategories.includes(p.categoryKey));
    const otherPlaces = places.filter(p => !routeCategories.includes(p.categoryKey));

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragItem.current = index;
        setIsDragging(true);
        setDraggedIndex(index);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        setIsDragging(false);
        setDraggedIndex(null);
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const reorderedFavourites = [...favouritePlaces];
            const [draggedItem] = reorderedFavourites.splice(dragItem.current, 1);
            reorderedFavourites.splice(dragOverItem.current, 0, draggedItem);
            onUpdateUserPlaces([...otherPlaces, ...reorderedFavourites]);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const canShowFavouritesRoute = favouritePlaces.length >= 2;

    const placeCategoriesToAdd = [
        { key: 'My Car', label: (t.categories && t.categories['My Car']) || 'My Car', icon: <CarIcon /> },
        { key: 'My Stay', label: (t.categories && t.categories['My Stay']) || 'My Stay', icon: <StayIcon /> },
        { key: 'Love this', label: (t.categories && t.categories['Love this']) || 'Favorites', icon: <LoveIcon /> },
    ];

    const getIconForCategory = (categoryKey: string) => {
        switch (categoryKey) {
            case 'My Car': return <CarIcon />;
            case 'My Stay': return <StayIcon />;
            case 'Love this': return <LoveIcon />;
            default: return <LoveIcon />;
        }
    };

    return (
        <div className="absolute top-0 right-0 h-full w-full sm:w-80 bg-amber-50 shadow-lg z-40 flex flex-col transform transition-transform"
            style={{
                paddingTop: 'calc(1rem + var(--safe-area-inset-top))',
                paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))',
            }}
        >
            <div className="p-4 border-b border-amber-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">{(t.ui && t.ui.myPlaces) || 'My Places'}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label={(t.ui && t.ui.closePanel) || 'Close'}>
                    <CloseIcon />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">{(t.ui && t.ui.addNewPlace) || 'Add new place'}</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {placeCategoriesToAdd.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => onStartPickingLocation(cat.key)}
                                style={{ backgroundColor: getCategoryColor(cat.key) }}
                                className="flex items-center justify-center text-sm text-white font-semibold py-2 px-3 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                {cat.icon}
                                <span className="ml-2">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {otherPlaces.length > 0 || favouritePlaces.length > 0 ? (
                    <div className="space-y-2">
                        {otherPlaces.map(place => (
                            <div key={place.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-amber-200">
                                <span className="font-medium text-gray-700 truncate pr-2">{place.name}</span>
                                <button onClick={() => onDelete(place.id)} className="text-red-500 hover:text-red-700 flex-shrink-0" aria-label={`${(t.ui && t.ui.delete) || 'Delete'} ${place.name}`}>
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 text-sm mt-8">{(t.ui && t.ui.noPlacesAdded) || 'No places added'}</p>
                )}

                <div className="pt-4 border-t border-amber-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{(t.ui && t.ui.favouritesRoute) || 'Favorites Route'}</h3>
                    {favouritePlaces.length < 2 && (
                        <p className="text-sm text-gray-500">{(t.ui && t.ui.addFavouritesForRoute) || 'Add two favorites for route'}</p>
                    )}
                    {canShowFavouritesRoute && (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-200">
                            <span className="font-medium text-gray-700">{(t.ui && t.ui.showRouteOnMap) || 'Show route on map'}</span>
                            <button
                                id="show-route-toggle"
                                onClick={() => setShowFavouritesRoute(!showFavouritesRoute)}
                                className={`${showFavouritesRoute ? 'bg-red-600' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                                role="switch"
                                aria-checked={showFavouritesRoute}
                            >
                                <span className={`${showFavouritesRoute ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                            </button>
                        </div>
                    )}
                    {favouritePlaces.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">{(t.ui && t.ui.dragReorder) || 'Drag to reorder'}</p>
                    )}
                    <ul className="mt-2 space-y-2">
                        {favouritePlaces.map((place, index) => (
                            <li
                                key={place.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className={`bg-white p-2 rounded-lg shadow-sm flex justify-between items-center transition-opacity border border-amber-200 ${isDragging ? 'cursor-grabbing' : ''} ${draggedIndex === index ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-center space-x-2 min-w-0">
                                    <DragHandleIcon />
                                    <div
                                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: getCategoryColor(place.categoryKey || 'Love this') }}
                                    >
                                        <div className="text-white transform scale-75">
                                            {getIconForCategory(place.categoryKey || 'Love this')}
                                        </div>
                                    </div>
                                    <span className="font-medium text-gray-700 truncate">{place.name}</span>
                                </div>
                                <button onClick={() => onDelete(place.id)} className="flex-shrink-0 text-red-500 hover:text-red-700 ml-2" aria-label={`${(t.ui && t.ui.delete) || 'Delete'} ${place.name}`}>
                                    <TrashIcon />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default AdminPanel;
