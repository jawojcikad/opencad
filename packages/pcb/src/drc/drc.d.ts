import { Vector2D, PCBDocument, Layer, DesignRules } from '@opencad/core';
export declare enum DRCViolationType {
    ClearanceViolation = 0,
    MinTrackWidth = 1,
    MinViaDiameter = 2,
    MinViaDrill = 3,
    MinHoleToHole = 4,
    UnroutedNet = 5,
    TrackDangling = 6,
    SilkOverPad = 7,
    CourtyardOverlap = 8
}
export interface DRCViolation {
    type: DRCViolationType;
    message: string;
    severity: 'error' | 'warning';
    location: Vector2D;
    objectIds: string[];
    layer?: Layer;
}
export declare class DRCChecker {
    private rules;
    constructor(rules: DesignRules);
    /**
     * Run all DRC checks on the given PCB document.
     */
    check(document: PCBDocument): DRCViolation[];
    /**
     * Check clearance between all conductors on the same layer with different nets.
     * Uses a sweep-line approach for efficiency: sort objects by X, then check
     * only nearby objects.
     */
    private checkClearances;
    /**
     * Check that all tracks meet minimum width requirement.
     */
    private checkMinTrackWidth;
    /**
     * Check that all vias meet minimum diameter and drill size.
     */
    private checkMinViaDimensions;
    /**
     * Check minimum hole-to-hole distance between all drilled holes.
     */
    private checkMinHoleToHole;
    /**
     * Check for unrouted nets — any net that has pads not connected by tracks.
     */
    private checkUnroutedNets;
    /**
     * Check for silkscreen overlapping pads.
     */
    private checkSilkOverPad;
    /**
     * Check for overlapping component courtyards.
     */
    private checkCourtyardOverlap;
    private computeFootprintCourtyard;
    private collectConductiveObjects;
    private getAllCopperLayers;
    private objectDistance;
}
//# sourceMappingURL=drc.d.ts.map