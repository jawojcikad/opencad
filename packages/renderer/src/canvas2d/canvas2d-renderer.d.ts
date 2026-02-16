import { Vector2D, BBox } from '@opencad/core';
import { Camera } from '../camera/camera';
export interface RenderStyle {
    strokeColor?: string;
    fillColor?: string;
    lineWidth?: number;
    lineDash?: number[];
    font?: string;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    globalAlpha?: number;
}
export declare class Canvas2DRenderer {
    private ctx;
    private _camera;
    private gridRenderer;
    private _canvas;
    constructor(canvas: HTMLCanvasElement);
    get canvas(): HTMLCanvasElement;
    getCamera(): Camera;
    getContext(): CanvasRenderingContext2D;
    beginFrame(): void;
    endFrame(): void;
    clear(color?: string): void;
    private applyTransform;
    private applyStyle;
    drawLine(start: Vector2D, end: Vector2D, style: RenderStyle): void;
    drawPolyline(points: Vector2D[], style: RenderStyle): void;
    drawRect(topLeft: Vector2D, width: number, height: number, style: RenderStyle): void;
    drawCircle(center: Vector2D, radius: number, style: RenderStyle): void;
    drawArc(center: Vector2D, radius: number, startAngle: number, endAngle: number, style: RenderStyle): void;
    drawPolygon(points: Vector2D[], style: RenderStyle): void;
    drawText(text: string, position: Vector2D, style: RenderStyle & {
        fontSize?: number;
    }): void;
    fillRect(topLeft: Vector2D, width: number, height: number, style: RenderStyle): void;
    fillCircle(center: Vector2D, radius: number, style: RenderStyle): void;
    fillPolygon(points: Vector2D[], style: RenderStyle): void;
    drawSelectionRect(bbox: BBox, color?: string): void;
    drawSelectionHandles(bbox: BBox): void;
    /**
     * Resize the internal canvas to match its CSS size × device pixel
     * ratio, and update the camera viewport.
     */
    resize(): void;
    getPixelRatio(): number;
}
//# sourceMappingURL=canvas2d-renderer.d.ts.map