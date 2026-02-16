import { Command, SchematicComponent, Wire, NetLabel, Sheet, Vector2D } from '@opencad/core';
export declare class PlaceComponentCommand implements Command {
    readonly description: string;
    private component;
    private sheet;
    constructor(sheet: Sheet, component: SchematicComponent);
    execute(): void;
    undo(): void;
}
export declare class MoveComponentCommand implements Command {
    readonly description: string;
    private sheet;
    private componentIds;
    private delta;
    constructor(sheet: Sheet, componentIds: string[], delta: Vector2D);
    execute(): void;
    undo(): void;
    private findComponent;
    private findWire;
    private findNetLabel;
}
export declare class DeleteComponentCommand implements Command {
    readonly description: string;
    private sheet;
    private components;
    private indices;
    constructor(sheet: Sheet, componentIds: string[]);
    execute(): void;
    undo(): void;
}
export declare class DrawWireCommand implements Command {
    readonly description: string;
    private sheet;
    private wire;
    constructor(sheet: Sheet, wire: Wire);
    execute(): void;
    undo(): void;
}
export declare class DeleteWireCommand implements Command {
    readonly description: string;
    private sheet;
    private wires;
    private indices;
    constructor(sheet: Sheet, wireIds: string[]);
    execute(): void;
    undo(): void;
}
export declare class PlaceNetLabelCommand implements Command {
    readonly description: string;
    private sheet;
    private label;
    constructor(sheet: Sheet, label: NetLabel);
    execute(): void;
    undo(): void;
}
export declare class RotateComponentCommand implements Command {
    readonly description: string;
    private sheet;
    private componentId;
    private angleDeg;
    constructor(sheet: Sheet, componentId: string, angleDeg?: number);
    execute(): void;
    undo(): void;
}
//# sourceMappingURL=commands.d.ts.map