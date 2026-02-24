
import React, { useMemo } from 'react';
import { Place, Coordinates } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { getCategoryColor } from '../constants';

const GoThereIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H5z" clipRule="evenodd" />
    </svg>
);

const FavouriteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

const BookingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

const ShopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
);

interface PlacePopupProps {
    place: Place;
    userLocation: Coordinates | null;
    onClose: () => void;
    onGetDirections: (place: Place) => void;
    onStopNavigation: () => void;
    onToggleFavourite: (place: Place) => void;
    isLoved: boolean;
    isMyStay: boolean;
    isNavigatingTo: boolean;
    isRouteLoading: boolean;
}

const PlacePopup: React.FC<PlacePopupProps> = ({ 
    place, userLocation, onClose, onGetDirections, onStopNavigation, 
    onToggleFavourite, isLoved, isMyStay, isNavigatingTo, isRouteLoading 
}) => {
    const t = useTranslations();

    const { imageUrl, descriptionHtml } = useMemo(() => {
        if (!place.description) {
            return { imageUrl: null, descriptionHtml: null };
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(place.description, 'text/html');
        const imgElement = doc.querySelector('img');
        
        if (imgElement) {
            const src = imgElement.getAttribute('src');
            imgElement.remove();
            const remainingHtml = doc.body.innerHTML;
            return { imageUrl: src, descriptionHtml: remainingHtml };
        }
        
        return { imageUrl: null, descriptionHtml: place.description };
    }, [place.description]);

    const isUserPlace = place.id.startsWith('user_place_');
    const isFavourite = place.categoryKey === 'Love this';
    
    // Logic for booking button
    const defaultBookingLink = "https://book.dinnerbooking.com/fi/en-US/book/index/3852/2";
    const bookingLink = place.bookingUrl || (place.categoryKey === 'Food-And-Drink' ? defaultBookingLink : null);

    const placeholderLink = "https://santaclausvillage.info/";
    let actionButton = null;

    if (place.categoryKey === 'Accommodation') {
        actionButton = {
            text: t.ui.book,
            link: placeholderLink,
            icon: <BookingIcon />,
            color: 'bg-green-600 hover:bg-green-700',
        };
    } else if (place.categoryKey === 'Shopping') {
        actionButton = {
            text: t.ui.shop,
            link: placeholderLink,
            icon: <ShopIcon />,
            color: 'bg-amber-700 hover:bg-amber-800',
        };
    }
    
    return (
        <div className="popup-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="popup-close-button" aria-label={t.ui.closePopup}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="p-4 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex-shrink-0">
                        <span id="popup-title" className="text-xs font-semibold uppercase" style={{ color: getCategoryColor(place.categoryKey) }}>{place.category}</span>
                        <h3 className="text-lg font-bold mt-1 text-gray-900">{place.name}</h3>
                    </div>
                    
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto my-3 pr-2 min-h-0">
                        {!isUserPlace && imageUrl && <img src={imageUrl} alt={place.name} className="w-full h-auto object-cover rounded-lg mb-2" loading="lazy" />}
                        {descriptionHtml && <div className="text-gray-600 text-sm" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />}
                        {isUserPlace && !descriptionHtml && !isFavourite && !isMyStay && <div className="text-gray-500 text-sm italic mt-2">{t.ui.yourCustomPlace}</div>}
                    </div>
                    
                    {/* Sticky Footer */}
                    <div className="flex-shrink-0 mt-auto border-t border-amber-200 pt-3 flex items-center space-x-2 flex-wrap gap-y-2">
                        {isNavigatingTo ? (
                            <button 
                                onClick={onStopNavigation} 
                                className="flex-grow flex items-center justify-center bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                <StopIcon /> {t.ui.stopNavigation}
                            </button>
                        ) : (
                            userLocation && (
                                <button 
                                    onClick={() => onGetDirections(place)} 
                                    className="flex-grow flex items-center justify-center bg-green-700 text-white font-semibold py-2 rounded-lg hover:bg-green-800 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-wait"
                                    disabled={isRouteLoading}
                                >
                                    <GoThereIcon /> {t.ui.goThere}
                                </button>
                            )
                        )}

                        {bookingLink && (
                            <a
                                href={bookingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center justify-center bg-amber-800 text-white font-semibold py-2 px-3 rounded-lg hover:bg-amber-900 transition-colors text-sm"
                                title={t.ui.bookTable}
                            >
                                <BookingIcon />
                                <span className="hidden sm:inline ml-2 whitespace-nowrap">{t.ui.bookTable}</span>
                            </a>
                        )}
                        {actionButton && (
                             <a
                                href={actionButton.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex-shrink-0 flex items-center justify-center text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm ${actionButton.color}`}
                                title={actionButton.text}
                            >
                                {actionButton.icon}
                                <span className="hidden sm:inline ml-2 whitespace-nowrap">{actionButton.text}</span>
                            </a>
                        )}
                         {(!isUserPlace || place.originalId) && (() => {
                            const isAcc = place.categoryKey === 'Accommodation' || place.originalCategoryKey === 'Accommodation' || place.categoryKey === 'My Stay';
                            const buttonTitle = isAcc
                                ? (isMyStay ? t.ui.removeMyStay : t.ui.setAsMyStay)
                                : (isLoved ? t.ui.unlovePlace : t.ui.lovePlace);

                            const handleClick = () => {
                                onToggleFavourite(place);
                                onClose();
                            };

                            return (
                                <button
                                    onClick={handleClick}
                                    className="p-2 flex-shrink-0 flex items-center justify-center bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                    title={buttonTitle}
                                    aria-label={buttonTitle}
                                >
                                    <FavouriteIcon />
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlacePopup;