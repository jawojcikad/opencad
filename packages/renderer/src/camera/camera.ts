import { Vector2D, BBox, Matrix3 } from '@opencad/core';

/**
 * Camera manages viewport state: position, zoom level, and coordinate
 * transformations between screen (pixel) space and world space.
 */
export class Camera {
  private _position: Vector2D;
  private _zoom: number;
  private _viewportWidth: number;
  private _viewportHeight: number;
  private _minZoom: number;
  private _maxZoom: number;
  private _isPanning: boolean;
  private _lastPanPoint: Vector2D | null;

  constructor(viewportWidth: number, viewportHeight: number) {
    this._position = new Vector2D(0, 0);
    this._zoom = 1;
    this._viewportWidth = viewportWidth;
    this._viewportHeight = viewportHeight;
    this._minZoom = 0.001;
    this._maxZoom = 1000;
    this._isPanning = false;
    this._lastPanPoint = null;
  }

  // ── Getters ───────────────────────────────────────────────────────

  get position(): Vector2D {
    return this._position.clone();
  }

  get zoom(): number {
    return this._zoom;
  }

  get viewportWidth(): number {
    return this._viewportWidth;
  }

  get viewportHeight(): number {
    return this._viewportHeight;
  }

  // ── Viewport ──────────────────────────────────────────────────────

  setViewport(width: number, height: number): void {
    this._viewportWidth = width;
    this._viewportHeight = height;
  }

  // ── Navigation ────────────────────────────────────────────────────

  /**
   * Pan the camera by a delta expressed in screen pixels.
   * Moving the mouse right (positive deltaScreen.x) should move the
   * world to the right, so the camera position moves left (negative).
   */
  pan(deltaScreen: Vector2D): void {
    this._position.x -= deltaScreen.x / this._zoom;
    this._position.y -= deltaScreen.y / this._zoom;
  }

  /**
   * Zoom centred on a screen-space point.  `factor` > 1 zooms in.
   * The world point under the cursor stays fixed.
   */
  zoomAt(screenPoint: Vector2D | number, factor: number, legacyFactor?: number): void {
    let point: Vector2D;
    let zoomFactor: number;

    if (typeof screenPoint === 'number') {
      point = new Vector2D(screenPoint, factor);
      zoomFactor = legacyFactor ?? 1;
    } else {
      point = screenPoint;
      zoomFactor = factor;
    }

    const worldBefore = this.screenToWorld(point);

    this._zoom = clamp(this._zoom * zoomFactor, this._minZoom, this._maxZoom);

    const worldAfter = this.screenToWorld(point);
    // Adjust position so worldBefore stays under the cursor.
    this._position.x -= worldAfter.x - worldBefore.x;
    this._position.y -= worldAfter.y - worldBefore.y;
  }

  getZoom(): number {
    return this._zoom;
  }

  getViewBounds(): BBox {
    return this.getVisibleBounds();
  }

  startPan(clientX: number, clientY: number): void {
    this._isPanning = true;
    this._lastPanPoint = new Vector2D(clientX, clientY);
  }

  updatePan(clientX: number, clientY: number): void {
    if (!this._isPanning || !this._lastPanPoint) return;
    const delta = new Vector2D(clientX - this._lastPanPoint.x, clientY - this._lastPanPoint.y);
    this.pan(delta);
    this._lastPanPoint = new Vector2D(clientX, clientY);
  }

  endPan(): void {
    this._isPanning = false;
    this._lastPanPoint = null;
  }

  isPanning(): boolean {
    return this._isPanning;
  }

  /**
   * Adjust zoom and position so the given BBox fills the viewport,
   * with optional padding expressed as a fraction (0.1 = 10 %).
   */
  zoomToFit(bbox: BBox, padding = 0.1): void {
    const bboxWidth = bbox.maxX - bbox.minX;
    const bboxHeight = bbox.maxY - bbox.minY;

    if (bboxWidth <= 0 || bboxHeight <= 0) {
      return;
    }

    const padded = 1 + padding;
    const zoomX = this._viewportWidth / (bboxWidth * padded);
    const zoomY = this._viewportHeight / (bboxHeight * padded);

    this._zoom = clamp(Math.min(zoomX, zoomY), this._minZoom, this._maxZoom);

    // Centre on the bbox.
    this._position.x = (bbox.minX + bbox.maxX) / 2;
    this._position.y = (bbox.minY + bbox.maxY) / 2;
  }

  // ── Coordinate transforms ─────────────────────────────────────────

  /**
   * Convert a point from screen (pixel) space to world space.
   *
   * Screen origin is top-left. World origin sits at the centre of the
   * viewport when position == (0,0).
   */
  screenToWorld(screenPoint: Vector2D | number, y?: number): Vector2D {
    const p =
      typeof screenPoint === 'number'
        ? new Vector2D(screenPoint, y ?? 0)
        : screenPoint;
    return new Vector2D(
      (p.x - this._viewportWidth / 2) / this._zoom + this._position.x,
      (p.y - this._viewportHeight / 2) / this._zoom + this._position.y
    );
  }

  screenToWorldXY(x: number, y: number): Vector2D {
    return this.screenToWorld(new Vector2D(x, y));
  }

  /**
   * Convert a point from world space to screen (pixel) space.
   */
  worldToScreen(worldPoint: Vector2D): Vector2D {
    return new Vector2D(
      (worldPoint.x - this._position.x) * this._zoom + this._viewportWidth / 2,
      (worldPoint.y - this._position.y) * this._zoom + this._viewportHeight / 2
    );
  }

  /**
   * Return a 3×3 view matrix that transforms world coords → screen coords.
   *
   * T(viewport/2) · S(zoom) · T(−position)
   */
  getViewMatrix(): Matrix3 {
    const z = this._zoom;
    const tx = -this._position.x * z + this._viewportWidth / 2;
    const ty = -this._position.y * z + this._viewportHeight / 2;

    //  [ z  0  tx ]
    //  [ 0  z  ty ]
    //  [ 0  0   1 ]
    return new Matrix3([
      z, 0, tx,
      0, z, ty,
      0, 0, 1,
    ]);
  }

  /**
   * Return a 3×3 orthographic projection matrix that maps screen pixels
   * to normalised device coordinates (-1 … 1).
   *
   * Useful for WebGL rendering.
   */
  getProjectionMatrix(): Matrix3 {
    const w = this._viewportWidth;
    const h = this._viewportHeight;

    //  [ 2/w   0    -1 ]
    //  [  0   -2/h   1 ]
    //  [  0    0     1 ]
    return new Matrix3([
      2 / w, 0, -1,
      0, -2 / h, 1,
      0, 0, 1,
    ]);
  }

  /**
   * Returns the axis-aligned bounding box in world space currently
   * visible in the viewport.
   */
  getVisibleBounds(): BBox {
    const halfW = this._viewportWidth / 2 / this._zoom;
    const halfH = this._viewportHeight / 2 / this._zoom;

    return new BBox(
      this._position.x - halfW,
      this._position.y - halfH,
      this._position.x + halfW,
      this._position.y + halfH
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
