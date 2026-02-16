import { Vector2D } from '@opencad/core';
/**
 * Sensible defaults for a schematic / PCB grid.
 */
export function defaultGridSettings() {
    return {
        majorSpacing: 100,
        minorDivisions: 5,
        majorColor: 'rgba(180,180,180,0.6)',
        minorColor: 'rgba(180,180,180,0.2)',
        majorLineWidth: 1,
        minorLineWidth: 0.5,
        visible: true,
        snapToGrid: true,
    };
}
/**
 * Snap a world-space point to the nearest grid intersection.
 */
export function snapToGrid(point, gridSpacing) {
    return new Vector2D(Math.round(point.x / gridSpacing) * gridSpacing, Math.round(point.y / gridSpacing) * gridSpacing);
}
// ── Grid Renderer ───────────────────────────────────────────────────
export class GridRenderer {
    settings;
    constructor(settings) {
        this.settings = { ...settings };
    }
    /**
     * Merge partial settings into current settings.
     */
    setSettings(update) {
        Object.assign(this.settings, update);
    }
    // ── Canvas 2D rendering ─────────────────────────────────────────
    /**
     * Draw the grid on a Canvas 2D context.  The context must *not*
     * already have the camera transform applied — this method handles
     * the mapping internally so that line widths remain constant in
     * screen space regardless of zoom.
     */
    renderCanvas2D(ctx, camera) {
        if (!this.settings.visible)
            return;
        const bounds = camera.getVisibleBounds();
        const { majorSpacing, minorDivisions } = this.settings;
        const minorSpacing = majorSpacing / minorDivisions;
        // Snap the start of the grid to the nearest minor line before the
        // visible region so lines cover the entire viewport.
        const startX = Math.floor(bounds.minX / minorSpacing) * minorSpacing;
        const startY = Math.floor(bounds.minY / minorSpacing) * minorSpacing;
        const endX = Math.ceil(bounds.maxX / minorSpacing) * minorSpacing;
        const endY = Math.ceil(bounds.maxY / minorSpacing) * minorSpacing;
        // Minor lines ────────────────────────────────────────────────
        ctx.beginPath();
        ctx.strokeStyle = this.settings.minorColor;
        ctx.lineWidth = this.settings.minorLineWidth;
        for (let x = startX; x <= endX; x += minorSpacing) {
            if (isMultipleOf(x, majorSpacing))
                continue; // drawn separately
            const sx = camera.worldToScreen(new Vector2D(x, 0)).x;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, camera.viewportHeight);
        }
        for (let y = startY; y <= endY; y += minorSpacing) {
            if (isMultipleOf(y, majorSpacing))
                continue;
            const sy = camera.worldToScreen(new Vector2D(0, y)).y;
            ctx.moveTo(0, sy);
            ctx.lineTo(camera.viewportWidth, sy);
        }
        ctx.stroke();
        // Major lines ────────────────────────────────────────────────
        const majorStartX = Math.floor(bounds.minX / majorSpacing) * majorSpacing;
        const majorStartY = Math.floor(bounds.minY / majorSpacing) * majorSpacing;
        const majorEndX = Math.ceil(bounds.maxX / majorSpacing) * majorSpacing;
        const majorEndY = Math.ceil(bounds.maxY / majorSpacing) * majorSpacing;
        ctx.beginPath();
        ctx.strokeStyle = this.settings.majorColor;
        ctx.lineWidth = this.settings.majorLineWidth;
        for (let x = majorStartX; x <= majorEndX; x += majorSpacing) {
            const sx = camera.worldToScreen(new Vector2D(x, 0)).x;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, camera.viewportHeight);
        }
        for (let y = majorStartY; y <= majorEndY; y += majorSpacing) {
            const sy = camera.worldToScreen(new Vector2D(0, y)).y;
            ctx.moveTo(0, sy);
            ctx.lineTo(camera.viewportWidth, sy);
        }
        ctx.stroke();
    }
    // ── WebGL data generation ───────────────────────────────────────
    /**
     * Return Float32Arrays of line-segment vertex pairs (x1,y1,x2,y2 …)
     * for the given visible bounds, suitable for uploading to a VBO.
     */
    generateGridLines(visibleBounds) {
        const { majorSpacing, minorDivisions } = this.settings;
        const minorSpacing = majorSpacing / minorDivisions;
        const startX = Math.floor(visibleBounds.minX / minorSpacing) * minorSpacing;
        const startY = Math.floor(visibleBounds.minY / minorSpacing) * minorSpacing;
        const endX = Math.ceil(visibleBounds.maxX / minorSpacing) * minorSpacing;
        const endY = Math.ceil(visibleBounds.maxY / minorSpacing) * minorSpacing;
        const majorVerts = [];
        const minorVerts = [];
        // Vertical lines
        for (let x = startX; x <= endX; x += minorSpacing) {
            const target = isMultipleOf(x, majorSpacing) ? majorVerts : minorVerts;
            target.push(x, visibleBounds.minY, x, visibleBounds.maxY);
        }
        // Horizontal lines
        for (let y = startY; y <= endY; y += minorSpacing) {
            const target = isMultipleOf(y, majorSpacing) ? majorVerts : minorVerts;
            target.push(visibleBounds.minX, y, visibleBounds.maxX, y);
        }
        return {
            majorLines: new Float32Array(majorVerts),
            minorLines: new Float32Array(minorVerts),
        };
    }
}
// ── Helpers ──────────────────────────────────────────────────────────
/**
 * Returns true when `value` is (approximately) a multiple of `base`.
 */
function isMultipleOf(value, base) {
    const remainder = Math.abs(value % base);
    return remainder < 1e-9 || Math.abs(remainder - base) < 1e-9;
}
//# sourceMappingURL=grid.js.map