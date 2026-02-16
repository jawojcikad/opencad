import { Camera } from '../camera/camera';
/**
 * Lightweight WebGL2 renderer for the PCB view.
 *
 * Provides batched drawing methods for lines, triangles and circles.
 * Shaders are lazily compiled on first use.
 */
export declare class WebGLRenderer {
    private gl;
    private _camera;
    private basicProgram;
    private circleProgram;
    private dynamicVBO;
    private quadVBO;
    private circleCentersVBO;
    private circleRadiiVBO;
    constructor(canvas: HTMLCanvasElement);
    getCamera(): Camera;
    setCamera(camera: Camera): void;
    beginFrame(): void;
    endFrame(): void;
    flush(): void;
    clear(color?: [number, number, number, number]): void;
    drawGrid(settings: any, camera?: Camera): void;
    drawLine(start: {
        x: number;
        y: number;
    }, end: {
        x: number;
        y: number;
    }, width: number, color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): void;
    drawCircle(center: {
        x: number;
        y: number;
    }, radius: number, color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): void;
    drawRect(topLeft: {
        x: number;
        y: number;
    }, bottomRight: {
        x: number;
        y: number;
    }, strokeColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    }, fillColor?: {
        r: number;
        g: number;
        b: number;
        a: number;
    }, lineWidth?: number): void;
    drawText(_text: string, _position: {
        x: number;
        y: number;
    }, _color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }, _size: number): void;
    resize(): void;
    /**
     * Compute a combined view-projection matrix (3×3, column-major)
     * that maps world coordinates to clip space.
     */
    private getViewProjectionMatrix;
    private getBasicProgram;
    private getCircleProgram;
    /**
     * Draw batches of line segments with uniform colour and width.
     * `vertices` is a flat array of (x,y) pairs — every two successive
     * vertices form one line segment.
     */
    drawLines(vertices: Float32Array, color: [number, number, number, number], lineWidth: number): void;
    /**
     * Draw filled triangles (for copper zones, pads, etc.).
     * `vertices` is a flat array of (x,y) pairs — every three vertices
     * form one triangle.
     */
    drawTriangles(vertices: Float32Array, color: [number, number, number, number]): void;
    /**
     * Draw circles as instanced quads rendered with a circle fragment
     * shader.
     *
     * @param centers  Flat array of (cx, cy) pairs.
     * @param radii    Array with one radius per circle.
     * @param color    Uniform colour.
     */
    drawCircles(centers: Float32Array, radii: Float32Array, color: [number, number, number, number]): void;
    destroy(): void;
}
//# sourceMappingURL=webgl-renderer.d.ts.map