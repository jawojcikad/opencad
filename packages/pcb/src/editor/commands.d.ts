import { Command, PCBDocument, Footprint, Track, Via, Vector2D } from '@opencad/core';
/**
 * Place a footprint on the PCB.
 */
export declare class PlaceFootprintCommand implements Command {
    readonly description: string;
    private footprint;
    private document;
    constructor(document: PCBDocument, footprint: Footprint);
    execute(): void;
    undo(): void;
}
/**
 * Move a footprint to a new position.
 */
export declare class MoveFootprintCommand implements Command {
    readonly description: string;
    private document;
    private footprintId;
    private oldPosition;
    private newPosition;
    constructor(document: PCBDocument, footprintId: string, oldPosition: Vector2D, newPosition: Vector2D);
    execute(): void;
    undo(): void;
}
/**
 * Rotate a footprint by a given angle (radians).
 */
export declare class RotateFootprintCommand implements Command {
    readonly description: string;
    private document;
    private footprintId;
    private oldRotation;
    private newRotation;
    constructor(document: PCBDocument, footprintId: string, oldRotation: number, newRotation: number);
    execute(): void;
    undo(): void;
}
/**
 * Flip a footprint between front and back copper layers.
 * Mirrors the Y axis and swaps layer assignments.
 */
export declare class FlipFootprintCommand implements Command {
    readonly description: string;
    private document;
    private footprintId;
    private oldLayer;
    private newLayer;
    private oldPadLayers;
    constructor(document: PCBDocument, footprintId: string);
    execute(): void;
    undo(): void;
    private flipLayer;
    private flipSilkLayer;
}
/**
 * Route a track (add one or more track segments).
 */
export declare class RouteTrackCommand implements Command {
    readonly description: string;
    private document;
    private tracks;
    constructor(document: PCBDocument, tracks: Track[]);
    execute(): void;
    undo(): void;
}
/**
 * Delete a track segment.
 */
export declare class DeleteTrackCommand implements Command {
    readonly description: string;
    private document;
    private trackId;
    private deletedTrack;
    private deletedIndex;
    constructor(document: PCBDocument, trackId: string);
    execute(): void;
    undo(): void;
}
/**
 * Place a via.
 */
export declare class PlaceViaCommand implements Command {
    readonly description: string;
    private document;
    private via;
    constructor(document: PCBDocument, via: Via);
    execute(): void;
    undo(): void;
}
/**
 * Delete any PCB item by ID (footprint, track, via).
 */
export declare class DeleteItemCommand implements Command {
    readonly description: string;
    private document;
    private itemId;
    private deletedItem;
    constructor(document: PCBDocument, itemId: string);
    execute(): void;
    undo(): void;
}
//# sourceMappingURL=commands.d.ts.map