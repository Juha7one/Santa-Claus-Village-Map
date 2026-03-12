import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslations } from '../hooks/useTranslations';
import { Place } from '../types';
import { getCategoryColor } from '../constants';
import { getLangString, matchesSearch } from '../utils/langUtils';

interface HeaderProps {
    onToggleAdmin: () => void;
    isNavigating: boolean;
    onStopNavigation: () => void;
    allPlaces: Place[];
    onSelectPlace: (place: Place) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const StopNavigationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H5z" clipRule="evenodd" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({
    onToggleAdmin,
    isNavigating,
    onStopNavigation,
    allPlaces,
    onSelectPlace,
    searchQuery,
    onSearchChange
}) => {
    const t = useTranslations();
    const { i18n } = useTranslation();
    const currentLang = i18n.language?.split('-')[0] || 'en';

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        if (isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSearchOpen]);

    const filteredPlaces = useMemo(() => {
        if (!searchQuery) return [];

        // Use a Map to deduplicate by originalId or ID
        const uniqueMatches = new Map<string, Place>();

        allPlaces.forEach(p => {
            if (matchesSearch(p, searchQuery)) {
                const effectiveId = p.originalId || p.id;
                // Prefer the original version over "User-specific copies" (like Favorites/Car/Stay) in search results
                const isUserSpecificCopy = (p.categoryKey === 'Love this' || p.categoryKey === 'My Stay' || p.categoryKey === 'My Car') && !!p.originalId;

                const existing = uniqueMatches.get(effectiveId);
                if (!existing || !isUserSpecificCopy) {
                    uniqueMatches.set(effectiveId, p);
                }
            }
        });

        return Array.from(uniqueMatches.values()).slice(0, 8);
    }, [allPlaces, searchQuery]);

    const handlePlaceClick = (place: Place) => {
        onSelectPlace(place);
        setIsSearchOpen(false);
        onSearchChange('');
    }

    const getResultColor = (place: Place): string => {
        const { categoryKey, originalCategoryKey } = place;
        // For 'Love this' or 'My Stay' places that have an original category, use that original category's color.
        // Otherwise, use the place's own categoryKey. This ensures consistency with map markers.
        const colorKey = (categoryKey === 'Love this' || categoryKey === 'My Stay') && originalCategoryKey
            ? originalCategoryKey
            : categoryKey;
        return getCategoryColor(colorKey);
    };

    return (
        <header
            className="bg-[#B71C1C] text-white px-4 shadow-md flex items-center z-30 relative transition-all duration-300"
            style={{
                paddingTop: 'calc(1rem + var(--safe-area-inset-top))',
                paddingBottom: '1rem',
                height: isSearchOpen ? 'auto' : undefined
            }}
            ref={searchContainerRef}
        >
            {isSearchOpen ? (
                <div className="flex-1 flex items-center space-x-2">
                    <div className="relative flex-1">
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="w-full bg-red-100 text-gray-800 placeholder-gray-500 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder={t.ui.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 p-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => { setIsSearchOpen(false); onSearchChange(''); }}
                        className="text-white font-medium whitespace-nowrap px-2"
                    >
                        {t.ui.cancel}
                    </button>

                    {/* Search Results Dropdown */}
                    {filteredPlaces.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-amber-50 text-gray-800 shadow-xl rounded-b-lg overflow-hidden mt-1 z-50 max-h-[60vh] overflow-y-auto">
                            {filteredPlaces.map(place => {
                                const displayName = getLangString(place.name, currentLang);
                                return (
                                    <button
                                        key={place.id}
                                        className="w-full text-left px-4 py-3 border-b border-amber-200 hover:bg-amber-100 flex items-center space-x-3"
                                        onClick={() => handlePlaceClick(place)}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getResultColor(place) }}
                                        />
                                        <span className="font-medium truncate">{displayName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <h1 className="text-lg sm:text-xl font-bold flex-1 truncate mr-2">
                        {t.ui.mapTitle} <span className="text-[10px] opacity-60 font-normal ml-1">v1.1.3</span>
                    </h1>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="border-2 border-amber-100 text-amber-100 py-1.5 px-3 rounded-lg hover:bg-amber-100 hover:text-[#B71C1C] transition-colors flex items-center justify-center"
                            aria-label="Search"
                        >
                            <SearchIcon />
                        </button>
                        {isNavigating && (
                            <button
                                onClick={onStopNavigation}
                                className="bg-amber-50 text-[#B71C1C] font-semibold py-2 px-3 rounded-lg shadow hover:bg-amber-100 transition-colors flex items-center justify-center"
                                aria-label={t.ui.stopNavigation}
                            >
                                <StopNavigationIcon />
                                <span className="ml-2 hidden sm:inline">{t.ui.stop}</span>
                            </button>
                        )}
                        <button
                            id="user-places-button"
                            onClick={onToggleAdmin}
                            className="bg-amber-50 text-[#B71C1C] font-semibold py-2 px-3 rounded-lg shadow hover:bg-amber-100 transition-colors flex items-center justify-center"
                            aria-label={t.ui.toggleUserPlacesPanel}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
        </header>
    );
};

export default Header;
