export class InteractiveRouter {
    designRules;
    document;
    isRouting = false;
    routeStartPoint = { x: 0, y: 0 };
    currentLayer = 'F.Cu';
    currentNetId = '';
    currentWidth = 0.25; // mm default
    routeSegments = [];
    committedPoints = [];
    routingMode = '45deg';
    constructor(document, rules) {
        this.designRules = rules;
        this.document = document;
    }
    /**
     * Start routing from a pad or existing track endpoint.
     */
    startRoute(startPoint, layer, netId, width) {
        this.isRouting = true;
        this.routeStartPoint = { ...startPoint };
        this.currentLayer = layer;
        this.currentNetId = netId;
        this.currentWidth = Math.max(width, this.designRules.minTrackWidth ?? 0.1);
        this.routeSegments = [];
        this.committedPoints = [{ ...startPoint }];
    }
    /**
     * Update the route preview as the mouse moves.
     * Returns the preview segments from the last committed point to the current mouse position.
     */
    updateRoute(currentPoint) {
        if (!this.isRouting || this.committedPoints.length === 0) {
            return [];
        }
        const lastPoint = this.committedPoints[this.committedPoints.length - 1];
        const pathPoints = this.calculateRoutePath(lastPoint, currentPoint, this.routingMode);
        const previewSegments = [];
        for (let i = 0; i < pathPoints.length - 1; i++) {
            previewSegments.push({
                start: pathPoints[i],
                end: pathPoints[i + 1],
                width: this.currentWidth,
                layer: this.currentLayer,
            });
        }
        // Combine already committed segments with preview
        return [...this.routeSegments, ...previewSegments];
    }
    /**
     * Commit the current point and add to the route being built.
     * Call this when the user clicks to add a bend point.
     */
    addRoutePoint(point) {
        if (!this.isRouting)
            return;
        const lastPoint = this.committedPoints[this.committedPoints.length - 1];
        const pathPoints = this.calculateRoutePath(lastPoint, point, this.routingMode);
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const segment = {
                start: pathPoints[i],
                end: pathPoints[i + 1],
                width: this.currentWidth,
                layer: this.currentLayer,
            };
            if (this.validateSegment(segment.start, segment.end, segment.width, segment.layer)) {
                this.routeSegments.push(segment);
            }
        }
        this.committedPoints.push({ ...point });
    }
    /**
     * Finalize the current route segments and return Track objects.
     */
    commitRoute() {
        if (!this.isRouting)
            return [];
        const tracks = this.routeSegments.map((seg, i) => ({
            id: `track_${Date.now()}_${i}`,
            start: { ...seg.start },
            end: { ...seg.end },
            width: seg.width,
            layer: seg.layer,
            netId: this.currentNetId,
        }));
        this.cancelRoute();
        return tracks;
    }
    /**
     * Cancel current routing operation.
     */
    cancelRoute() {
        this.isRouting = false;
        this.routeSegments = [];
        this.committedPoints = [];
        this.currentNetId = '';
    }
    /**
     * Switch to another layer (e.g., when placing a via mid-route).
     */
    switchLayer(newLayer) {
        this.currentLayer = newLayer;
    }
    /**
     * Toggle between 45-degree and 90-degree routing modes.
     */
    setRoutingMode(mode) {
        this.routingMode = mode;
    }
    getIsRouting() {
        return this.isRouting;
    }
    getCurrentNetId() {
        return this.currentNetId;
    }
    getCurrentLayer() {
        return this.currentLayer;
    }
    getLastPoint() {
        if (this.committedPoints.length === 0)
            return null;
        return this.committedPoints[this.committedPoints.length - 1];
    }
    /**
     * Check if a route segment is valid (no DRC violations).
     * Checks clearance against all other tracks, pads, and vias on the same layer.
     */
    validateSegment(start, end, width, layer) {
        const minClearance = this.designRules.clearance ?? 0.2;
        const halfWidth = width / 2;
        // Check against existing tracks on the same layer
        for (const track of this.document.tracks) {
            if (track.layer !== layer)
                continue;
            if (track.netId === this.currentNetId)
                continue; // Same net, no clearance needed
            const dist = segmentToSegmentDistance(start, end, track.start, track.end);
            const requiredDist = halfWidth + (track.width / 2) + minClearance;
            if (dist < requiredDist) {
                return false;
            }
        }
        // Check against pads
        for (const footprint of this.document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                if (pad.netId === this.currentNetId)
                    continue;
                const padWorld = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const dist = pointToSegmentDistance(padWorld, start, end);
                const padRadius = Math.max(pad.width ?? 1, pad.height ?? 1) / 2;
                const requiredDist = halfWidth + padRadius + minClearance;
                if (dist < requiredDist) {
                    return false;
                }
            }
        }
        // Check against vias
        for (const via of this.document.vias) {
            if (via.netId === this.currentNetId)
                continue;
            const dist = pointToSegmentDistance(via.position, start, end);
            const requiredDist = halfWidth + (via.diameter / 2) + minClearance;
            if (dist < requiredDist) {
                return false;
            }
        }
        return true;
    }
    /**
     * Calculate a 45-degree or 90-degree routed path between two points.
     * For 45-degree mode: first route at 45 degrees, then horizontally/vertically (or vice versa).
     * For 90-degree mode: first horizontal, then vertical (or vice versa).
     */
    calculateRoutePath(start, end, mode) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            return [start];
        }
        if (mode === '90deg') {
            // Route in an L-shape: horizontal then vertical, or whichever is shorter
            if (Math.abs(dx) < 0.001) {
                return [{ ...start }, { ...end }];
            }
            if (Math.abs(dy) < 0.001) {
                return [{ ...start }, { ...end }];
            }
            // Choose direction based on which axis has less travel
            const midPoint = Math.abs(dx) > Math.abs(dy)
                ? { x: end.x, y: start.y }
                : { x: start.x, y: end.y };
            return [{ ...start }, midPoint, { ...end }];
        }
        // 45-degree mode
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        // If already on a 45-degree angle, route directly
        if (Math.abs(absDx - absDy) < 0.001) {
            return [{ ...start }, { ...end }];
        }
        // If horizontal or vertical, route directly
        if (absDx < 0.001 || absDy < 0.001) {
            return [{ ...start }, { ...end }];
        }
        // Route with a 45-degree segment then a horizontal/vertical segment
        const diagonal = Math.min(absDx, absDy);
        const signX = dx > 0 ? 1 : -1;
        const signY = dy > 0 ? 1 : -1;
        if (absDx > absDy) {
            // Diagonal first, then horizontal
            const mid = {
                x: start.x + diagonal * signX,
                y: start.y + diagonal * signY,
            };
            return [{ ...start }, mid, { ...end }];
        }
        else {
            // Diagonal first, then vertical
            const mid = {
                x: start.x + diagonal * signX,
                y: start.y + diagonal * signY,
            };
            return [{ ...start }, mid, { ...end }];
        }
    }
}
/**
 * Calculate the minimum distance between two line segments.
 */
function segmentToSegmentDistance(a1, a2, b1, b2) {
    // Check if segments intersect
    if (segmentsIntersect(a1, a2, b1, b2))
        return 0;
    // Minimum of all point-to-segment distances
    return Math.min(pointToSegmentDistance(a1, b1, b2), pointToSegmentDistance(a2, b1, b2), pointToSegmentDistance(b1, a1, a2), pointToSegmentDistance(b2, a1, a2));
}
/**
 * Calculate the minimum distance from a point to a line segment.
 */
function pointToSegmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq < 1e-10) {
        // Segment is a point
        const ddx = p.x - a.x;
        const ddy = p.y - a.y;
        return Math.sqrt(ddx * ddx + ddy * ddy);
    }
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const proj = {
        x: a.x + t * dx,
        y: a.y + t * dy,
    };
    const ddx = p.x - proj.x;
    const ddy = p.y - proj.y;
    return Math.sqrt(ddx * ddx + ddy * ddy);
}
/**
 * Check if two line segments intersect using cross product method.
 */
function segmentsIntersect(a1, a2, b1, b2) {
    const d1 = cross(b1, b2, a1);
    const d2 = cross(b1, b2, a2);
    const d3 = cross(a1, a2, b1);
    const d4 = cross(a1, a2, b2);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }
    if (Math.abs(d1) < 1e-10 && onSegment(b1, b2, a1))
        return true;
    if (Math.abs(d2) < 1e-10 && onSegment(b1, b2, a2))
        return true;
    if (Math.abs(d3) < 1e-10 && onSegment(a1, a2, b1))
        return true;
    if (Math.abs(d4) < 1e-10 && onSegment(a1, a2, b2))
        return true;
    return false;
}
function cross(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function onSegment(a, b, p) {
    return (Math.min(a.x, b.x) <= p.x + 1e-10 &&
        p.x <= Math.max(a.x, b.x) + 1e-10 &&
        Math.min(a.y, b.y) <= p.y + 1e-10 &&
        p.y <= Math.max(a.y, b.y) + 1e-10);
}
//# sourceMappingURL=interactive-router.js.map