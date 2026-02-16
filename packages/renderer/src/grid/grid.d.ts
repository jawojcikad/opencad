import { Vector2D, BBox } from '@opencad/core';
import { Camera } from '../camera/camera';
export interface GridSettings {
    /** Distance between major grid lines in world units. */
    majorSpacing: number;
    /** Number of minor subdivisions between each major line. */
    minorDivisions: number;
    majorColor: string;
    minorColor: string;
    majorLineWidth: number;
    minorLineWidth: number;
    visible: boolean;
    snapToGrid: boolean;
}
/**
 * Sensible defaults for a schematic / PCB grid.
 */
export declare function defaultGridSettings(): GridSettings;
/**
 * Snap a world-space point to the nearest grid intersection.
 */
export declare function snapToGrid(point: Vector2D, gridSpacing: number): Vector2D;
export declare class GridRenderer {
    private settings;
    constructor(settings: GridSettings);
    /**
     * Merge partial settings into current settings.
     */
    setSettings(update: Partial<GridSettings>): void;
    /**
     * Draw the grid on a Canvas 2D context.  The context must *not*
     * already have the camera transform applied — this method handles
     * the mapping internally so that line widths remain constant in
     * screen space regardless of zoom.
     */
    renderCanvas2D(ctx: CanvasRenderingContext2D, camera: Camera): void;
    /**
     * Return Float32Arrays of line-segment vertex pairs (x1,y1,x2,y2 …)
     * for the given visible bounds, suitable for uploading to a VBO.
     */
    generateGridLines(visibleBounds: BBox): {
        majorLines: Float32Array;
        minorLines: Float32Array;
    };
}
//# sourceMappingURL=grid.d.ts.map