import { Vector2D } from './vector2d';
export declare class BBox {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
    constructor(minX: number, minY: number, maxX: number, maxY: number);
    /** Build the smallest BBox that contains all given points. */
    static fromPoints(points: Vector2D[]): BBox;
    /** An "empty" (inverted) bbox — useful as the identity element for union. */
    static empty(): BBox;
    get width(): number;
    get height(): number;
    center(): Vector2D;
    contains(point: Vector2D): boolean;
    containsBBox(other: BBox): boolean;
    intersects(other: BBox): boolean;
    union(other: BBox): BBox;
    intersection(other: BBox): BBox | null;
    /** Return a new BBox expanded by `margin` on every side. */
    expand(margin: number): BBox;
}
//# sourceMappingURL=bbox.d.ts.map