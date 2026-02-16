import { PCBDocument, Track, Via, DesignRules } from '@opencad/core';
export interface AutorouterConfig {
    gridResolution: number;
    maxIterations: number;
    costFactors: {
        viaCount: number;
        length: number;
        layerChange: number;
        bend: number;
    };
}
export interface AutorouterResult {
    routedNets: number;
    failedNets: string[];
    tracks: Track[];
    vias: Via[];
}
export declare class Autorouter {
    private document;
    private rules;
    private config;
    private obstacleGrid;
    private gridMinX;
    private gridMinY;
    private gridMaxX;
    private gridMaxY;
    private copperLayers;
    constructor(document: PCBDocument, rules: DesignRules, config?: Partial<AutorouterConfig>);
    /**
     * Route all unrouted nets, ordered by shortest Manhattan distance first.
     */
    routeAll(onProgress?: (progress: number) => void): AutorouterResult;
    /**
     * Route a single net by connecting all its pads in sequence.
     * Uses minimum spanning tree ordering to determine pad connection order.
     */
    routeNet(netId: string): Track[];
    /**
     * A* pathfinding on a multi-layer routing grid.
     * Supports via transitions between layers.
     */
    private findPath;
    /**
     * Heuristic: Manhattan distance + layer change cost.
     */
    private heuristic;
    /**
     * Reconstruct path from A* result.
     */
    private reconstructPath;
    /**
     * Convert A* path to Track objects, simplifying collinear segments.
     */
    private pathToTracks;
    /**
     * Build obstacle grid from existing tracks, pads, vias, and board outline.
     */
    private buildObstacleGrid;
    private addTrackToObstacleGrid;
    private isBlocked;
    private initializeBounds;
    private getLayerIndex;
    /**
     * Collect all pads belonging to the given net.
     */
    private collectNetPads;
    /**
     * Collect unrouted nets with their estimated routing difficulty.
     */
    private collectUnroutedNets;
    /**
     * Compute minimum spanning tree of pads using Prim's algorithm.
     * Returns a list of connections (edges) between pad indices.
     */
    private computeMST;
}
//# sourceMappingURL=autorouter.d.ts.map