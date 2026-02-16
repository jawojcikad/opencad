import { Vector2D, PCBDocument, Track, Layer, DesignRules } from '@opencad/core';
export interface TrackSegment {
    start: Vector2D;
    end: Vector2D;
    width: number;
    layer: Layer;
}
export declare class InteractiveRouter {
    private designRules;
    private document;
    private isRouting;
    private routeStartPoint;
    private currentLayer;
    private currentNetId;
    private currentWidth;
    private routeSegments;
    private committedPoints;
    private routingMode;
    constructor(document: PCBDocument, rules: DesignRules);
    /**
     * Start routing from a pad or existing track endpoint.
     */
    startRoute(startPoint: Vector2D, layer: Layer, netId: string, width: number): void;
    /**
     * Update the route preview as the mouse moves.
     * Returns the preview segments from the last committed point to the current mouse position.
     */
    updateRoute(currentPoint: Vector2D): TrackSegment[];
    /**
     * Commit the current point and add to the route being built.
     * Call this when the user clicks to add a bend point.
     */
    addRoutePoint(point: Vector2D): void;
    /**
     * Finalize the current route segments and return Track objects.
     */
    commitRoute(): Track[];
    /**
     * Cancel current routing operation.
     */
    cancelRoute(): void;
    /**
     * Switch to another layer (e.g., when placing a via mid-route).
     */
    switchLayer(newLayer: Layer): void;
    /**
     * Toggle between 45-degree and 90-degree routing modes.
     */
    setRoutingMode(mode: '45deg' | '90deg'): void;
    getIsRouting(): boolean;
    getCurrentNetId(): string;
    getCurrentLayer(): Layer;
    getLastPoint(): Vector2D | null;
    /**
     * Check if a route segment is valid (no DRC violations).
     * Checks clearance against all other tracks, pads, and vias on the same layer.
     */
    validateSegment(start: Vector2D, end: Vector2D, width: number, layer: Layer): boolean;
    /**
     * Calculate a 45-degree or 90-degree routed path between two points.
     * For 45-degree mode: first route at 45 degrees, then horizontally/vertically (or vice versa).
     * For 90-degree mode: first horizontal, then vertical (or vice versa).
     */
    private calculateRoutePath;
}
//# sourceMappingURL=interactive-router.d.ts.map