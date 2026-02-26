

import L from 'leaflet';
import { getCategoryColor } from '../constants';
import { Place } from '../types';


// Icon for KML places
export const placeMarkerIcon = (categoryKey: string, selected: boolean, isLoved: boolean, placeId: string, subCategory?: string) => {
    // We ignore the specific place.color from KML to ensure strict consistency 
    // with the footer filter buttons and accessibility standards.
    const baseColor = getCategoryColor(categoryKey);

    // This branch is kept for logical completeness. In the current app flow, a "loved" place
    // is rendered as a UserPlace, so this logic is not hit for a standard KML marker.
    if (isLoved) {
        const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-white"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${baseColor};">${heartSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor for a circle
            popupAnchor: [0, -16]
        });
    }

    const color = selected ? '#2962FF' : baseColor; // Bright Blue for selection

    if (categoryKey === 'Food-And-Drink') {
        const foodIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" /></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">${foodIconSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor for a circle
            popupAnchor: [0, -16]
        });
    }

    if (categoryKey === 'Shopping') {
        const shoppingIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-white"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">${shoppingIconSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor for a circle
            popupAnchor: [0, -16]
        });
    }

    if (categoryKey === 'Accommodation') {
        const accommodationIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-white"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">${accommodationIconSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor for a circle
            popupAnchor: [0, -16]
        });
    }

    if (categoryKey === 'Activities') {
        const activitiesIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-white"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" /></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">${activitiesIconSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor for a circle
            popupAnchor: [0, -16]
        });
    }

    if (categoryKey === 'Attractions') {
        const attractionsIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-white"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">${attractionsIconSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16], // Center anchor for a circle
            popupAnchor: [0, -16]
        });
    }

    if (categoryKey === 'Facilities') {
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">
                     <span class="text-white font-bold text-lg leading-none select-none">i</span>
                   </div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }

    // Check for Bus stops in Transportation category
    if (categoryKey === 'Transportation' && (subCategory === 'bus' || placeId.toLowerCase().includes('bus-stop'))) {
        const busIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 203.22 210.57" fill="currentColor" class="w-5 h-5 text-white"><path d="M196.12,62.97h-6.21c-.39,0-.76.04-1.13.1V28.43c.03-.29.05-.57.05-.86,0-1.93-.63-3.82-1.83-5.63-.75-1.24-1.69-2.34-2.81-3.25C172.5,7.82,139.94,0,101.61,0S31.13,7.72,19.25,18.48c-1.47,1.14-2.68,2.59-3.53,4.27-.87,1.56-1.33,3.17-1.33,4.82,0,.15.01.29.02.43,0,.11-.02.21-.02.31v34.74c-.36-.05-.72-.09-1.09-.09h-6.21c-3.92,0-7.1,3.18-7.1,7.1v37.2c0,3.92,3.18,7.1,7.1,7.1h6.21c.37,0,.73-.04,1.09-.09v63.59c0,6.86,5.56,12.42,12.42,12.42h7.14v17.39c0,1.6,1.3,2.9,2.9,2.9h19.12c1.6,0,2.9-1.3,2.9-2.9v-17.39h85.46v17.39c0,1.6,1.3,2.9,2.9,2.9h19.12c1.6,0,2.9-1.3,2.9-2.9v-17.39h7.1c6.86,0,12.42-5.56,12.42-12.42v-63.6c.37.06.75.1,1.13.1h6.21c3.92,0,7.1-3.18,7.1-7.1v-37.2c0-3.92-3.18-7.1-7.1-7.1ZM58.14,17.99c0-4.55,3.68-8.23,8.23-8.23h70.48c4.55,0,8.23,3.68,8.23,8.23h0c0,4.55-3.68,8.23-8.23-8.23h-70.48c-4.55,0-8.23-3.68-8.23-8.23h0ZM46.99,174.76c-6.99,0-12.65-5.66-12.65-12.65s5.66-12.65,12.65-12.65,12.65,5.66,12.65,12.65-5.66,12.65-12.65,12.65ZM156.23,174.76c-6.99,0-12.65-5.66-12.65-12.65s5.66-12.65,12.65-12.65,12.65,5.66,12.65,12.65-5.66,12.65-12.65,12.65ZM171.94,122.45c0,6.28-5.09,11.37-11.37,11.37H42.65c-6.28,0-11.37-5.09-11.37-11.37V50.64c0-6.28,5.09-11.37,11.37-11.37h117.91c6.28,0,11.37,5.09,11.37,11.37v71.81Z"/></svg>`;
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">${busIconSvg}</div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }


    // Check for Parking spots in Transportation category
    if (categoryKey === 'Transportation' && (subCategory === 'parking' || placeId.toLowerCase().includes('parking') || !subCategory)) {
        return new L.DivIcon({
            html: `<div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color};">
                     <span class="text-white font-bold text-lg font-sans">P</span>
                   </div>`,
            className: 'bg-transparent border-0',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }

    // Use the default pin icon
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-8 h-8 drop-shadow-lg" style="color: ${color};"><path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.223.654-.369.395-.226.86-.52 1.358-.863.54-.38 1.14-.833 1.774-1.355a11.965 11.965 0 002.503-2.686 11.965 11.965 0 001.44-3.93C18.5 6.044 14.766 2 10 2S1.5 6.044 1.5 10c0 1.58.48 3.05 1.44 4.396a11.964 11.964 0 002.503 2.686c.635.522 1.234.975 1.774 1.355.498.343.963.637 1.358.863.254.146.468.27.654.369a5.745 5.745 0 00.28.14l.018.008.006.003zM10 12a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>`;

    return new L.DivIcon({
        html: `<div class="relative w-8 h-8">${iconSvg}</div>`,
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

// Icon for User Places
export const userPlaceMarkerIcon = (place: Place, selected: boolean, selectedCategory: string | null) => {
    const { categoryKey, originalCategoryKey } = place;

    // Determine the background color. For loved/stay places, use the original category color.
    const colorKey = (categoryKey === 'Love this' || categoryKey === 'My Stay') && originalCategoryKey
        ? originalCategoryKey
        : categoryKey;
    const baseColor = getCategoryColor(colorKey);
    const color = selected ? '#2962FF' : baseColor;

    // Determine the inner SVG icon.
    let iconSvg: string;
    let viewBox = "0 0 20 20";
    let wrapperSizeClasses = "w-8 h-8"; // Default to KML marker size
    let iconSizeClasses = "w-5 h-5";

    switch (categoryKey) {
        case 'My Stay':
        case 'Love this':
            // ALL loved places get a heart icon.
            iconSvg = `<path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />`;
            // If it's a custom-added point without an original category, make it slightly bigger to differentiate.
            if (!originalCategoryKey) {
                wrapperSizeClasses = "w-10 h-10";
                iconSizeClasses = "w-6 h-6";
            }
            break;
        case 'My Car':
            iconSvg = `<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>`;
            viewBox = "0 0 24 24";
            wrapperSizeClasses = "w-10 h-10"; // My Car is always a big icon
            iconSizeClasses = "w-6 h-6";
            break;
        default:
            // Should not happen for user places, but have a fallback.
            iconSvg = `<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />`;
            break;
    }

    const size = wrapperSizeClasses === "w-8 h-8" ? 32 : 40;
    const anchor = size / 2;
    const popupAnchor = -anchor;

    return new L.DivIcon({
        html: `<div class="${wrapperSizeClasses} rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color};"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor" class="${iconSizeClasses} text-white">${iconSvg}</svg></div>`,
        className: 'bg-transparent border-0',
        iconSize: [size, size],
        iconAnchor: [anchor, anchor],
        popupAnchor: [0, popupAnchor]
    });
};

export const userMarkerIcon = new L.DivIcon({
    html: `<div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg"></div>`,
    className: 'bg-transparent border-0 user-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});