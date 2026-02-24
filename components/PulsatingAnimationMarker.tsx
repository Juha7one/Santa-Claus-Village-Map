
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates } from '../types';

const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PulsatingAnimationMarker = ({ position, color }: { position: Coordinates, color: string }) => {
    const rgbaStart = hexToRgba(color, 0.7);
    const rgbaCenter = hexToRgba(color, 0.5);
    const rgbaEnd = hexToRgba(color, 0);
    const icon = new L.DivIcon({
        html: `<div style="--pulse-color-start: ${rgbaStart}; --pulse-color-center: ${rgbaCenter}; --pulse-color-end: ${rgbaEnd};"></div>`,
        className: 'pulse-animation-marker bg-transparent border-0',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
    return <Marker position={position} icon={icon} pane="markerPane" zIndexOffset={2000} />;
};

export default PulsatingAnimationMarker;