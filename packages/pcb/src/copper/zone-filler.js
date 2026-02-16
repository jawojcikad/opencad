export class ZoneFiller {
    /**
     * Fill a copper zone, subtracting clearances around other nets' obstacles.
     * Returns an array of filled polygons (each polygon is an array of vertices).
     */
    fillZone(zone, document) {
        if (!zone.polygon || zone.polygon.length < 3) {
            return [];
        }
        const settings = zone.fillSettings ?? {
            clearance: 0.3,
            minWidth: 0.2,
            thermalReliefGap: 0.5,
            thermalReliefWidth: 0.25,
            fillType: 'solid',
            priority: 0,
        };
        // Start with the zone outline, shrunk by minWidth/2
        let fillPolygons = [
            this.offsetPolygon(zone.polygon, -settings.minWidth / 2),
        ];
        if (fillPolygons[0].length < 3) {
            return [];
        }
        // Collect all obstacles from other nets on the same layer
        const obstacles = this.collectObstacles(zone, document, settings);
        // Subtract all obstacles from the fill polygon
        fillPolygons = this.subtractObstacles(fillPolygons[0], obstacles, settings.clearance);
        // If hatched fill, create hatch pattern
        if (settings.fillType === 'hatched' && settings.hatchWidth && settings.hatchGap) {
            fillPolygons = this.createHatchFill(fillPolygons, settings.hatchWidth, settings.hatchGap);
        }
        return fillPolygons;
    }
    /**
     * Simple polygon offset (shrink when offset < 0, expand when offset > 0).
     * Uses the normal-based offset method for each edge.
     */
    offsetPolygon(polygon, offset) {
        const n = polygon.length;
        if (n < 3)
            return [];
        // Compute normals for each edge
        const normals = [];
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const dx = polygon[j].x - polygon[i].x;
            const dy = polygon[j].y - polygon[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1e-10) {
                normals.push({ x: 0, y: 0 });
            }
            else {
                // Inward normal (for CCW polygon, right-hand normal points inward)
                normals.push({ x: -dy / len, y: dx / len });
            }
        }
        // Check polygon winding; if CW, flip normals
        const area = polygonArea(polygon);
        const sign = area < 0 ? -1 : 1;
        // Offset each edge and find intersections
        const offsetEdges = [];
        for (let i = 0; i < n; i++) {
            const nx = normals[i].x * sign * offset;
            const ny = normals[i].y * sign * offset;
            const p = {
                x: polygon[i].x + nx,
                y: polygon[i].y + ny,
            };
            const j = (i + 1) % n;
            const d = {
                x: polygon[j].x - polygon[i].x,
                y: polygon[j].y - polygon[i].y,
            };
            offsetEdges.push({ p, d });
        }
        // Find intersection of consecutive offset edges
        const result = [];
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const intersection = lineLineIntersection(offsetEdges[i].p, {
                x: offsetEdges[i].p.x + offsetEdges[i].d.x,
                y: offsetEdges[i].p.y + offsetEdges[i].d.y,
            }, offsetEdges[j].p, {
                x: offsetEdges[j].p.x + offsetEdges[j].d.x,
                y: offsetEdges[j].p.y + offsetEdges[j].d.y,
            });
            if (intersection) {
                result.push(intersection);
            }
        }
        // Check if result polygon is valid (not self-intersecting or degenerate)
        if (result.length < 3)
            return [];
        const resultArea = Math.abs(polygonArea(result));
        if (resultArea < 1e-6)
            return [];
        return result;
    }
    /**
     * Subtract rectangular obstacles from the zone polygon.
     * Uses polygon clipping — for each obstacle, cuts it out of all current polygons.
     */
    subtractObstacles(zone, obstacles, clearance) {
        let currentPolygons = [zone];
        for (const obs of obstacles) {
            // Expand obstacle by clearance
            const expanded = {
                minX: obs.minX - clearance,
                minY: obs.minY - clearance,
                maxX: obs.maxX + clearance,
                maxY: obs.maxY + clearance,
            };
            const obstacleRect = [
                { x: expanded.minX, y: expanded.minY },
                { x: expanded.maxX, y: expanded.minY },
                { x: expanded.maxX, y: expanded.maxY },
                { x: expanded.minX, y: expanded.maxY },
            ];
            const nextPolygons = [];
            for (const poly of currentPolygons) {
                const clipped = this.subtractRectFromPolygon(poly, obstacleRect);
                nextPolygons.push(...clipped);
            }
            currentPolygons = nextPolygons;
        }
        return currentPolygons;
    }
    /**
     * Subtract a convex rectangle from a polygon using Sutherland-Hodgman algorithm variant.
     * Returns the polygon(s) remaining after subtraction.
     */
    subtractRectFromPolygon(polygon, rect) {
        // Check if the polygon and rectangle overlap at all
        const polyBBox = computeBBox(polygon);
        const rectBBox = computeBBox(rect);
        if (polyBBox.maxX < rectBBox.minX ||
            polyBBox.minX > rectBBox.maxX ||
            polyBBox.maxY < rectBBox.minY ||
            polyBBox.minY > rectBBox.maxY) {
            // No overlap — return original polygon
            return [polygon];
        }
        // Check if rectangle fully contains the polygon
        let allInside = true;
        for (const p of polygon) {
            if (!pointInRect(p, rectBBox)) {
                allInside = false;
                break;
            }
        }
        if (allInside) {
            // Polygon fully consumed
            return [];
        }
        // Use a simplified clipping approach:
        // Clip the polygon by each edge of the rectangle (keeping the OUTSIDE part)
        // We do this by clipping polygon by the inverse of the rectangle
        // For each edge of the rect, we split into the half that's outside
        // Build the result by clipping against each edge of the rectangle
        // For subtraction, we keep vertices OUTSIDE the rectangle
        const clippedInside = sutherlandHodgmanClip(polygon, rect);
        if (clippedInside.length < 3) {
            // Nothing was inside — return original polygon unchanged
            return [polygon];
        }
        // Compute the remaining polygon by cutting the inside polygon out
        // Use a simplified approach: find intersection points and rebuild
        const remaining = this.computePolygonDifference(polygon, rect);
        return remaining.filter((p) => p.length >= 3);
    }
    /**
     * Compute polygon difference: polygon - rect.
     * A simplified version that handles rectangular cutouts from convex/simple polygons.
     */
    computePolygonDifference(polygon, rect) {
        // Collect all intersection points between polygon edges and rect edges
        const n = polygon.length;
        const m = rect.length;
        const intersections = [];
        for (let i = 0; i < n; i++) {
            const a = polygon[i];
            const b = polygon[(i + 1) % n];
            for (let j = 0; j < m; j++) {
                const c = rect[j];
                const d = rect[(j + 1) % m];
                const result = segmentIntersection(a, b, c, d);
                if (result) {
                    intersections.push({
                        polyEdge: i,
                        rectEdge: j,
                        point: result.point,
                        polyT: result.t,
                    });
                }
            }
        }
        // If no intersections, the rect is fully inside or fully outside
        if (intersections.length < 2) {
            // Check if rectangle center is inside polygon
            const rectCenter = {
                x: (rect[0].x + rect[2].x) / 2,
                y: (rect[0].y + rect[2].y) / 2,
            };
            if (pointInPolygon(rectCenter, polygon)) {
                // Rectangle is fully inside — create a polygon with a hole
                // For simplicity, connect the hole with a thin bridge
                return [this.createPolygonWithHole(polygon, rect)];
            }
            return [polygon];
        }
        // Sort intersections along polygon edges
        intersections.sort((a, b) => a.polyEdge !== b.polyEdge ? a.polyEdge - b.polyEdge : a.polyT - b.polyT);
        // Build the outer polygon by walking along the polygon, but when we enter
        // the rectangle, walk along the rectangle boundary instead
        const result = [];
        const rectBBox = computeBBox(rect);
        for (let i = 0; i < n; i++) {
            const vertex = polygon[i];
            const isOutside = !pointInRect(vertex, rectBBox);
            if (isOutside) {
                result.push({ ...vertex });
            }
            // Add any intersection points on this edge
            const edgeIntersections = intersections.filter((x) => x.polyEdge === i);
            for (const ix of edgeIntersections) {
                result.push({ ...ix.point });
                // If entering the rectangle, walk along rect boundary to next exit
                const nextVertex = polygon[(i + 1) % n];
                const nextIsInside = pointInRect(nextVertex, rectBBox);
                if (!nextIsInside) {
                    // We go in and come out on the same edge — add the rect boundary points
                }
                else {
                    // Find the exit intersection and add rect boundary points
                    const exitIdx = intersections.indexOf(ix);
                    const nextIx = exitIdx + 1 < intersections.length
                        ? intersections[exitIdx + 1]
                        : intersections[0];
                    // Walk along rect boundary from entry to exit
                    const boundaryPoints = this.walkRectBoundary(rect, ix.point, nextIx.point, ix.rectEdge, nextIx.rectEdge);
                    result.push(...boundaryPoints);
                }
            }
        }
        if (result.length < 3)
            return [polygon];
        return [result];
    }
    /**
     * Walk along the rectangle boundary from start to end.
     */
    walkRectBoundary(rect, start, end, startEdge, endEdge) {
        const m = rect.length;
        const points = [];
        let edge = startEdge;
        const maxSteps = m + 1;
        let steps = 0;
        while (edge !== endEdge && steps < maxSteps) {
            edge = (edge + 1) % m;
            points.push({ ...rect[edge] });
            steps++;
        }
        return points;
    }
    /**
     * Create a polygon with a rectangular hole using a bridge connection.
     */
    createPolygonWithHole(outer, hole) {
        // Find the closest points between outer polygon and hole
        let minDist = Infinity;
        let outerIdx = 0;
        let holeIdx = 0;
        for (let i = 0; i < outer.length; i++) {
            for (let j = 0; j < hole.length; j++) {
                const dx = outer[i].x - hole[j].x;
                const dy = outer[i].y - hole[j].y;
                const dist = dx * dx + dy * dy;
                if (dist < minDist) {
                    minDist = dist;
                    outerIdx = i;
                    holeIdx = j;
                }
            }
        }
        // Build polygon: outer[0..outerIdx] -> hole[holeIdx..holeIdx] (reversed) -> outer[outerIdx..end]
        const result = [];
        // Walk outer polygon from 0 to outerIdx (inclusive)
        for (let i = 0; i <= outerIdx; i++) {
            result.push({ ...outer[i] });
        }
        // Walk hole in reverse from holeIdx
        for (let i = 0; i < hole.length; i++) {
            result.push({ ...hole[(holeIdx - i + hole.length) % hole.length] });
        }
        // Bridge back
        result.push({ ...hole[holeIdx] });
        result.push({ ...outer[outerIdx] });
        // Continue outer polygon
        for (let i = outerIdx + 1; i < outer.length; i++) {
            result.push({ ...outer[i] });
        }
        return result;
    }
    /**
     * Create a hatch-pattern fill from the filled polygons.
     */
    createHatchFill(polygons, hatchWidth, hatchGap) {
        const result = [];
        const spacing = hatchWidth + hatchGap;
        for (const polygon of polygons) {
            const bbox = computeBBox(polygon);
            // Create horizontal hatch lines
            for (let y = bbox.minY; y <= bbox.maxY; y += spacing) {
                const intersections = polygonScanlineIntersections(polygon, y);
                intersections.sort((a, b) => a - b);
                for (let i = 0; i < intersections.length - 1; i += 2) {
                    const x1 = intersections[i];
                    const x2 = intersections[i + 1];
                    result.push([
                        { x: x1, y: y - hatchWidth / 2 },
                        { x: x2, y: y - hatchWidth / 2 },
                        { x: x2, y: y + hatchWidth / 2 },
                        { x: x1, y: y + hatchWidth / 2 },
                    ]);
                }
            }
        }
        return result;
    }
    /**
     * Collect all obstacles (bounding boxes) from the PCB document that clash with the zone.
     */
    collectObstacles(zone, document, settings) {
        const obstacles = [];
        const layer = zone.layer;
        const netId = zone.netId;
        // Tracks on the same layer with different net
        for (const track of document.tracks) {
            if (track.layer !== layer)
                continue;
            if (track.netId === netId)
                continue;
            const halfW = track.width / 2;
            obstacles.push({
                minX: Math.min(track.start.x, track.end.x) - halfW,
                minY: Math.min(track.start.y, track.end.y) - halfW,
                maxX: Math.max(track.start.x, track.end.x) + halfW,
                maxY: Math.max(track.start.y, track.end.y) + halfW,
            });
        }
        // Pads on the same layer with different net
        for (const footprint of document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                if (pad.netId === netId)
                    continue;
                // Check if pad is on this layer (THT pads are on all layers, SMD on their own layer)
                const padOnLayer = pad.type === 'through_hole' || pad.layer === layer;
                if (!padOnLayer)
                    continue;
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const hw = (pad.width ?? 1) / 2;
                const hh = (pad.height ?? 1) / 2;
                obstacles.push({
                    minX: worldPos.x - hw,
                    minY: worldPos.y - hh,
                    maxX: worldPos.x + hw,
                    maxY: worldPos.y + hh,
                });
            }
        }
        // Vias with different net
        for (const via of document.vias) {
            if (via.netId === netId)
                continue;
            const r = via.diameter / 2;
            obstacles.push({
                minX: via.position.x - r,
                minY: via.position.y - r,
                maxX: via.position.x + r,
                maxY: via.position.y + r,
            });
        }
        // Other copper zones with higher priority and different net
        for (const otherZone of document.copperZones) {
            if (otherZone.id === zone.id)
                continue;
            if (otherZone.layer !== layer)
                continue;
            if (otherZone.netId === netId)
                continue;
            const otherSettings = otherZone.fillSettings ?? {
                clearance: 0.3,
                minWidth: 0.2,
                thermalReliefGap: 0.5,
                thermalReliefWidth: 0.25,
                fillType: 'solid',
                priority: 0,
            };
            if (otherSettings.priority > settings.priority) {
                obstacles.push(computeBBox(otherZone.polygon));
            }
        }
        return obstacles;
    }
}
// ─── Geometry Helpers ────────────────────────────────────────────
function polygonArea(polygon) {
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += polygon[i].x * polygon[j].y;
        area -= polygon[j].x * polygon[i].y;
    }
    return area / 2;
}
function computeBBox(polygon) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of polygon) {
        if (p.x < minX)
            minX = p.x;
        if (p.y < minY)
            minY = p.y;
        if (p.x > maxX)
            maxX = p.x;
        if (p.y > maxY)
            maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
}
function pointInRect(p, rect) {
    return p.x >= rect.minX && p.x <= rect.maxX && p.y >= rect.minY && p.y <= rect.maxY;
}
function pointInPolygon(p, polygon) {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}
/**
 * Sutherland-Hodgman polygon clipping.
 * Clips the subject polygon to the inside of the clip polygon.
 */
function sutherlandHodgmanClip(subject, clip) {
    let output = [...subject];
    const clipLen = clip.length;
    for (let i = 0; i < clipLen; i++) {
        if (output.length === 0)
            return [];
        const input = [...output];
        output = [];
        const edgeStart = clip[i];
        const edgeEnd = clip[(i + 1) % clipLen];
        for (let j = 0; j < input.length; j++) {
            const current = input[j];
            const previous = input[(j + input.length - 1) % input.length];
            const currInside = isInsideEdge(current, edgeStart, edgeEnd);
            const prevInside = isInsideEdge(previous, edgeStart, edgeEnd);
            if (currInside) {
                if (!prevInside) {
                    const ix = lineLineIntersection(previous, current, edgeStart, edgeEnd);
                    if (ix)
                        output.push(ix);
                }
                output.push(current);
            }
            else if (prevInside) {
                const ix = lineLineIntersection(previous, current, edgeStart, edgeEnd);
                if (ix)
                    output.push(ix);
            }
        }
    }
    return output;
}
function isInsideEdge(p, edgeStart, edgeEnd) {
    return ((edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) -
        (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x) >=
        0);
}
function lineLineIntersection(a1, a2, b1, b2) {
    const dx1 = a2.x - a1.x;
    const dy1 = a2.y - a1.y;
    const dx2 = b2.x - b1.x;
    const dy2 = b2.y - b1.y;
    const denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 1e-10)
        return null;
    const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
    return {
        x: a1.x + t * dx1,
        y: a1.y + t * dy1,
    };
}
function segmentIntersection(a1, a2, b1, b2) {
    const dx1 = a2.x - a1.x;
    const dy1 = a2.y - a1.y;
    const dx2 = b2.x - b1.x;
    const dy2 = b2.y - b1.y;
    const denom = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(denom) < 1e-10)
        return null;
    const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
    const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / denom;
    if (t < 0 || t > 1 || u < 0 || u > 1)
        return null;
    return {
        point: {
            x: a1.x + t * dx1,
            y: a1.y + t * dy1,
        },
        t,
    };
}
function polygonScanlineIntersections(polygon, y) {
    const intersections = [];
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const yi = polygon[i].y;
        const yj = polygon[j].y;
        if ((yi <= y && yj > y) || (yj <= y && yi > y)) {
            const t = (y - yi) / (yj - yi);
            const x = polygon[i].x + t * (polygon[j].x - polygon[i].x);
            intersections.push(x);
        }
    }
    return intersections;
}
//# sourceMappingURL=zone-filler.js.map