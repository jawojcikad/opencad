import { Vector2D } from '@opencad/core';
import { Camera } from '../camera/camera';
import { GridRenderer, defaultGridSettings } from '../grid/grid';
// ── Canvas2DRenderer ────────────────────────────────────────────────
export class Canvas2DRenderer {
    ctx;
    _camera;
    gridRenderer;
    _canvas;
    constructor(canvas) {
        this._canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas2DRenderer: failed to acquire 2D context');
        }
        this.ctx = ctx;
        this._camera = new Camera(canvas.width, canvas.height);
        this.gridRenderer = new GridRenderer(defaultGridSettings());
    }
    // ── Accessors ───────────────────────────────────────────────────
    get canvas() {
        return this._canvas;
    }
    getCamera() {
        return this._camera;
    }
    getContext() {
        return this.ctx;
    }
    // ── Frame management ────────────────────────────────────────────
    beginFrame() {
        this.ctx.save();
        this.clear();
        this.gridRenderer.renderCanvas2D(this.ctx, this._camera);
        this.applyTransform();
    }
    endFrame() {
        this.ctx.restore();
    }
    clear(color = '#1e1e1e') {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        this.ctx.restore();
    }
    // ── Camera transform ───────────────────────────────────────────
    applyTransform() {
        const zoom = this._camera.zoom;
        const pos = this._camera.position;
        const vw = this._camera.viewportWidth;
        const vh = this._camera.viewportHeight;
        this.ctx.setTransform(zoom, 0, 0, zoom, -pos.x * zoom + vw / 2, -pos.y * zoom + vh / 2);
    }
    // ── Style helper ────────────────────────────────────────────────
    applyStyle(style) {
        if (style.strokeColor)
            this.ctx.strokeStyle = style.strokeColor;
        if (style.fillColor)
            this.ctx.fillStyle = style.fillColor;
        if (style.lineWidth !== undefined) {
            // Keep line width constant in screen pixels.
            this.ctx.lineWidth = style.lineWidth / this._camera.zoom;
        }
        if (style.lineDash) {
            this.ctx.setLineDash(style.lineDash.map((d) => d / this._camera.zoom));
        }
        else {
            this.ctx.setLineDash([]);
        }
        if (style.font)
            this.ctx.font = style.font;
        if (style.textAlign)
            this.ctx.textAlign = style.textAlign;
        if (style.textBaseline)
            this.ctx.textBaseline = style.textBaseline;
        if (style.globalAlpha !== undefined)
            this.ctx.globalAlpha = style.globalAlpha;
    }
    // ── Drawing primitives (world coordinates) ─────────────────────
    drawLine(start, end, style) {
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawPolyline(points, style) {
        if (points.length < 2)
            return;
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawRect(topLeft, width, height, style) {
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.strokeRect(topLeft.x, topLeft.y, width, height);
        this.ctx.restore();
    }
    drawCircle(center, radius, style) {
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawArc(center, radius, startAngle, endAngle, style) {
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, startAngle, endAngle);
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawPolygon(points, style) {
        if (points.length < 2)
            return;
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    }
    drawText(text, position, style) {
        this.ctx.save();
        const fontSize = style.fontSize ?? 14;
        // Font size in world units — scale so it remains readable.
        const scaledSize = fontSize / this._camera.zoom;
        this.applyStyle({
            ...style,
            font: `${scaledSize}px ${style.font ?? 'sans-serif'}`,
        });
        if (style.fillColor) {
            this.ctx.fillText(text, position.x, position.y);
        }
        if (style.strokeColor) {
            this.ctx.strokeText(text, position.x, position.y);
        }
        // If neither colour is set, default to fill with stroke colour
        if (!style.fillColor && !style.strokeColor) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(text, position.x, position.y);
        }
        this.ctx.restore();
    }
    // ── Filled versions ────────────────────────────────────────────
    fillRect(topLeft, width, height, style) {
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.fillRect(topLeft.x, topLeft.y, width, height);
        this.ctx.restore();
    }
    fillCircle(center, radius, style) {
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    fillPolygon(points, style) {
        if (points.length < 3)
            return;
        this.ctx.save();
        this.applyStyle(style);
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    // ── Selection rendering ────────────────────────────────────────
    drawSelectionRect(bbox, color = 'rgba(0,120,255,0.3)') {
        const w = bbox.maxX - bbox.minX;
        const h = bbox.maxY - bbox.minY;
        // Filled translucent rectangle.
        this.fillRect(new Vector2D(bbox.minX, bbox.minY), w, h, { fillColor: color });
        // Dashed outline.
        this.drawRect(new Vector2D(bbox.minX, bbox.minY), w, h, {
            strokeColor: 'rgba(0,120,255,0.8)',
            lineWidth: 1,
            lineDash: [6, 3],
        });
    }
    drawSelectionHandles(bbox) {
        const handleSize = 6 / this._camera.zoom; // constant screen size
        const corners = [
            new Vector2D(bbox.minX, bbox.minY),
            new Vector2D(bbox.maxX, bbox.minY),
            new Vector2D(bbox.maxX, bbox.maxY),
            new Vector2D(bbox.minX, bbox.maxY),
        ];
        // Midpoints of edges.
        const midpoints = [
            new Vector2D((bbox.minX + bbox.maxX) / 2, bbox.minY),
            new Vector2D(bbox.maxX, (bbox.minY + bbox.maxY) / 2),
            new Vector2D((bbox.minX + bbox.maxX) / 2, bbox.maxY),
            new Vector2D(bbox.minX, (bbox.minY + bbox.maxY) / 2),
        ];
        const handleStyle = {
            fillColor: '#ffffff',
            strokeColor: '#0078ff',
            lineWidth: 1,
        };
        for (const pt of [...corners, ...midpoints]) {
            this.fillRect(new Vector2D(pt.x - handleSize / 2, pt.y - handleSize / 2), handleSize, handleSize, handleStyle);
            this.drawRect(new Vector2D(pt.x - handleSize / 2, pt.y - handleSize / 2), handleSize, handleSize, handleStyle);
        }
    }
    // ── Utility ────────────────────────────────────────────────────
    /**
     * Resize the internal canvas to match its CSS size × device pixel
     * ratio, and update the camera viewport.
     */
    resize() {
        const dpr = this.getPixelRatio();
        const rect = this._canvas.getBoundingClientRect();
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        if (this._canvas.width !== w || this._canvas.height !== h) {
            this._canvas.width = w;
            this._canvas.height = h;
            this._camera.setViewport(w, h);
        }
    }
    getPixelRatio() {
        return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    }
}
//# sourceMappingURL=canvas2d-renderer.js.map