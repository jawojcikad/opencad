import { PCBDocument } from '@opencad/core';
import { Pick3DResult } from '../raycasting/pcb-raycaster';
export declare class PCB3DViewer {
    private scene;
    private camera;
    private renderer;
    private controls;
    private boardGroup;
    private componentGroup;
    private animationId;
    private container;
    private raycaster;
    private boardBuilder;
    private componentBuilder;
    private transparencyEnabled;
    private layerVisibility;
    private boundOnResize;
    constructor(container: HTMLElement);
    loadPCB(document: PCBDocument): void;
    resetView(): void;
    topView(): void;
    bottomView(): void;
    isometricView(): void;
    fitToBoard(): void;
    setLayerVisible(layer: string, visible: boolean): void;
    setTransparency(enabled: boolean): void;
    showComponents(visible: boolean): void;
    onResize(): void;
    /**
     * Perform a 3D pick at the given pixel coordinates (relative to container).
     */
    pick(clientX: number, clientY: number): Pick3DResult | null;
    private animate;
    destroy(): void;
    private clearGroup;
    private getBoardCenter;
    private getViewDistance;
}
//# sourceMappingURL=viewer3d.d.ts.map