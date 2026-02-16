import { Vector2D, BBox, Matrix3 } from '@opencad/core';
/**
 * Camera manages viewport state: position, zoom level, and coordinate
 * transformations between screen (pixel) space and world space.
 */
export declare class Camera {
    private _position;
    private _zoom;
    private _viewportWidth;
    private _viewportHeight;
    private _minZoom;
    private _maxZoom;
    private _isPanning;
    private _lastPanPoint;
    constructor(viewportWidth: number, viewportHeight: number);
    get position(): Vector2D;
    get zoom(): number;
    get viewportWidth(): number;
    get viewportHeight(): number;
    setViewport(width: number, height: number): void;
    /**
     * Pan the camera by a delta expressed in screen pixels.
     * Moving the mouse right (positive deltaScreen.x) should move the
     * world to the right, so the camera position moves left (negative).
     */
    pan(deltaScreen: Vector2D): void;
    /**
     * Zoom centred on a screen-space point.  `factor` > 1 zooms in.
     * The world point under the cursor stays fixed.
     */
    zoomAt(screenPoint: Vector2D | number, factor: number, legacyFactor?: number): void;
    getZoom(): number;
    getViewBounds(): BBox;
    startPan(clientX: number, clientY: number): void;
    updatePan(clientX: number, clientY: number): void;
    endPan(): void;
    isPanning(): boolean;
    /**
     * Adjust zoom and position so the given BBox fills the viewport,
     * with optional padding expressed as a fraction (0.1 = 10 %).
     */
    zoomToFit(bbox: BBox, padding?: number): void;
    /**
     * Convert a point from screen (pixel) space to world space.
     *
     * Screen origin is top-left. World origin sits at the centre of the
     * viewport when position == (0,0).
     */
    screenToWorld(screenPoint: Vector2D | number, y?: number): Vector2D;
    screenToWorldXY(x: number, y: number): Vector2D;
    /**
     * Convert a point from world space to screen (pixel) space.
     */
    worldToScreen(worldPoint: Vector2D): Vector2D;
    /**
     * Return a 3×3 view matrix that transforms world coords → screen coords.
     *
     * T(viewport/2) · S(zoom) · T(−position)
     */
    getViewMatrix(): Matrix3;
    /**
     * Return a 3×3 orthographic projection matrix that maps screen pixels
     * to normalised device coordinates (-1 … 1).
     *
     * Useful for WebGL rendering.
     */
    getProjectionMatrix(): Matrix3;
    /**
     * Returns the axis-aligned bounding box in world space currently
     * visible in the viewport.
     */
    getVisibleBounds(): BBox;
}
//# sourceMappingURL=camera.d.ts.map