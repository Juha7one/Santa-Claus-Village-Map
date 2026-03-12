
import { Place, LineData, Coordinates, Bounds } from '../types';

const cleanDescription = (description: string): string => {
    // Add styling to images and clean up break tags.
    return description
        .replace(/<img /g, '<img class="w-full h-auto object-cover rounded-lg my-2" ')
        .replace(/(<br\s*\/?>\s*)+/g, '<br>') // Consolidate multiple br tags
        .trim();
};

const parseCoordinates = (coordString: string): Coordinates | null => {
    const parts = coordString.trim().split(',');
    if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
        }
    }
    return null;
}

const parseLineString = (coordString: string): Coordinates[] => {
    const coordPairs = coordString.trim().split(/\s+/);
    return coordPairs.map(pair => parseCoordinates(pair)).filter(c => c !== null) as Coordinates[];
}

const kmlColorToHex = (kmlColor: string | null | undefined): string | undefined => {
    if (!kmlColor || kmlColor.length < 8) return undefined;
    // KML color is aabbggrr
    // const a = kmlColor.substring(0, 2); // alpha - ignoring for now
    const b = kmlColor.substring(2, 4);
    const g = kmlColor.substring(4, 6);
    const r = kmlColor.substring(6, 8);
    return `#${r}${g}${b}`;
};

const getParentFolder = (element: Element | null): Element | null => {
    let parent = element?.parentElement;
    while (parent) {
        if (parent.tagName === 'Folder') {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
};


export const parseKML = (kmlString: string, translations: any): { places: Place[], lines: LineData[], mapCenter: Coordinates, bounds: Bounds | null } => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlString, "application/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length) {
        console.error("Failed to parse KML data.");
        const errorDetails = xmlDoc.getElementsByTagName("parsererror")[0]?.textContent;
        console.error("Parser Error Details:", errorDetails);
        return { places: [], lines: [], mapCenter: { lat: 66.543, lng: 25.846 }, bounds: null };
    }

    const kmlNamespace = 'http://www.opengis.net/kml/2.2';

    const places: Place[] = [];
    const lines: LineData[] = [];
    let firstCoords: Coordinates | null = null;

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    const styles = new Map<string, { color?: string, weight?: number }>();
    const styleMaps = new Map<string, string>();

    // Parse StyleMaps
    Array.from(xmlDoc.getElementsByTagNameNS(kmlNamespace, 'StyleMap')).forEach(node => {
        const id = node.getAttribute('id');
        if (id) {
            const normalStylePair = Array.from(node.getElementsByTagNameNS(kmlNamespace, 'Pair')).find(p => p.getElementsByTagNameNS(kmlNamespace, 'key')[0]?.textContent === 'normal');
            const styleUrl = normalStylePair?.getElementsByTagNameNS(kmlNamespace, 'styleUrl')[0]?.textContent;
            if (styleUrl) {
                styleMaps.set(`#${id}`, styleUrl);
            }
        }
    });

    // Parse Styles
    Array.from(xmlDoc.getElementsByTagNameNS(kmlNamespace, 'Style')).forEach(node => {
        const id = node.getAttribute('id');
        if (id) {
            const iconColorNode = node.getElementsByTagNameNS(kmlNamespace, 'IconStyle')[0]?.getElementsByTagNameNS(kmlNamespace, 'color')[0];
            const lineStyleNode = node.getElementsByTagNameNS(kmlNamespace, 'LineStyle')[0];
            const lineColorNode = lineStyleNode?.getElementsByTagNameNS(kmlNamespace, 'color')[0];
            const lineWidthNode = lineStyleNode?.getElementsByTagNameNS(kmlNamespace, 'width')[0];
            
            const color = kmlColorToHex(iconColorNode?.textContent || lineColorNode?.textContent);
            const weight = lineWidthNode ? parseFloat(lineWidthNode.textContent || '') : undefined;
            
            styles.set(`#${id}`, { color, weight });
        }
    });

    const updateBounds = (coords: Coordinates) => {
        minLat = Math.min(minLat, coords.lat);
        maxLat = Math.max(maxLat, coords.lat);
        minLng = Math.min(minLng, coords.lng);
        maxLng = Math.max(maxLng, coords.lng);
    };

    // Process all placemarks directly for robustness
    Array.from(xmlDoc.getElementsByTagNameNS(kmlNamespace, 'Placemark')).forEach(placemark => {
        const id = placemark.getAttribute('id');
        if (!id) return; // Skip placemarks without an ID, as they can't be translated.

        const kmlNameNode = placemark.getElementsByTagNameNS(kmlNamespace, 'name')[0];
        const kmlName = kmlNameNode ? kmlNameNode.textContent : null;

        const translationEntry = translations.places[id];
        const name = translationEntry?.name || kmlName || id;
        const description = translationEntry?.description || '';

        const parentFolder = getParentFolder(placemark);
        const categoryKey = parentFolder?.getAttribute('id') || 'Uncategorized';
        const category = translations.categories[categoryKey] || categoryKey;

        const styleUrlNode = placemark.getElementsByTagNameNS(kmlNamespace, 'styleUrl')[0];
        let finalStyle: { color?: string, weight?: number } | undefined;
        if (styleUrlNode?.textContent) {
            let styleUrl = styleUrlNode.textContent;
            // Resolve StyleMap to a normal Style
            if (styleMaps.has(styleUrl)) {
                styleUrl = styleMaps.get(styleUrl)!;
            }
            if (styles.has(styleUrl)) {
                finalStyle = styles.get(styleUrl);
            }
        }

        const pointNode = placemark.getElementsByTagNameNS(kmlNamespace, 'Point')[0];
        const point = pointNode ? pointNode.getElementsByTagNameNS(kmlNamespace, 'coordinates')[0] : null;

        const lineStringNodes = Array.from(placemark.getElementsByTagNameNS(kmlNamespace, 'LineString'));
        const lineStrings = lineStringNodes.map(node => node.getElementsByTagNameNS(kmlNamespace, 'coordinates')[0]).filter(Boolean);

        // Extract additional data from ExtendedData
        const extendedDataNode = placemark.getElementsByTagNameNS(kmlNamespace, 'ExtendedData')[0];
        const dataNodes = extendedDataNode ? extendedDataNode.getElementsByTagNameNS(kmlNamespace, 'Data') : [];
        let bookingUrl: string | undefined;
        let linkedWpUrl: string | undefined;
        let website: string | undefined;

        Array.from(dataNodes).forEach(node => {
            const dataName = node.getAttribute('name');
            const dataValue = node.getElementsByTagNameNS(kmlNamespace, 'value')[0]?.textContent?.trim();
            if (dataName === 'bookingUrl') bookingUrl = dataValue;
            if (dataName === 'linkedWpUrl') linkedWpUrl = dataValue;
            if (dataName === 'website' || dataName === 'Website') website = dataValue;
        });


        if (point) {
            const coords = parseCoordinates(point.textContent || '');
            if (coords) {
                if (!firstCoords) firstCoords = coords;
                updateBounds(coords);
                places.push({
                    id,
                    name,
                    category,
                    categoryKey,
                    description: cleanDescription(description),
                    imageUrl: null, // Images are now embedded in the description
                    location: coords,
                    color: finalStyle?.color,
                    bookingUrl: bookingUrl,
                    linkedWpUrl: linkedWpUrl,
                    website: website,
                });
            }
        } else if (lineStrings.length > 0) {
            lineStrings.forEach((lineString, index) => {
                const coords = parseLineString(lineString?.textContent || '');
                if (coords.length > 0) {
                    coords.forEach(updateBounds);
                    lines.push({
                        id: lineStrings.length > 1 ? `${id}-${index}` : id,
                        name,
                        category,
                        categoryKey,
                        coordinates: coords,
                        color: finalStyle?.color,
                        weight: finalStyle?.weight,
                    });
                }
            });
        }
    });

    const bounds: Bounds | null = (places.length > 0 || lines.length > 0)
        ? [[minLat, minLng], [maxLat, maxLng]]
        : null;

    return {
        places,
        lines,
        mapCenter: firstCoords || { lat: 66.543, lng: 25.846 },
        bounds,
    };
};
