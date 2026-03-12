import { Coordinates, LineData, Place, RouteSegment, Bounds } from '../types';

type OSRMRouteResponse = {
    code: string;
    routes: {
        geometry: {
            coordinates: [number, number][];
        };
        distance: number;
        duration: number;
    }[];
};

// --- BASIC GEOMETRY HELPERS ---

export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const lat1Rad = coord1.lat * Math.PI / 180;
    const lat2Rad = coord2.lat * Math.PI / 180;
    const deltaLatRad = (coord2.lat - coord1.lat) * Math.PI / 180;
    const deltaLngRad = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function findClosestPointOnLineSegment(p: Coordinates, a: Coordinates, b: Coordinates): Coordinates {
    const ab_lat = b.lat - a.lat;
    const ab_lng = b.lng - a.lng;
    const ap_lat = p.lat - a.lat;
    const ap_lng = p.lng - a.lng;
    const lenSq = ab_lat * ab_lat + ab_lng * ab_lng;
    if (lenSq === 0) return a;
    let t = (ap_lat * ab_lat + ap_lng * ab_lng) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { lat: a.lat + t * ab_lat, lng: a.lng + t * ab_lng };
}

function getLineIntersection(p1: Coordinates, p2: Coordinates, p3: Coordinates, p4: Coordinates): Coordinates | null {
    const x1 = p1.lng, y1 = p1.lat, x2 = p2.lng, y2 = p2.lat, x3 = p3.lng, y3 = p3.lat, x4 = p4.lng, y4 = p4.lat;
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null;
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    const eps = 1e-9;
    if (ua >= 0 - eps && ua <= 1 + eps && ub >= 0 - eps && ub <= 1 + eps) {
        return { lng: x1 + ua * (x2 - x1), lat: y1 + ua * (y2 - y1) };
    }
    return null;
}

// --- GRAPH TYPES ---
type GraphNodeId = string;
type GraphSegment = { id: string; u: Coordinates; v: Coordinates; length: number; uId: GraphNodeId; vId: GraphNodeId; };
type Graph = { nodes: Map<GraphNodeId, Coordinates>; adj: Map<GraphNodeId, Map<GraphNodeId, number>>; segments: GraphSegment[]; };
function coordKey(c: Coordinates): GraphNodeId { return `${c.lat.toFixed(7)},${c.lng.toFixed(7)}`; }

// --- GRAPH CONSTRUCTION ---
function buildWalkingGraph(paths: LineData[]): Graph {
    let currentSegments: { p1: Coordinates, p2: Coordinates }[] = [];
    paths.forEach(path => {
        for (let i = 0; i < path.coordinates.length - 1; i++) {
            currentSegments.push({ p1: path.coordinates[i], p2: path.coordinates[i + 1] });
        }
    });
    const MAX_PASSES = 3;
    for (let pass = 0; pass < MAX_PASSES; pass++) {
        const splits = new Map<number, Coordinates[]>();
        let hasSplits = false;
        for (let i = 0; i < currentSegments.length; i++) {
            for (let j = i + 1; j < currentSegments.length; j++) {
                const s1 = currentSegments[i], s2 = currentSegments[j];
                const intersection = getLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
                if (intersection) {
                    const isEnd1 = calculateDistance(intersection, s1.p1) < 0.1 || calculateDistance(intersection, s1.p2) < 0.1;
                    const isEnd2 = calculateDistance(intersection, s2.p1) < 0.1 || calculateDistance(intersection, s2.p2) < 0.1;
                    if (!isEnd1) { if (!splits.has(i)) splits.set(i, []); splits.get(i)!.push(intersection); hasSplits = true; }
                    if (!isEnd2) { if (!splits.has(j)) splits.set(j, []); splits.get(j)!.push(intersection); hasSplits = true; }
                }
            }
        }
        if (!hasSplits) break;
        const nextSegments: { p1: Coordinates, p2: Coordinates }[] = [];
        for (let i = 0; i < currentSegments.length; i++) {
            const seg = currentSegments[i], segSplits = splits.get(i);
            if (segSplits && segSplits.length > 0) {
                segSplits.sort((a, b) => calculateDistance(seg.p1, a) - calculateDistance(seg.p1, b));
                let prev = seg.p1;
                segSplits.forEach(splitPoint => {
                    if (calculateDistance(prev, splitPoint) > 0.1) { nextSegments.push({ p1: prev, p2: splitPoint }); prev = splitPoint; }
                });
                if (calculateDistance(prev, seg.p2) > 0.1) nextSegments.push({ p1: prev, p2: seg.p2 });
            } else { nextSegments.push(seg); }
        }
        currentSegments = nextSegments;
    }
    const nodes = new Map<GraphNodeId, Coordinates>(), adj = new Map<GraphNodeId, Map<GraphNodeId, number>>(), finalSegments: GraphSegment[] = [];
    const addNode = (c: Coordinates) => {
        const key = coordKey(c);
        if (!nodes.has(key)) nodes.set(key, c);
        if (!adj.has(key)) adj.set(key, new Map());
        return key;
    };
    currentSegments.forEach((s, idx) => {
        const uId = addNode(s.p1), vId = addNode(s.p2), dist = calculateDistance(s.p1, s.p2);
        if (dist < 0.05) return;
        adj.get(uId)!.set(vId, dist); adj.get(vId)!.set(uId, dist);
        finalSegments.push({ id: `seg-${idx}`, u: s.p1, v: s.p2, length: dist, uId, vId });
    });
    const WELD_DIST = 5.0, nodeKeys = Array.from(nodes.keys());
    for (let i = 0; i < nodeKeys.length; i++) {
        for (let j = i + 1; j < nodeKeys.length; j++) {
            const k1 = nodeKeys[i], k2 = nodeKeys[j], p1 = nodes.get(k1)!, p2 = nodes.get(k2)!;
            if (Math.abs(p1.lat - p2.lat) > 0.0001 || Math.abs(p1.lng - p2.lng) > 0.0002) continue;
            const d = calculateDistance(p1, p2);
            if (d < WELD_DIST && !adj.get(k1)?.has(k2)) { adj.get(k1)!.set(k2, d); adj.get(k2)!.set(k1, d); }
        }
    }
    return { nodes, adj, segments: finalSegments };
}

// --- ROUTING ALGORITHMS ---
function findPathDijkstra(startNode: GraphNodeId, endNode: GraphNodeId, adj: Map<GraphNodeId, Map<GraphNodeId, number>>): string[] | null {
    const dist = new Map<string, number>(), prev = new Map<string, string | null>(), pq: string[] = [];
    dist.set(startNode, 0); pq.push(startNode);
    while (pq.length > 0) {
        pq.sort((a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity));
        const u = pq.shift()!;
        if (u === endNode) {
            const path: string[] = []; let curr: string | null = endNode;
            while (curr) { path.unshift(curr); curr = prev.get(curr) || null; }
            return path;
        }
        const uDist = dist.get(u); if (uDist === undefined || uDist === Infinity) break;
        const neighbors = adj.get(u);
        if (neighbors) {
            for (const [v, weight] of neighbors.entries()) {
                const alt = uDist + weight;
                if (alt < (dist.get(v) ?? Infinity)) { dist.set(v, alt); prev.set(v, u); if (!pq.includes(v)) pq.push(v); }
            }
        }
    }
    return null;
}

export async function calculateWalkingRoute(start: Coordinates, end: Coordinates, localPaths: LineData[], signal: AbortSignal): Promise<RouteSegment[]> {
    const walkingPaths = localPaths.filter(p => p.categoryKey === 'Facilities' || p.categoryKey === 'Paths');
    if (walkingPaths.length === 0) return [];
    const graph = buildWalkingGraph(walkingPaths);
    const findProjection = (p: Coordinates): { point: Coordinates, segment: GraphSegment, dist: number } | null => {
        let best: { point: Coordinates, segment: GraphSegment, dist: number } | null = null, minDist = Infinity;
        for (const seg of graph.segments) {
            const proj = findClosestPointOnLineSegment(p, seg.u, seg.v), d = calculateDistance(p, proj);
            if (d < minDist) { minDist = d; best = { point: proj, segment: seg, dist: d }; }
        }
        return best;
    };
    const startProj = findProjection(start), endProj = findProjection(end);
    if (!startProj || !endProj) return [];
    if (startProj.segment.id === endProj.segment.id) {
        return [{ type: 'path', geometry: [start, startProj.point, endProj.point, end], distance: startProj.dist + calculateDistance(startProj.point, endProj.point) + endProj.dist, duration: (startProj.dist + calculateDistance(startProj.point, endProj.point) + endProj.dist) / 1.4 }];
    }
    const sNodeId = 'TEMP_START', eNodeId = 'TEMP_END';
    const injectNodeOnSegment = (tempId: string, proj: { point: Coordinates, segment: GraphSegment }) => {
        graph.nodes.set(tempId, proj.point); if (!graph.adj.has(tempId)) graph.adj.set(tempId, new Map());
        const uId = proj.segment.uId, vId = proj.segment.vId, d1 = calculateDistance(proj.point, proj.segment.u), d2 = calculateDistance(proj.point, proj.segment.v);
        graph.adj.get(tempId)!.set(uId, d1); graph.adj.get(tempId)!.set(vId, d2); graph.adj.get(uId)?.set(tempId, d1); graph.adj.get(vId)?.set(tempId, d2);
    };
    injectNodeOnSegment(sNodeId, startProj); injectNodeOnSegment(eNodeId, endProj);
    const pathIds = findPathDijkstra(sNodeId, eNodeId, graph.adj);
    if (!pathIds) { const d = calculateDistance(start, end); if (d > 1000) return []; return [{ type: 'path', geometry: [start, end], distance: d, duration: d / 1.4 }]; }
    const geometry: Coordinates[] = [start]; pathIds.forEach(id => { const node = graph.nodes.get(id); if (node) geometry.push(node); }); geometry.push(end);
    const cleanGeometry = geometry.filter((p, i) => { if (i === 0) return true; return calculateDistance(p, geometry[i - 1]) > 0.1; });
    let totalDist = 0; for (let i = 0; i < cleanGeometry.length - 1; i++) { totalDist += calculateDistance(cleanGeometry[i], cleanGeometry[i + 1]); }
    return [{ type: 'path', geometry: cleanGeometry, distance: totalDist, duration: totalDist / 1.4 }];
}

// --- VIRTUAL FENCE LOGIC (SOLUTION 1 & 2) ---

function isInsidePolygon(point: Coordinates, polygon: Coordinates[]): boolean {
    let x = point.lng, y = point.lat;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].lng, yi = polygon[i].lat;
        let xj = polygon[j].lng, yj = polygon[j].lat;
        let intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function isInsideBounds(point: Coordinates, bounds: Bounds): boolean {
    if (!bounds) return true;
    const [min, max] = bounds;
    return point.lat >= min[0] && point.lat <= max[0] && point.lng >= min[1] && point.lng <= max[1];
}

/** 
 * THE VIRTUAL FENCE: 
 * Tilted Polygon (roughly 12°) to perfectly cover the houses without touching Joulumaantie.
 */
export const RESTRICTED_WONK_POLYGON: Coordinates[] = [
    { lat: 66.54225, lng: 25.8345 }, // NW (Yellow Box Position)
    { lat: 66.54245, lng: 25.8385 }, // NE (Yellow Box Position)
    { lat: 66.54175, lng: 25.8388 }, // SE (Yellow Box Position)
    { lat: 66.54155, lng: 25.8348 }  // SW (Yellow Box Position)
];

function filterWonkyPoints(geometry: Coordinates[]): Coordinates[] {
    const filtered = geometry.filter(p => !isInsidePolygon(p, RESTRICTED_WONK_POLYGON));
    return filtered.length > 0 ? filtered : geometry;
}

// --- ROUTE FETCHING ---

function handleRouteData(data: any, mode: 'driving' | 'foot'): { geometry: Coordinates[], distance: number, duration: number, isRoute: boolean } {
    const route = data.routes[0];
    let geometry = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    
    // APPLY VIRTUAL FENCE: Solution 1 & 2
    if (mode === 'driving') {
        geometry = filterWonkyPoints(geometry);
    }

    return { geometry, distance: route.distance, duration: route.duration, isRoute: true };
}

/** Pure Routing Helper (Trusting OSM servers natively) */
async function fetchOSRMRoute(
    points: Coordinates[], 
    mode: 'driving' | 'foot', 
    signal: AbortSignal,
    radiuses?: string[]
): Promise<{ geometry: Coordinates[], distance: number, duration: number, isRoute: boolean }> {
    const pointsStr = points.map(p => `${p.lng},${p.lat}`).join(';');
    const profile = mode === 'driving' ? 'driving' : 'foot';
    const baseUrl = mode === 'driving' ? 'https://routing.openstreetmap.de/routed-car' : 'https://routing.openstreetmap.de/routed-foot';
    let url = `${baseUrl}/route/v1/${profile}/${pointsStr}?overview=full&geometries=geojson&alternatives=false`;
    if (radiuses) url += `&radiuses=${radiuses.join(';')}`;

    try {
        const response = await fetch(url, { signal });
        const data = await response.json();
        if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('OSRM error');
        return handleRouteData(data, mode);
    } catch (error) {
        if ((error as Error).name !== 'AbortError') console.warn("OSRM failed, falling back", error);
        const start = points[0], end = points[points.length - 1], dist = calculateDistance(start, end);
        return { geometry: [start, end], distance: dist, duration: mode === 'driving' ? dist / 5.5 : dist / 1.4, isRoute: false };
    }
}

/** Calculates a multi-modal route. Match official OSM behavior exactly. */
export async function getRoute(start: Coordinates, end: Coordinates, allPlaces: Place[], localPaths: LineData[], bounds: Bounds | null, signal: AbortSignal): Promise<{ segments: RouteSegment[], mode: 'walk' | 'car', bestParking: Place | null }> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const isEndInside = bounds ? isInsideBounds(end, bounds) : true;
    const isStartInside = bounds ? isInsideBounds(start, bounds) : true;

    // 1. Simple Case: Destination is outside or already deep inside.
    if (!isEndInside || (isStartInside && calculateDistance(start, end) < 150)) {
        const mode = (isStartInside && isEndInside) ? 'foot' : 'driving';
        const remoteRoute = await fetchOSRMRoute([start, end], mode, signal);
        return {
            segments: [{
                type: mode === 'driving' ? 'road' : 'path',
                geometry: remoteRoute.geometry,
                distance: remoteRoute.distance,
                duration: remoteRoute.duration
            }],
            mode: mode === 'driving' ? 'car' : 'walk',
            bestParking: null,
        };
    }

    // 2. Multi-modal: Driving to a Parking spot.
    const parkingSpots = allPlaces.filter(p => {
        if (p.categoryKey !== 'Transportation') return false;
        const nameMatch = (name: any) => {
            const n = typeof name === 'object' ? Object.values(name).join(' ') : String(name);
            return n.toLowerCase().includes('parking') || n.toLowerCase().includes('pysäköinti');
        };
        return nameMatch(p.name) || (p.id && (p.id.toLowerCase().includes('parking') || p.id.toLowerCase().includes('pysäköinti')));
    });

    if (parkingSpots.length > 0) {
        let nearestParking: Place | null = null, minWalkDistance = Infinity;
        for (const parking of parkingSpots) {
            const walkingSegments = await calculateWalkingRoute(parking.location, end, localPaths, signal);
            const totalWalkDist = walkingSegments.reduce((sum, seg) => sum + seg.distance, 0);
            if (totalWalkDist > 0 && totalWalkDist < minWalkDistance) { minWalkDistance = totalWalkDist; nearestParking = parking; }
        }
        if (!nearestParking) nearestParking = parkingSpots.sort((a,b) => calculateDistance(a.location, end) - calculateDistance(b.location, end))[0];

        if (nearestParking) {
            const waypoints = [start];
            const radiuses = ['unlimited'];
            if (nearestParking.subCategory === 'parking-south') {
                waypoints.push({ lat: 66.541661, lng: 25.836085 });
                radiuses.push('1000');
            }
            waypoints.push(nearestParking.location);
            radiuses.push('unlimited');

            const drivingRoute = await fetchOSRMRoute(waypoints, 'driving', signal, radiuses);
            const segments: RouteSegment[] = [{ type: 'road', geometry: drivingRoute.geometry, distance: drivingRoute.distance, duration: drivingRoute.duration }];
            const walkingSegments_Final = await calculateWalkingRoute(nearestParking.location, end, localPaths, signal);
            if (walkingSegments_Final.length > 0) segments.push(...walkingSegments_Final);
            else { const dist = calculateDistance(nearestParking.location, end); segments.push({ type: 'path', geometry: [nearestParking.location, end], distance: dist, duration: dist / 1.4 }); }
            return { segments, mode: 'car', bestParking: nearestParking };
        }
    }

    const fallbackRoute = await fetchOSRMRoute([start, end], 'driving', signal);
    return { segments: [{ type: 'road', geometry: fallbackRoute.geometry, distance: fallbackRoute.distance, duration: fallbackRoute.duration }], mode: 'car', bestParking: null };
}
