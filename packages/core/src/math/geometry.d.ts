import { Vector2D } from './vector2d';
/**
 * Compute the intersection point of two infinite lines defined by
 * (p1→p2) and (p3→p4). Returns null if they are parallel / coincident.
 */
export declare function lineIntersection(p1: Vector2D, p2: Vector2D, p3: Vector2D, p4: Vector2D): Vector2D | null;
/**
 * Shortest distance from `point` to the infinite line through
 * `lineStart` → `lineEnd`.
 */
export declare function pointToLineDistance(point: Vector2D, lineStart: Vector2D, lineEnd: Vector2D): number;
/**
 * True when `point` lies on the segment `start`→`end` within `tolerance`.
 */
export declare function pointOnLineSegment(point: Vector2D, start: Vector2D, end: Vector2D, tolerance?: number): boolean;
/**
 * Ray-casting algorithm — returns true if `point` is inside `polygon`.
 * The polygon is specified as an array of vertices (no need to repeat
 * the first vertex at the end).
 */
export declare function polygonContainsPoint(polygon: Vector2D[], point: Vector2D): boolean;
/**
 * Signed area of a simple polygon (positive = CCW winding).
 * Uses the shoelace formula.
 */
export declare function polygonArea(polygon: Vector2D[]): number;
/**
 * True if `point` lies inside (or on) the circle defined by `center`
 * and `radius`.
 */
export declare function circleContainsPoint(center: Vector2D, radius: number, point: Vector2D): boolean;
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
export declare function arcPoints(center: Vector2D, radius: number, startAngle: number, endAngle: number, segments: number): Vector2D[];
//# sourceMappingURL=geometry.d.ts.map