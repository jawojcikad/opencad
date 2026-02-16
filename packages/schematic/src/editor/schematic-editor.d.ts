import { SchematicDocument, Sheet, Vector2D, Command } from '@opencad/core';
import { SchematicTool } from './tools';
export declare class SchematicEditor {
    private document;
    private activeSheet;
    private renderer;
    private camera;
    private eventBus;
    private commandHistory;
    private hitTester;
    private activeTool;
    private selection;
    private schematicRenderer;
    private animFrameId;
    private canvas;
    constructor(canvas: HTMLCanvasElement);
    resize(_width: number, _height: number): void;
    newDocument(): void;
    getDocument(): SchematicDocument;
    getActiveSheet(): Sheet;
    /**
     * Replace the current document with an externally-loaded one
     * (e.g. from a sample project or KiCad import).
     */
    loadDocument(doc: SchematicDocument): void;
    setActiveSheet(sheetIndex: number): void;
    addSheet(name?: string): Sheet;
    removeSheet(index: number): void;
    setTool(tool: SchematicTool): void;
    getActiveTool(): SchematicTool | null;
    getSelection(): ReadonlySet<string>;
    select(ids: string[]): void;
    deselect(ids: string[]): void;
    clearSelection(): void;
    selectAll(): void;
    deleteSelection(): void;
    executeCommand(cmd: Command): void;
    undo(): void;
    redo(): void;
    hitTest(worldPos: Vector2D): string | null;
    private pointToSegmentDist;
    render(): void;
    startRenderLoop(): void;
    stopRenderLoop(): void;
    onMouseDown(e: MouseEvent): void;
    onMouseMove(e: MouseEvent): void;
    onMouseUp(e: MouseEvent): void;
    onWheel(e: WheelEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    screenToWorld(screenPoint: Vector2D): Vector2D;
    destroy(): void;
}
//# sourceMappingURL=schematic-editor.d.ts.map