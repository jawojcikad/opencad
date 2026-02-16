import { Vector2D, BBox, EventBus, Command, PCBDocument, Layer, DesignRules } from '@opencad/core';
import { LayerManager } from '@opencad/renderer';
import type { GridSettings } from '@opencad/renderer';
import { PCBTool } from './tools';
/** Netlist imported from the schematic editor. */
export interface Netlist {
    components: Array<{
        refDes: string;
        footprintId: string;
        value: string;
    }>;
    nets: Array<{
        name: string;
        pins: Array<{
            refDes: string;
            pin: string;
        }>;
    }>;
}
export declare class PCBEditor {
    private document;
    private renderer;
    private camera;
    private eventBus;
    private commandHistory;
    private hitTester;
    private layerManager;
    private activeTool;
    private selection;
    private activeLayer;
    private designRules;
    private canvas;
    private animationFrameId;
    private ratsnestLines;
    private ratsnestCalculator;
    private gridSettings;
    private boundOnMouseDown;
    private boundOnMouseMove;
    private boundOnMouseUp;
    private boundOnWheel;
    private boundOnKeyDown;
    constructor(canvas: HTMLCanvasElement);
    resize(_width: number, _height: number): void;
    newDocument(): void;
    getDocument(): PCBDocument;
    /**
     * Replace the current document with an externally-loaded one
     * (e.g. from a sample project or KiCad import).
     */
    loadDocument(doc: any): void;
    /**
     * Import a netlist from the schematic editor.
     * Creates footprint placeholders for each component and sets up net assignments.
     */
    importNetlist(netlist: Netlist): void;
    setActiveLayer(layer: Layer): void;
    getActiveLayer(): Layer;
    getLayerManager(): LayerManager;
    setTool(tool: PCBTool): void;
    getSelection(): ReadonlySet<string>;
    select(ids: string[]): void;
    clearSelection(): void;
    deleteSelection(): void;
    executeCommand(cmd: Command): void;
    undo(): void;
    redo(): void;
    getDesignRules(): DesignRules;
    setDesignRules(rules: DesignRules): void;
    getGridSettings(): GridSettings;
    getEventBus(): EventBus;
    render(): void;
    startRenderLoop(): void;
    stopRenderLoop(): void;
    updateRatsnest(): void;
    hitTest(worldPos: Vector2D): string | null;
    hitTestBox(bbox: BBox): string[];
    /**
     * Find a pad at the given world position.
     */
    findPadAt(worldPos: Vector2D): {
        padId: string;
        netId: string;
        footprintId: string;
    } | null;
    onMouseDown(e: MouseEvent): void;
    onMouseMove(e: MouseEvent): void;
    onMouseUp(e: MouseEvent): void;
    onWheel(e: WheelEvent): void;
    onKeyDown(e: KeyboardEvent): void;
    destroy(): void;
    private renderBoardOutline;
    private renderTracks;
    private renderVias;
    private renderFootprints;
    private renderCopperZones;
    private renderRatsnest;
    private renderSelection;
    private screenToWorld;
    private computeFootprintBBox;
    private getLayerColor;
}
//# sourceMappingURL=pcb-editor.d.ts.map