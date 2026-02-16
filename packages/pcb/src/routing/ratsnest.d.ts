import { Vector2D, PCBDocument } from '@opencad/core';
export interface RatsnestLine {
    start: Vector2D;
    end: Vector2D;
    netId: string;
}
export declare class RatsnestCalculator {
    /**
     * Calculate minimum spanning tree ratsnest for all unrouted connections.
     * Groups pads by net, determines which pads are already connected by tracks,
     * and computes MST for the remaining unconnected pads.
     */
    calculate(document: PCBDocument): RatsnestLine[];
    /**
     * Build a set of routed connections for each net.
     * A connection is represented as "padId1:padId2" (sorted).
     */
    private buildRoutedConnections;
    /**
     * Kruskal's MST for a single net.
     * Uses the set of already-routed connections to pre-connect nodes.
     */
    private calculateNetRatsnest;
}
//# sourceMappingURL=ratsnest.d.ts.map