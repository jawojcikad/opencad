import { Vector2D, SchematicDocument } from '@opencad/core';
export declare enum ERCViolationType {
    UnconnectedPin = "UnconnectedPin",
    ConflictingPinTypes = "ConflictingPinTypes",
    MissingPowerFlag = "MissingPowerFlag",
    DuplicateReference = "DuplicateReference",
    UnconnectedWire = "UnconnectedWire",
    MissingNetLabel = "MissingNetLabel"
}
export interface ERCViolation {
    type: ERCViolationType;
    message: string;
    severity: 'error' | 'warning';
    location: Vector2D;
    objectIds: string[];
}
export declare class ERCChecker {
    private static readonly CONNECTION_TOLERANCE;
    /**
     * Run all electrical rule checks on the document.
     */
    check(document: SchematicDocument): ERCViolation[];
    private checkUnconnectedPins;
    private checkPinConflicts;
    private checkDuplicateReferences;
    private checkPowerFlags;
    private checkUnconnectedWires;
    private checkMissingNetLabels;
    /**
     * Build a map of connection-point → list of pins at that point.
     */
    private buildNets;
    private collectWireEndpoints;
    private collectAllConnectionPoints;
    /**
     * Group wires into networks of connected wires using a union-find approach.
     */
    private buildWireNetworks;
    private wiresConnect;
    private countPinsOnNetwork;
    private isPinConnectedToPowerViaWire;
}
//# sourceMappingURL=erc.d.ts.map