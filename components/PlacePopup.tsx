
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Place, Coordinates } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { getCategoryColor } from '../constants';
import { getLangString } from '../utils/langUtils';

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);

const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
);

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
);

const InstagramIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
);

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
    const { i18n } = useTranslation();

    const currentLang = i18n.language?.split('-')[0] || 'en';

    const localizedName = useMemo(() => getLangString(place.name, currentLang), [place.name, currentLang]);
    const localizedDescription = useMemo(() => getLangString(place.description, currentLang), [place.description, currentLang]);
    const localizedAddress = useMemo(() => getLangString(place.address, currentLang), [place.address, currentLang]);
    const localizedOpeningHours = useMemo(() => getLangString(place.openingHours, currentLang), [place.openingHours, currentLang]);

    const hasDetails = useMemo(() => {
        return !!(
            place.imageUrl ||
            localizedDescription ||
            localizedOpeningHours ||
            place.phone ||
            place.email ||
            place.website ||
            localizedAddress ||
            place.facebookUrl ||
            place.instagramUrl
        );
    }, [place, localizedDescription, localizedOpeningHours, localizedAddress]);

    const isUserPlace = place.categoryKey === 'My Car' || place.categoryKey === 'My Stay' || place.categoryKey === 'Love this';
    const isFavourite = place.categoryKey === 'Love this';

    // Helper for category label
    const categoryLabel = (t.categories && t.categories[place.categoryKey]) || place.category || 'Place';

    // Helper for booking info
    const isFoodCategory = place.categoryKey === 'Food-And-Drink';
    const bookingLink = place.bookingUrl || place.website;
    const bookingLabel = isFoodCategory ? (t.ui && t.ui.bookTable) || 'Book Table' : (t.ui && t.ui.bookNow) || 'Book Now';

    return (
        <div className="popup-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <div className="popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                <button onClick={onClose} className="popup-close-button" aria-label={(t.ui && t.ui.closePopup) || 'Close'}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* 1. Sticky Header */}
                <div className="p-4 flex-shrink-0 border-b border-amber-100">
                    <span id="popup-title" className="text-xs font-semibold uppercase" style={{ color: getCategoryColor(place.categoryKey) }}>
                        {categoryLabel}
                    </span>
                    <h3 className="text-lg font-bold mt-1 text-gray-900 leading-tight">{localizedName}</h3>
                </div>

                {/* 2. Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                    {hasDetails ? (
                        <div className="space-y-4">
                            {!isUserPlace && place.imageUrl && (
                                <img src={place.imageUrl} alt={place.name} className="w-full h-auto object-cover rounded-xl shadow-md border border-amber-100" />
                            )}

                            {localizedDescription && (
                                <div className="text-gray-700 text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: localizedDescription }} />
                            )}

                            {isUserPlace && !localizedDescription && !isFavourite && !isMyStay && (
                                <div className="text-gray-500 text-sm italic">{(t.ui && t.ui.yourCustomPlace) || 'Your custom place.'}</div>
                            )}

                            {(localizedOpeningHours || place.phone || place.email || place.website || localizedAddress) && (
                                <div className="pt-4 mt-6 border-t border-amber-100 space-y-4">
                                    {localizedOpeningHours && (
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                                            <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">{(t.ui && t.ui.openingHours) || 'Opening Hours'}</h4>
                                            <div className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{localizedOpeningHours}</div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {localizedAddress && (
                                            <div className="flex items-start text-sm text-gray-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 mt-0.5 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                                <span>{localizedAddress}</span>
                                            </div>
                                        )}
                                        {place.phone && (
                                            <a href={`tel:${place.phone}`} className="flex items-center text-sm text-green-700 font-semibold hover:underline">
                                                <PhoneIcon /> {place.phone}
                                            </a>
                                        )}
                                        {place.email && (
                                            <a href={`mailto:${place.email}`} className="flex items-center text-sm text-green-700 font-semibold hover:underline">
                                                <EmailIcon /> {place.email}
                                            </a>
                                        )}
                                        {place.website && (
                                            <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-green-700 font-semibold hover:underline">
                                                <GlobeIcon /> {(t.ui && t.ui.visitWebsite) || 'Visit Website'}
                                            </a>
                                        )}
                                    </div>

                                    {(place.facebookUrl || place.instagramUrl) && (
                                        <div className="flex space-x-4 pt-2">
                                            {place.facebookUrl && (
                                                <a href={place.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:scale-110 transition-transform">
                                                    <FacebookIcon />
                                                </a>
                                            )}
                                            {place.instagramUrl && (
                                                <a href={place.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:scale-110 transition-transform">
                                                    <InstagramIcon />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-400 italic">
                            {(t.ui && t.ui.noDetailsAvailable) || 'No details available.'}
                        </div>
                    )}
                </div>

                {/* 3. Sticky Footer */}
                <div className="p-4 flex-shrink-0 border-t border-amber-200 bg-amber-50/50 flex items-center gap-2">
                    {isNavigatingTo ? (
                        <button
                            onClick={onStopNavigation}
                            className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center text-sm"
                        >
                            <StopIcon /> <span className="ml-2">{(t.ui && t.ui.stopNavigation) || 'Stop'}</span>
                        </button>
                    ) : (
                        userLocation && (
                            <button
                                onClick={() => onGetDirections(place)}
                                className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl hover:bg-green-800 transition-colors shadow-sm flex items-center justify-center text-sm disabled:bg-gray-400"
                                disabled={isRouteLoading}
                            >
                                <GoThereIcon /> <span className="ml-2">{(t.ui && t.ui.goThere) || 'Directions'}</span>
                            </button>
                        )
                    )}

                    {bookingLink && (
                        <a
                            href={bookingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-4 py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center text-sm transition-colors ${isFoodCategory ? 'bg-amber-800 hover:bg-amber-900' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            <BookingIcon />
                            <span className="hidden sm:inline ml-2">{bookingLabel}</span>
                        </a>
                    )}

                    {(!isUserPlace || place.originalId) && (() => {
                        const isAcc = place.categoryKey === 'Accommodation' || place.originalCategoryKey === 'Accommodation' || place.categoryKey === 'My Stay';
                        const buttonTitle = isAcc
                            ? (isMyStay ? (t.ui && t.ui.removeMyStay) : (t.ui && t.ui.setAsMyStay))
                            : (isLoved ? (t.ui && t.ui.unlovePlace) : (t.ui && t.ui.lovePlace));

                        return (
                            <button
                                onClick={() => { onToggleFavourite(place); onClose(); }}
                                className={`w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center rounded-xl shadow-sm border-2 transition-all ${isLoved || isMyStay ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-red-500 text-red-600'}`}
                                title={buttonTitle || 'Action'}
                            >
                                <FavouriteIcon />
                            </button>
                        );
                    })()}
                </div>
            </div >
        </div >

    );
};

export default PlacePopup;