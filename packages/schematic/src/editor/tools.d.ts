import { Vector2D, SchematicComponent } from '@opencad/core';
import { Canvas2DRenderer } from '@opencad/renderer';
import type { SchematicEditor } from './schematic-editor';
export interface SchematicTool {
    name: string;
    cursor: string;
    onActivate(editor: SchematicEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, e: MouseEvent): void;
    onMouseUp(worldPos: Vector2D, e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: Canvas2DRenderer): void;
}
export declare class SelectTool implements SchematicTool {
    readonly name = "select";
    readonly cursor = "default";
    private editor;
    private isDragging;
    private isBoxSelecting;
    private isMoving;
    private dragStart;
    private dragCurrent;
    private moveStart;
    private clickedOnSelected;
    onActivate(editor: SchematicEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: Canvas2DRenderer): void;
}
export declare class WireTool implements SchematicTool {
    readonly name = "wire";
    readonly cursor = "crosshair";
    private editor;
    private isDrawing;
    private points;
    private currentPos;
    private routingMode;
    onActivate(editor: SchematicEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: Canvas2DRenderer): void;
    private computeRoutedSegment;
    private finishWire;
    private reset;
}
export declare class PlaceComponentTool implements SchematicTool {
    readonly name = "place-component";
    readonly cursor = "crosshair";
    private editor;
    private template;
    private currentPos;
    private rotation;
    constructor(template?: SchematicComponent);
    setTemplate(template: SchematicComponent): void;
    onActivate(editor: SchematicEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: Canvas2DRenderer): void;
}
export declare class PlaceNetLabelTool implements SchematicTool {
    readonly name = "place-net-label";
    readonly cursor = "crosshair";
    private editor;
    private netName;
    private currentPos;
    constructor(netName?: string);
    setNetName(name: string): void;
    onActivate(editor: SchematicEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: Canvas2DRenderer): void;
}
//# sourceMappingURL=tools.d.ts.map