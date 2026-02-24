
import React, { useMemo } from 'react';
import { Place } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { getCategoryColor } from '../constants';
import { AllCategoriesIcon, getCategoryIcon } from './CategoryIcons';


interface CategoryFilterProps {
    places: Place[],
    userPlaces: Place[],
    selectedCategory: string | null,
    onSelectCategory: (category: string | null) => void,
    showFavouritesRoute: boolean;
    setShowFavouritesRoute: (show: boolean) => void;
    isMyStayActive: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ places, userPlaces, selectedCategory, onSelectCategory, showFavouritesRoute, setShowFavouritesRoute, isMyStayActive }) => {
    const t = useTranslations();
    
    const buttonsToDisplay = useMemo(() => {
        const categoryOrder = [
            'Attractions',
            'Food-And-Drink',
            'Shopping',
            'Accommodation', // This also serves as a positional placeholder for 'My Stay'
            'Facilities',
            'Transportation',
            'Love this', // This will be added conditionally at the end
        ];

        // 1. Get a set of all unique category keys from the original KML places
        const existingKmlCategories = new Set(places.map(p => p.categoryKey));
        
        const finalButtons: string[] = [];

        // 2. Iterate through the desired order to build the button list deterministically
        for (const key of categoryOrder) {
            // Special handling for Accommodation/My Stay to ensure correct positioning
            if (key === 'Accommodation') {
                if (isMyStayActive) {
                    finalButtons.push('My Stay');
                } else if (existingKmlCategories.has('Accommodation')) {
                    finalButtons.push('Accommodation');
                }
            } 
            // Special handling for the master 'Love this' filter
            else if (key === 'Love this') {
                const hasAnyFavourite = userPlaces.some(p => ['Love this', 'My Car', 'My Stay'].includes(p.categoryKey));
                if (hasAnyFavourite) {
                    finalButtons.push('Love this');
                }
            } 
            // For all other standard categories
            else {
                if (existingKmlCategories.has(key)) {
                    finalButtons.push(key);
                }
            }
        }
        return finalButtons;
    }, [places, userPlaces, isMyStayActive]);


    const handleCategoryClick = (categoryKey: string) => {
        onSelectCategory(selectedCategory === categoryKey ? null : categoryKey);
    };
    
    // Include My Car and My Stay in the count for enabling route toggle
    const routeCategories = ['Love this', 'My Car', 'My Stay'];
    const favouritesCount = userPlaces.filter(p => routeCategories.includes(p.categoryKey)).length;
    const canShowFavouritesRoute = favouritesCount >= 2;

    const getTranslatedCategory = (categoryKey: string) => {
        return t.categories[categoryKey] || categoryKey;
    }

    return (
        <div 
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-0.5rem)] sm:w-auto sm:max-w-2xl px-0 pb-1 pt-8"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm py-1 px-4 rounded-full shadow-md flex items-center space-x-4 border border-amber-200">
                <p className="text-sm font-semibold text-gray-800 tracking-wider whitespace-nowrap">
                    {getTranslatedCategory(selectedCategory || 'allServices')}
                </p>
                {selectedCategory === 'Love this' && (
                    <div className="flex items-center space-x-2">
                        <label htmlFor="show-route-toggle" className="text-xs font-medium text-gray-600 whitespace-nowrap">{t.ui.showRoute}</label>
                        <button
                            id="show-route-toggle"
                            onClick={() => canShowFavouritesRoute && setShowFavouritesRoute(!showFavouritesRoute)}
                            className={`${showFavouritesRoute && canShowFavouritesRoute ? 'bg-red-600' : 'bg-gray-300'} relative inline-flex items-center h-5 rounded-full w-9 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                            role="switch"
                            aria-checked={showFavouritesRoute}
                            disabled={!canShowFavouritesRoute}
                            title={canShowFavouritesRoute ? t.ui.toggleFavouritesRoute : t.ui.addFavouritesToShowRoute}
                        >
                            <span className={`${showFavouritesRoute && canShowFavouritesRoute ? 'translate-x-5' : 'translate-x-1'} inline-block w-3 h-3 transform bg-white rounded-full transition-transform`} />
                        </button>
                    </div>
                )}
            </div>
    
            <div className="bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-lg flex items-start justify-center space-x-1 border border-amber-200">
                <button
                    onClick={() => onSelectCategory(null)}
                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 bg-gray-800 text-white ${selectedCategory ? 'opacity-25 hover:opacity-100' : 'ring-2 ring-offset-2 ring-white'}`}
                    title={t.ui.showAllCategories}
                >
                    <AllCategoriesIcon />
                </button>
                <div className="flex space-x-1 overflow-x-auto pb-1">
                    {buttonsToDisplay.map(categoryKey => {
                        const isSelected = selectedCategory === categoryKey;
                        const isAnySelected = selectedCategory !== null;
                        const opacityClass = isAnySelected && !isSelected ? 'opacity-25 hover:opacity-100' : 'opacity-100';
                        const color = getCategoryColor(categoryKey);
                        const selectionClass = isSelected ? 'ring-2 ring-offset-2 ring-white' : '';

                        return (
                            <button
                                key={categoryKey}
                                onClick={() => handleCategoryClick(categoryKey)}
                                style={{ backgroundColor: color }}
                                className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${opacityClass} ${selectionClass}`}
                                title={getTranslatedCategory(categoryKey)}
                            >
                                {getCategoryIcon(categoryKey)}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default CategoryFilter;