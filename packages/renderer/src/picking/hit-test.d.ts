import { Vector2D, BBox } from '@opencad/core';
export interface Pickable {
    id: string;
    getBounds(): BBox;
    hitTest(point: Vector2D, tolerance: number): boolean;
}
export interface PickResult {
    id: string;
    distance: number;
}
export declare class HitTester {
    private items;
    register(item: Pickable): void;
    unregister(id: string): void;
    clear(): void;
    /**
     * Return the closest item under `point` within `tolerance`, or null.
     */
    pickAt(point: Vector2D, tolerance: number): PickResult | null;
    /**
     * Return all items under `point` within `tolerance`, sorted by
     * distance (ascending).
     */
    pickAll(point: Vector2D, tolerance: number): PickResult[];
    /**
     * Return ids of all items whose bounds intersect `rect`.
     */
    pickInRect(rect: BBox): string[];
}
/**
 * Test whether `point` is within `tolerance` of a line segment with
 * the given `width`.
 */
export declare function hitTestLine(point: Vector2D, start: Vector2D, end: Vector2D, width: number, tolerance: number): boolean;
/**
 * Test whether `point` is within `tolerance` of a circle (outline).
 * Hits if the point is close to the circumference.
 */
export declare function hitTestCircle(point: Vector2D, center: Vector2D, radius: number, tolerance: number): boolean;
/**
 * Test whether `point` is within `tolerance` of an axis-aligned
 * rectangle (filled).
 */
export declare function hitTestRect(point: Vector2D, rect: BBox, tolerance: number): boolean;
/**
 * Test whether `point` is within `tolerance` of an arc stroke.
 * Angles are in radians, measured counter-clockwise from the
 * positive x-axis.
 */
export declare function hitTestArc(point: Vector2D, center: Vector2D, radius: number, startAngle: number, endAngle: number, width: number, tolerance: number): boolean;
//# sourceMappingURL=hit-test.d.ts.map