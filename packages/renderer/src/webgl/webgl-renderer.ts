import { Camera } from '../camera/camera';
import {
  basicVertexSource,
  solidColorFragmentSource,
  circleVertexSource,
  circleFragmentSource,
} from './shaders';
import { createProgramFromSources } from './shader-utils';

/**
 * Lightweight WebGL2 renderer for the PCB view.
 *
 * Provides batched drawing methods for lines, triangles and circles.
 * Shaders are lazily compiled on first use.
 */
export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private _camera: Camera;

  // Programs ─────────────────────────────────────────────────────
  private basicProgram: WebGLProgram | null = null;
  private circleProgram: WebGLProgram | null = null;

  // Shared buffers ───────────────────────────────────────────────
  private dynamicVBO: WebGLBuffer | null = null;

  // Circle instancing buffers
  private quadVBO: WebGLBuffer | null = null;
  private circleCentersVBO: WebGLBuffer | null = null;
  private circleRadiiVBO: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      throw new Error('WebGLRenderer: WebGL2 context not available');
    }
    this.gl = gl;
    this._camera = new Camera(canvas.width, canvas.height);

    // Shared dynamic vertex buffer.
    this.dynamicVBO = gl.createBuffer();

    // Unit-quad for circle instancing: two triangles covering [-1,1].
    this.quadVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1, 1,   1, -1,   1, 1,
      ]),
      gl.STATIC_DRAW,
    );

    this.circleCentersVBO = gl.createBuffer();
    this.circleRadiiVBO = gl.createBuffer();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  getCamera(): Camera {
    return this._camera;
  }

  setCamera(camera: Camera): void {
    this._camera = camera;
  }

  // ── Frame management ────────────────────────────────────────────

  beginFrame(): void {
    this.resize();
  }

  endFrame(): void {
    this.gl.flush();
  }

  flush(): void {
    this.endFrame();
  }

  clear(color: [number, number, number, number] = [0.12, 0.12, 0.12, 1]): void {
    const gl = this.gl;
    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  drawGrid(settings: any, camera?: Camera): void {
    const cam = camera ?? this._camera;
    const bounds = cam.getVisibleBounds();
    const majorSpacing = Number(settings?.majorSpacing ?? 2.54);
    const minorSpacing = Number(settings?.minorSpacing ?? majorSpacing / 2);

    const drawGridLines = (spacing: number, color: [number, number, number, number], width: number): void => {
      if (!Number.isFinite(spacing) || spacing <= 0) return;
      const startX = Math.floor(bounds.minX / spacing) * spacing;
      const endX = Math.ceil(bounds.maxX / spacing) * spacing;
      const startY = Math.floor(bounds.minY / spacing) * spacing;
      const endY = Math.ceil(bounds.maxY / spacing) * spacing;

      const vertices: number[] = [];
      for (let x = startX; x <= endX; x += spacing) {
        vertices.push(x, bounds.minY, x, bounds.maxY);
      }
      for (let y = startY; y <= endY; y += spacing) {
        vertices.push(bounds.minX, y, bounds.maxX, y);
      }
      this.drawLines(new Float32Array(vertices), color, width);
    };

    drawGridLines(minorSpacing, [0.22, 0.22, 0.28, 0.35], 1);
    drawGridLines(majorSpacing, [0.36, 0.36, 0.45, 0.5], 1.2);
  }

  drawLine(
    start: { x: number; y: number },
    end: { x: number; y: number },
    width: number,
    color: { r: number; g: number; b: number; a: number },
  ): void {
    this.drawLines(
      new Float32Array([start.x, start.y, end.x, end.y]),
      [color.r, color.g, color.b, color.a],
      width,
    );
  }

  drawCircle(
    center: { x: number; y: number },
    radius: number,
    color: { r: number; g: number; b: number; a: number },
  ): void {
    this.drawCircles(
      new Float32Array([center.x, center.y]),
      new Float32Array([radius]),
      [color.r, color.g, color.b, color.a],
    );
  }

  drawRect(
    topLeft: { x: number; y: number },
    bottomRight: { x: number; y: number },
    strokeColor: { r: number; g: number; b: number; a: number },
    fillColor?: { r: number; g: number; b: number; a: number },
    lineWidth = 1,
  ): void {
    if (fillColor) {
      this.drawTriangles(
        new Float32Array([
          topLeft.x, topLeft.y,
          bottomRight.x, topLeft.y,
          topLeft.x, bottomRight.y,
          topLeft.x, bottomRight.y,
          bottomRight.x, topLeft.y,
          bottomRight.x, bottomRight.y,
        ]),
        [fillColor.r, fillColor.g, fillColor.b, fillColor.a],
      );
    }

    this.drawLines(
      new Float32Array([
        topLeft.x, topLeft.y, bottomRight.x, topLeft.y,
        bottomRight.x, topLeft.y, bottomRight.x, bottomRight.y,
        bottomRight.x, bottomRight.y, topLeft.x, bottomRight.y,
        topLeft.x, bottomRight.y, topLeft.x, topLeft.y,
      ]),
      [strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a],
      lineWidth,
    );
  }

  drawText(
    _text: string,
    _position: { x: number; y: number },
    _color: { r: number; g: number; b: number; a: number },
    _size: number,
  ): void {
    // Text rendering is intentionally a no-op in this lightweight WebGL path.
  }

  resize(): void {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      this._camera.setViewport(w, h);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // ── View-projection matrix ─────────────────────────────────────

  /**
   * Compute a combined view-projection matrix (3×3, column-major)
   * that maps world coordinates to clip space.
   */
  private getViewProjectionMatrix(): Float32Array {
    const z = this._camera.zoom;
    const pos = this._camera.position;
    const w = this._camera.viewportWidth;
    const h = this._camera.viewportHeight;

    // View: T(viewport/2) · S(zoom) · T(-position)
    // Proj:  maps [0..w, 0..h] → [-1..1]
    //
    // Combined (column-major 3×3):
    const sx = (2 * z) / w;
    const sy = (-2 * z) / h;  // flip y
    const tx = (-2 * z * pos.x) / w;
    const ty = (2 * z * pos.y) / h;

    // Column-major storage for uniform upload.
    return new Float32Array([
      sx, 0, 0,
      0, sy, 0,
      tx, ty, 1,
    ]);
  }

  // ── Program helpers ────────────────────────────────────────────

  private getBasicProgram(): WebGLProgram {
    if (!this.basicProgram) {
      this.basicProgram = createProgramFromSources(
        this.gl,
        basicVertexSource,
        solidColorFragmentSource,
      );
    }
    return this.basicProgram;
  }

  private getCircleProgram(): WebGLProgram {
    if (!this.circleProgram) {
      this.circleProgram = createProgramFromSources(
        this.gl,
        circleVertexSource,
        circleFragmentSource,
      );
    }
    return this.circleProgram;
  }

  // ── Drawing ────────────────────────────────────────────────────

  /**
   * Draw batches of line segments with uniform colour and width.
   * `vertices` is a flat array of (x,y) pairs — every two successive
   * vertices form one line segment.
   */
  drawLines(
    vertices: Float32Array,
    color: [number, number, number, number],
    lineWidth: number,
  ): void {
    const gl = this.gl;
    const prog = this.getBasicProgram();
    gl.useProgram(prog);

    // Uniforms.
    gl.uniformMatrix3fv(
      gl.getUniformLocation(prog, 'u_viewProjection'),
      false,
      this.getViewProjectionMatrix(),
    );
    gl.uniform4fv(gl.getUniformLocation(prog, 'u_color'), color);

    // Guard against exceeding implementation limits.
    const maxWidth = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) as Float32Array;
    gl.lineWidth(Math.min(lineWidth, maxWidth[1]));

    // Upload vertex data.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicVBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, vertices.length / 2);

    gl.disableVertexAttribArray(aPos);
  }

  /**
   * Draw filled triangles (for copper zones, pads, etc.).
   * `vertices` is a flat array of (x,y) pairs — every three vertices
   * form one triangle.
   */
  drawTriangles(
    vertices: Float32Array,
    color: [number, number, number, number],
  ): void {
    const gl = this.gl;
    const prog = this.getBasicProgram();
    gl.useProgram(prog);

    gl.uniformMatrix3fv(
      gl.getUniformLocation(prog, 'u_viewProjection'),
      false,
      this.getViewProjectionMatrix(),
    );
    gl.uniform4fv(gl.getUniformLocation(prog, 'u_color'), color);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicVBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);

    gl.disableVertexAttribArray(aPos);
  }

  /**
   * Draw circles as instanced quads rendered with a circle fragment
   * shader.
   *
   * @param centers  Flat array of (cx, cy) pairs.
   * @param radii    Array with one radius per circle.
   * @param color    Uniform colour.
   */
  drawCircles(
    centers: Float32Array,
    radii: Float32Array,
    color: [number, number, number, number],
  ): void {
    const gl = this.gl;
    const prog = this.getCircleProgram();
    gl.useProgram(prog);

    const instanceCount = radii.length;
    if (instanceCount === 0) return;

    gl.uniformMatrix3fv(
      gl.getUniformLocation(prog, 'u_viewProjection'),
      false,
      this.getViewProjectionMatrix(),
    );
    gl.uniform4fv(gl.getUniformLocation(prog, 'u_color'), color);

    // Bind per-vertex quad buffer.
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aPos, 0); // per-vertex

    // Bind per-instance centers.
    const aCenter = gl.getAttribLocation(prog, 'a_center');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.circleCentersVBO);
    gl.bufferData(gl.ARRAY_BUFFER, centers, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(aCenter);
    gl.vertexAttribPointer(aCenter, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aCenter, 1); // per-instance

    // Bind per-instance radii.
    const aRadius = gl.getAttribLocation(prog, 'a_radius');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.circleRadiiVBO);
    gl.bufferData(gl.ARRAY_BUFFER, radii, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(aRadius);
    gl.vertexAttribPointer(aRadius, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aRadius, 1); // per-instance

    // Draw instanced quads (6 verts per quad).
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, instanceCount);

    // Clean up divisors.
    gl.vertexAttribDivisor(aCenter, 0);
    gl.vertexAttribDivisor(aRadius, 0);
    gl.disableVertexAttribArray(aPos);
    gl.disableVertexAttribArray(aCenter);
    gl.disableVertexAttribArray(aRadius);
  }

  // ── Lifecycle ──────────────────────────────────────────────────

  destroy(): void {
    const gl = this.gl;

    if (this.basicProgram) gl.deleteProgram(this.basicProgram);
    if (this.circleProgram) gl.deleteProgram(this.circleProgram);
    if (this.dynamicVBO) gl.deleteBuffer(this.dynamicVBO);
    if (this.quadVBO) gl.deleteBuffer(this.quadVBO);
    if (this.circleCentersVBO) gl.deleteBuffer(this.circleCentersVBO);
    if (this.circleRadiiVBO) gl.deleteBuffer(this.circleRadiiVBO);

    this.basicProgram = null;
    this.circleProgram = null;
    this.dynamicVBO = null;
    this.quadVBO = null;
    this.circleCentersVBO = null;
    this.circleRadiiVBO = null;
  }
}
