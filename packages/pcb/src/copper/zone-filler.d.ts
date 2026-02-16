import { Vector2D, BBox, PCBDocument, CopperZone } from '@opencad/core';
export interface ZoneFillSettings {
    clearance: number;
    minWidth: number;
    thermalReliefGap: number;
    thermalReliefWidth: number;
    fillType: 'solid' | 'hatched';
    hatchWidth?: number;
    hatchGap?: number;
    priority: number;
}
export declare class ZoneFiller {
    /**
     * Fill a copper zone, subtracting clearances around other nets' obstacles.
     * Returns an array of filled polygons (each polygon is an array of vertices).
     */
    fillZone(zone: CopperZone, document: PCBDocument): Vector2D[][];
    /**
     * Simple polygon offset (shrink when offset < 0, expand when offset > 0).
     * Uses the normal-based offset method for each edge.
     */
    offsetPolygon(polygon: Vector2D[], offset: number): Vector2D[];
    /**
     * Subtract rectangular obstacles from the zone polygon.
     * Uses polygon clipping — for each obstacle, cuts it out of all current polygons.
     */
    subtractObstacles(zone: Vector2D[], obstacles: BBox[], clearance: number): Vector2D[][];
    /**
     * Subtract a convex rectangle from a polygon using Sutherland-Hodgman algorithm variant.
     * Returns the polygon(s) remaining after subtraction.
     */
    private subtractRectFromPolygon;
    /**
     * Compute polygon difference: polygon - rect.
     * A simplified version that handles rectangular cutouts from convex/simple polygons.
     */
    private computePolygonDifference;
    /**
     * Walk along the rectangle boundary from start to end.
     */
    private walkRectBoundary;
    /**
     * Create a polygon with a rectangular hole using a bridge connection.
     */
    private createPolygonWithHole;
    /**
     * Create a hatch-pattern fill from the filled polygons.
     */
    private createHatchFill;
    /**
     * Collect all obstacles (bounding boxes) from the PCB document that clash with the zone.
     */
    private collectObstacles;
}
//# sourceMappingURL=zone-filler.d.ts.map