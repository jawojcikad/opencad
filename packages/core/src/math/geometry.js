import { Vector2D } from './vector2d';
/**
 * Compute the intersection point of two infinite lines defined by
 * (p1→p2) and (p3→p4). Returns null if they are parallel / coincident.
 */
export function lineIntersection(p1, p2, p3, p4) {
    const d1 = p2.sub(p1);
    const d2 = p4.sub(p3);
    const denom = d1.cross(d2);
    if (Math.abs(denom) < 1e-12)
        return null;
    const d3 = p3.sub(p1);
    const t = d3.cross(d2) / denom;
    return new Vector2D(p1.x + t * d1.x, p1.y + t * d1.y);
}
/**
 * Shortest distance from `point` to the infinite line through
 * `lineStart` → `lineEnd`.
 */
export function pointToLineDistance(point, lineStart, lineEnd) {
    const d = lineEnd.sub(lineStart);
    const len = d.length();
    if (len === 0)
        return point.distanceTo(lineStart);
    return Math.abs(d.cross(point.sub(lineStart))) / len;
}
/**
 * True when `point` lies on the segment `start`→`end` within `tolerance`.
 */
export function pointOnLineSegment(point, start, end, tolerance = 1e-6) {
    const segLen = start.distanceTo(end);
    if (segLen < tolerance)
        return point.distanceTo(start) < tolerance;
    const dist = pointToLineDistance(point, start, end);
    if (dist > tolerance)
        return false;
    // Check that the projection falls within the segment.
    const d = end.sub(start);
    const t = point.sub(start).dot(d) / d.dot(d);
    return t >= -tolerance / segLen && t <= 1 + tolerance / segLen;
}
/**
 * Ray-casting algorithm — returns true if `point` is inside `polygon`.
 * The polygon is specified as an array of vertices (no need to repeat
 * the first vertex at the end).
 */
export function polygonContainsPoint(polygon, point) {
    const n = polygon.length;
    let inside = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        if (yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}
/**
 * Signed area of a simple polygon (positive = CCW winding).
 * Uses the shoelace formula.
 */
export function polygonArea(polygon) {
    const n = polygon.length;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += polygon[i].x * polygon[j].y;
        area -= polygon[j].x * polygon[i].y;
    }
    return area / 2;
}
/**
 * True if `point` lies inside (or on) the circle defined by `center`
 * and `radius`.
 */
export function circleContainsPoint(center, radius, point) {
    return center.distanceTo(point) <= radius;
}
/**
 * Generate points along a circular arc.
 *
 * @param center      Centre of the arc.
 * @param radius      Radius.
 * @param startAngle  Start angle in radians.
 * @param endAngle    End angle in radians (may be > startAngle for CCW).
 * @param segments    Number of line segments to approximate the arc.
 * @returns           An array of `segments + 1` points.
 */
export function arcPoints(center, radius, startAngle, endAngle, segments) {
    const points = [];
    const delta = (endAngle - startAngle) / segments;
    for (let i = 0; i <= segments; i++) {
        const angle = startAngle + delta * i;
        points.push(new Vector2D(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle)));
    }
    return points;
}
//# sourceMappingURL=geometry.js.map