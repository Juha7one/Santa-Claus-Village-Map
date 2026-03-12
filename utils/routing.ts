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

/** Calculates the distance between two points in meters using the Haversine formula. */
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

/** Projects point P onto the line segment AB. Returns the closest point on the segment. */
function findClosestPointOnLineSegment(p: Coordinates, a: Coordinates, b: Coordinates): Coordinates {
    const ab_lat = b.lat - a.lat;
    const ab_lng = b.lng - a.lng;
    const ap_lat = p.lat - a.lat;
    const ap_lng = p.lng - a.lng;

    const lenSq = ab_lat * ab_lat + ab_lng * ab_lng;
    if (lenSq === 0) return a;

    // Project vector AP onto AB
    let t = (ap_lat * ab_lat + ap_lng * ab_lng) / lenSq;
    // Clamp to segment
    t = Math.max(0, Math.min(1, t));

    return {
        lat: a.lat + t * ab_lat,
        lng: a.lng + t * ab_lng
    };
}

/** Checks if two line segments (p1-p2 and p3-p4) intersect. Returns the intersection point or null. */
function getLineIntersection(p1: Coordinates, p2: Coordinates, p3: Coordinates, p4: Coordinates): Coordinates | null {
    const x1 = p1.lng, y1 = p1.lat;
    const x2 = p2.lng, y2 = p2.lat;
    const x3 = p3.lng, y3 = p3.lat;
    const x4 = p4.lng, y4 = p4.lat;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null; // Parallel lines

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    // Check if intersection is strictly within segments (using epsilon for float precision)
    const eps = 1e-9;
    if (ua >= 0 - eps && ua <= 1 + eps && ub >= 0 - eps && ub <= 1 + eps) {
        return {
            lng: x1 + ua * (x2 - x1),
            lat: y1 + ua * (y2 - y1)
        };
    }
    return null;
}

// --- GRAPH TYPES ---

type GraphNodeId = string;

// A segment representing an edge in our graph
type GraphSegment = {
    id: string;
    u: Coordinates;
    v: Coordinates;
    length: number;
    uId: GraphNodeId;
    vId: GraphNodeId;
};

// A node in the graph
type Graph = {
    nodes: Map<GraphNodeId, Coordinates>;
    adj: Map<GraphNodeId, Map<GraphNodeId, number>>; // Adjacency list: NodeID -> NeighborID -> Weight
    segments: GraphSegment[]; // Keep track of raw segments for projection
};

function coordKey(c: Coordinates): GraphNodeId {
    return `${c.lat.toFixed(7)},${c.lng.toFixed(7)}`;
}

// --- GRAPH CONSTRUCTION ---

/** 
 * 1. Explodes KML paths into atomic segments.
 * 2. Finds intersections and splits segments.
 * 3. Builds a connected graph.
 */
function buildWalkingGraph(paths: LineData[]): Graph {
    // 1. Collect all initial segments from paths
    let currentSegments: { p1: Coordinates, p2: Coordinates }[] = [];
    paths.forEach(path => {
        for (let i = 0; i < path.coordinates.length - 1; i++) {
            currentSegments.push({ p1: path.coordinates[i], p2: path.coordinates[i + 1] });
        }
    });

    // 2. Handle Intersections
    // We repeat splitting until no new splits occur (limit passes for safety)
    const MAX_PASSES = 3;

    for (let pass = 0; pass < MAX_PASSES; pass++) {
        const splits = new Map<number, Coordinates[]>();
        let hasSplits = false;

        for (let i = 0; i < currentSegments.length; i++) {
            for (let j = i + 1; j < currentSegments.length; j++) {
                const s1 = currentSegments[i];
                const s2 = currentSegments[j];

                const intersection = getLineIntersection(s1.p1, s1.p2, s2.p1, s2.p2);
                if (intersection) {
                    // Ignore if intersection is one of the endpoints (existing connection)
                    const isEnd1 = calculateDistance(intersection, s1.p1) < 0.1 || calculateDistance(intersection, s1.p2) < 0.1;
                    const isEnd2 = calculateDistance(intersection, s2.p1) < 0.1 || calculateDistance(intersection, s2.p2) < 0.1;

                    if (!isEnd1) {
                        if (!splits.has(i)) splits.set(i, []);
                        splits.get(i)!.push(intersection);
                        hasSplits = true;
                    }
                    if (!isEnd2) {
                        if (!splits.has(j)) splits.set(j, []);
                        splits.get(j)!.push(intersection);
                        hasSplits = true;
                    }
                }
            }
        }

        if (!hasSplits) break;

        const nextSegments: { p1: Coordinates, p2: Coordinates }[] = [];
        for (let i = 0; i < currentSegments.length; i++) {
            const seg = currentSegments[i];
            const segSplits = splits.get(i);

            if (segSplits && segSplits.length > 0) {
                // Sort splits by distance from start point
                segSplits.sort((a, b) => calculateDistance(seg.p1, a) - calculateDistance(seg.p1, b));

                let prev = seg.p1;
                segSplits.forEach(splitPoint => {
                    // Avoid zero-length segments
                    if (calculateDistance(prev, splitPoint) > 0.1) {
                        nextSegments.push({ p1: prev, p2: splitPoint });
                        prev = splitPoint;
                    }
                });

                if (calculateDistance(prev, seg.p2) > 0.1) {
                    nextSegments.push({ p1: prev, p2: seg.p2 });
                }
            } else {
                nextSegments.push(seg);
            }
        }
        currentSegments = nextSegments;
    }

    // 3. Build Graph Structure
    const nodes = new Map<GraphNodeId, Coordinates>();
    const adj = new Map<GraphNodeId, Map<GraphNodeId, number>>();
    const finalSegments: GraphSegment[] = [];

    const addNode = (c: Coordinates) => {
        const key = coordKey(c);
        if (!nodes.has(key)) nodes.set(key, c);
        if (!adj.has(key)) adj.set(key, new Map());
        return key;
    };

    currentSegments.forEach((s, idx) => {
        const uId = addNode(s.p1);
        const vId = addNode(s.p2);
        const dist = calculateDistance(s.p1, s.p2);

        // Avoid zero-length edges
        if (dist < 0.05) return;

        adj.get(uId)!.set(vId, dist);
        adj.get(vId)!.set(uId, dist);

        finalSegments.push({
            id: `seg-${idx}`,
            u: s.p1,
            v: s.p2,
            length: dist,
            uId,
            vId
        });
    });

    // 4. Welding: Merge very close nodes to fix KML drawing errors
    const WELD_DIST = 5.0;
    const nodeKeys = Array.from(nodes.keys());

    for (let i = 0; i < nodeKeys.length; i++) {
        for (let j = i + 1; j < nodeKeys.length; j++) {
            const k1 = nodeKeys[i];
            const k2 = nodeKeys[j];
            const p1 = nodes.get(k1)!;
            const p2 = nodes.get(k2)!;

            if (Math.abs(p1.lat - p2.lat) > 0.0001 || Math.abs(p1.lng - p2.lng) > 0.0002) continue;

            const d = calculateDistance(p1, p2);
            if (d < WELD_DIST && !adj.get(k1)?.has(k2)) {
                adj.get(k1)!.set(k2, d);
                adj.get(k2)!.set(k1, d);
            }
        }
    }

    return { nodes, adj, segments: finalSegments };
}

// --- ROUTING ALGORITHMS ---

/** Dijkstra's algorithm to find shortest path between two Node IDs */
function findPathDijkstra(
    startNode: GraphNodeId,
    endNode: GraphNodeId,
    adj: Map<GraphNodeId, Map<GraphNodeId, number>>
): string[] | null {
    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const pq: string[] = [];

    dist.set(startNode, 0);
    pq.push(startNode);

    while (pq.length > 0) {
        pq.sort((a, b) => (dist.get(a) ?? Infinity) - (dist.get(b) ?? Infinity));
        const u = pq.shift()!;

        if (u === endNode) {
            const path: string[] = [];
            let curr: string | null = endNode;
            while (curr) {
                path.unshift(curr);
                curr = prev.get(curr) || null;
            }
            return path;
        }

        const uDist = dist.get(u);
        if (uDist === undefined || uDist === Infinity) break;

        const neighbors = adj.get(u);
        if (neighbors) {
            for (const [v, weight] of neighbors.entries()) {
                const alt = uDist + weight;
                if (alt < (dist.get(v) ?? Infinity)) {
                    dist.set(v, alt);
                    prev.set(v, u);
                    if (!pq.includes(v)) pq.push(v);
                }
            }
        }
    }

    return null;
}

// --- MAIN EXPORTED FUNCTIONS ---

export async function calculateWalkingRoute(
    start: Coordinates,
    end: Coordinates,
    localPaths: LineData[],
    signal: AbortSignal
): Promise<RouteSegment[]> {

    const walkingPaths = localPaths.filter(p => p.categoryKey === 'Facilities' || p.categoryKey === 'Paths');
    if (walkingPaths.length === 0) return [];

    // 1. Build the graph with intersections
    const graph = buildWalkingGraph(walkingPaths);

    // 2. Find Closest Point on Network for Start & End
    const findProjection = (p: Coordinates): { point: Coordinates, segment: GraphSegment, dist: number } | null => {
        let best: { point: Coordinates, segment: GraphSegment, dist: number } | null = null;
        let minDist = Infinity;

        for (const seg of graph.segments) {
            const proj = findClosestPointOnLineSegment(p, seg.u, seg.v);
            const d = calculateDistance(p, proj);
            if (d < minDist) {
                minDist = d;
                best = { point: proj, segment: seg, dist: d };
            }
        }
        return best;
    };

    const startProj = findProjection(start);
    const endProj = findProjection(end);

    if (!startProj || !endProj) return [];

    // 3. Special Case: Start and End project to the exact same segment
    // Logic: Walk Start -> ProjStart -> ProjEnd -> End (Straight lines along segment)
    if (startProj.segment.id === endProj.segment.id) {
        return [{
            type: 'path',
            geometry: [start, startProj.point, endProj.point, end],
            distance: startProj.dist + calculateDistance(startProj.point, endProj.point) + endProj.dist,
            duration: (startProj.dist + calculateDistance(startProj.point, endProj.point) + endProj.dist) / 1.4
        }];
    }

    // 4. Inject Temporary Nodes into Graph for precise routing
    const sNodeId = 'TEMP_START';
    const eNodeId = 'TEMP_END';

    // We mutate the adj map temporarily. 
    // A cleaner way would be to clone, but since this graph is rebuilt/scoped per request or effectively static, 
    // and we are running in a single-threaded JS environment where we await nothing *during* the Dijkstra calc, this is safe-ish.
    // However, to be purely safe, let's just add them and assume we don't need to clean up because the graph is rebuilt next time or this graph object is local.
    // `buildWalkingGraph` creates a fresh object every time `calculateWalkingRoute` is called.

    const injectNodeOnSegment = (tempId: string, proj: { point: Coordinates, segment: GraphSegment }) => {
        graph.nodes.set(tempId, proj.point);
        if (!graph.adj.has(tempId)) graph.adj.set(tempId, new Map());

        const uId = proj.segment.uId;
        const vId = proj.segment.vId;

        // Distances from projection to segment endpoints
        const d1 = calculateDistance(proj.point, proj.segment.u);
        const d2 = calculateDistance(proj.point, proj.segment.v);

        // Connect Temp Node to endpoints
        graph.adj.get(tempId)!.set(uId, d1);
        graph.adj.get(tempId)!.set(vId, d2);

        // Connect endpoints to Temp Node (bi-directional)
        graph.adj.get(uId)?.set(tempId, d1);
        graph.adj.get(vId)?.set(tempId, d2);
    };

    injectNodeOnSegment(sNodeId, startProj);
    injectNodeOnSegment(eNodeId, endProj);

    // 5. Run Dijkstra
    const pathIds = findPathDijkstra(sNodeId, eNodeId, graph.adj);

    if (!pathIds) {
        // Fallback: Straight line if graph disconnected (only for short distances)
        const d = calculateDistance(start, end);
        if (d > 1000) return [];

        return [{
            type: 'path',
            geometry: [start, end],
            distance: d,
            duration: d / 1.4
        }];
    }

    // 6. Construct Geometry
    const geometry: Coordinates[] = [start];
    pathIds.forEach(id => {
        const node = graph.nodes.get(id);
        if (node) geometry.push(node);
    });
    geometry.push(end);

    // Filter duplicates
    const cleanGeometry = geometry.filter((p, i) => {
        if (i === 0) return true;
        return calculateDistance(p, geometry[i - 1]) > 0.1;
    });

    // Calculate total metrics
    let totalDist = 0;
    for (let i = 0; i < cleanGeometry.length - 1; i++) {
        totalDist += calculateDistance(cleanGeometry[i], cleanGeometry[i + 1]);
    }

    return [{
        type: 'path',
        geometry: cleanGeometry,
        distance: totalDist,
        duration: totalDist / 1.4
    }];
}


/** Fetches a route from the OSRM API with support for multiple waypoints. */
async function fetchOSRMRoute(points: Coordinates[], mode: 'driving' | 'foot', signal: AbortSignal): Promise<{ geometry: Coordinates[], distance: number, duration: number, isRoute: boolean }> {
    const pointsStr = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${mode}/${pointsStr}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error('OSRM error');

        const data: OSRMRouteResponse = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No route found');
        }

        const route = data.routes[0];
        return {
            geometry: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng })),
            distance: route.distance,
            duration: route.duration,
            isRoute: true
        };
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            console.warn("OSRM fetch failed, falling back to straight line", error);
        }
        const start = points[0];
        const end = points[points.length - 1];
        const dist = calculateDistance(start, end);
        return {
            geometry: [start, end],
            distance: dist,
            duration: mode === 'driving' ? dist / 5.5 : dist / 1.4,
            isRoute: false
        };
    }
}

/** Fallback function to calculate a direct route without parking spots. */
async function calculateDirectRoute(start: Coordinates, end: Coordinates, localPaths: LineData[], signal: AbortSignal): Promise<{ segments: RouteSegment[], mode: 'walk' | 'car' }> {
    const walkingSegments = await calculateWalkingRoute(start, end, localPaths, signal);

    if (walkingSegments.length > 0) {
        return { segments: walkingSegments, mode: 'walk' };
    } else {
        const roadRouteResult = await fetchOSRMRoute([start, end], 'driving', signal);
        return {
            segments: [{
                type: 'road',
                geometry: roadRouteResult.geometry,
                distance: roadRouteResult.distance,
                duration: roadRouteResult.duration,
            }],
            mode: 'car'
        };
    }
}

/** Helper function to check if a point is within the map bounds with a buffer. */
function isInsideBounds(point: Coordinates, bounds: Bounds): boolean {
    if (!bounds) return true;
    const buffer = 0.002; // Reduced buffer for more precise village detection (approx 200m)
    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    return (
        point.lat >= minLat - buffer &&
        point.lat <= maxLat + buffer &&
        point.lng >= minLng - buffer &&
        point.lng <= maxLng + buffer
    );
}

/** Calculates a multi-modal route. */
export async function getRoute(start: Coordinates, end: Coordinates, allPlaces: Place[], localPaths: LineData[], bounds: Bounds | null, signal: AbortSignal): Promise<{ segments: RouteSegment[], mode: 'walk' | 'car', bestParking: Place | null }> {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    // 1. If destination is outside the main area, calculate a simple driving route.
    if (bounds && !isInsideBounds(end, bounds)) {
        const remoteRoute = await fetchOSRMRoute([start, end], 'driving', signal);
        return {
            segments: [{
                type: 'road',
                geometry: remoteRoute.geometry,
                distance: remoteRoute.distance,
                duration: remoteRoute.duration
            }],
            mode: 'car',
            bestParking: null,
        };
    }

    const parkingSpots = allPlaces.filter(p => {
        if (p.categoryKey !== 'Transportation') return false;
        
        const nameMatch = (name: any) => {
            if (typeof name === 'string') return name.toLowerCase().includes('parking') || name.toLowerCase().includes('pysäköinti');
            if (typeof name === 'object') return Object.values(name).some((v: any) => v.toLowerCase().includes('parking') || v.toLowerCase().includes('pysäköinti'));
            return false;
        };

        return (
            (p.id && p.id.toLowerCase().includes('parking')) || 
            (p.originalId && p.originalId.toLowerCase().includes('parking')) ||
            nameMatch(p.name)
        );
    });

    const isStartInside = bounds ? isInsideBounds(start, bounds) : true;

    // 2. If start is INSIDE, prefer direct walking
    if (isStartInside) {
        const directRoute = await calculateDirectRoute(start, end, localPaths, signal);
        return { ...directRoute, bestParking: null };
    }

    // 3. If start is OUTSIDE, force driving to nearest parking -> walking
    if (parkingSpots.length > 0) {
        // Highway Gateways: Force OSRM to exit the highway at the correct spot 
        // to prevent it from finding 'shortcuts' through the village core.
        // Highway Gateways: Refined coordinates to be exactly on the exit ramps.
        // This prevents OSRM from snapping to parallel side-roads like Pajakyläntie.
        const southGateway = { lat: 66.5388, lng: 25.8310 }; // Myllymäentie approach ramp
        const northGateway = { lat: 66.5515, lng: 25.8480 }; // Pukinpolku approach ramp

        // Determine which side of the village the user is arriving at
        const distToSouthGateway = calculateDistance(start, southGateway);
        const distToNorthGateway = calculateDistance(start, northGateway);
        const isApproachingFromSouth = distToSouthGateway < distToNorthGateway;

        // Filter parking spots based on their explicit North/South tagging
        const zoneParkingSpots = parkingSpots.filter(p => {
            const isSouthTagged = p.subCategory === 'parking-south';
            const isNorthTagged = p.subCategory === 'parking-north';
            
            if (isApproachingFromSouth) {
                // If coming from South, prefer south parkings, but allow north if they are the only option
                return isSouthTagged;
            } else {
                return isNorthTagged;
            }
        });

        // Use filtered spots if available, else fallback to all
        const candidateParking = zoneParkingSpots.length > 0 ? zoneParkingSpots : parkingSpots;

        let nearestParking: Place | null = null;
        let minDistance = Infinity;

        for (const parking of candidateParking) {
            const distance = calculateDistance(parking.location, end);
            if (distance < minDistance) {
                minDistance = distance;
                nearestParking = parking;
            }
        }

        // Handle remote destinations outside the village
        if (nearestParking && minDistance > 1500) {
            const directDrive = await fetchOSRMRoute([start, end], 'driving', signal);
            return {
                segments: [{
                    type: 'road',
                    geometry: directDrive.geometry,
                    distance: directDrive.distance,
                    duration: directDrive.duration
                }],
                mode: 'car',
                bestParking: null
            };
        }

        if (nearestParking) {
            const segments: RouteSegment[] = [];
            
            // Determine the correct gateway for THIS specific parking spot
            const isSouthParking = nearestParking.subCategory === 'parking-south';
            const gateway = isSouthParking ? southGateway : northGateway;

            // FORCE the driving route to pass through the Highway Gateway
            // This prevents OSRM from routing through the village center.
            const drivingRoute = await fetchOSRMRoute([start, gateway, nearestParking.location], 'driving', signal);
            
            segments.push({
                type: 'road',
                geometry: drivingRoute.geometry,
                distance: drivingRoute.distance,
                duration: drivingRoute.duration,
            });

            const walkingStart = nearestParking.location;
            const walkingSegments = await calculateWalkingRoute(walkingStart, end, localPaths, signal);

            if (walkingSegments.length > 0) {
                segments.push(...walkingSegments);
            } else {
                const dist = calculateDistance(walkingStart, end);
                segments.push({
                    type: 'path',
                    geometry: [walkingStart, end],
                    distance: dist,
                    duration: dist / 1.4
                });
            }

            return { segments, mode: 'car', bestParking: nearestParking };
        }
    }

    const directRoute = await calculateDirectRoute(start, end, localPaths, signal);
    return { ...directRoute, bestParking: null };
}