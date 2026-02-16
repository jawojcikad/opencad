import { Vector2D, Footprint } from '@opencad/core';
import { WebGLRenderer } from '@opencad/renderer';
import type { PCBEditor } from './pcb-editor';
/**
 * Interface for all PCB editing tools.
 */
export interface PCBTool {
    name: string;
    cursor: string;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, e: MouseEvent): void;
    onMouseUp(worldPos: Vector2D, e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
}
export declare class SelectTool implements PCBTool {
    readonly name = "select";
    readonly cursor = "default";
    private editor;
    private isDragging;
    private isBoxSelecting;
    private dragStartWorld;
    private dragCurrentWorld;
    private draggedItemId;
    private dragOffset;
    private originalPosition;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, e: MouseEvent): void;
    onMouseUp(worldPos: Vector2D, e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
    private rotateSelection;
    private flipSelection;
}
export declare class RouteTool implements PCBTool {
    readonly name = "route";
    readonly cursor = "crosshair";
    private editor;
    private router;
    private previewSegments;
    private currentWidth;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
    private getLayerColor;
}
export declare class PlaceFootprintTool implements PCBTool {
    readonly name = "place-footprint";
    readonly cursor = "copy";
    private editor;
    private footprintTemplate;
    private ghostPosition;
    private ghostRotation;
    /**
     * Set the footprint template to place.
     */
    setFootprint(footprint: Footprint): void;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
}
export declare class DrawBoardOutlineTool implements PCBTool {
    readonly name = "board-outline";
    readonly cursor = "crosshair";
    private editor;
    private points;
    private currentPoint;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
    private finishOutline;
}
export declare class PlaceViaTool implements PCBTool {
    readonly name = "place-via";
    readonly cursor = "crosshair";
    private editor;
    private previewPosition;
    private netId;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
}
export declare class MeasureTool implements PCBTool {
    readonly name = "measure";
    readonly cursor = "crosshair";
    private editor;
    private startPoint;
    private endPoint;
    private measurements;
    onActivate(editor: PCBEditor): void;
    onDeactivate(): void;
    onMouseDown(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseMove(worldPos: Vector2D, _e: MouseEvent): void;
    onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    renderPreview(renderer: WebGLRenderer): void;
}
//# sourceMappingURL=tools.d.ts.map