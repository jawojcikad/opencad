import {
  SchematicDocument,
  Sheet,
  BBox,
  Vector2D,
  EventBus,
  CommandHistory,
  Command,
  generateId,
  SchematicComponent,
  Wire,
  NetLabel,
} from '@opencad/core';
import {
  Canvas2DRenderer,
  Camera,
  HitTester,
  snapToGrid,
} from '@opencad/renderer';
import type { GridSettings } from '@opencad/renderer';

import { SchematicTool, SelectTool } from './tools';
import { SchematicRenderer } from '../rendering/schematic-renderer';
import {
  DeleteComponentCommand,
  DeleteWireCommand,
} from './commands';

export class SchematicEditor {
  private document: SchematicDocument;
  private activeSheet: Sheet;
  private renderer: Canvas2DRenderer;
  private camera: Camera;
  private eventBus: EventBus;
  private commandHistory: CommandHistory;
  private hitTester: HitTester;
  private activeTool: SchematicTool | null;
  private selection: Set<string>;
  private schematicRenderer: SchematicRenderer;
  private animFrameId: number | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Canvas2DRenderer(canvas);
    this.camera = this.renderer.getCamera();
    this.eventBus = new EventBus();
    this.commandHistory = new CommandHistory();
    this.hitTester = new HitTester();
    this.selection = new Set<string>();
    this.schematicRenderer = new SchematicRenderer();
    this.activeTool = null;

    // Initialise with a blank document
    this.document = {
      id: generateId(),
      title: 'Untitled',
      sheets: [],
    };
    this.addSheet('Sheet1');
    this.activeSheet = this.document.sheets[0];

    // Attach DOM event listeners
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));

    // Default tool
    this.setTool(new SelectTool());
  }

  resize(_width: number, _height: number): void {
    this.camera.setViewport(this.canvas.width, this.canvas.height);
  }

  // ── Document management ──────────────────────────────────────────────────

  newDocument(): void {
    this.commandHistory = new CommandHistory();
    this.selection.clear();
    this.document = {
      id: generateId(),
      title: 'Untitled',
      sheets: [],
    };
    this.addSheet('Sheet1');
    this.activeSheet = this.document.sheets[0];
    this.eventBus.emit('document:new', this.document);
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getDocument(): SchematicDocument {
    return this.document;
  }

  getActiveSheet(): Sheet {
    return this.activeSheet;
  }

  /**
   * Replace the current document with an externally-loaded one
   * (e.g. from a sample project or KiCad import).
   */
  loadDocument(doc: SchematicDocument): void {
    if (!doc) {
      throw new Error('Cannot load a null or undefined document');
    }

    this.document = {
      ...doc,
      sheets: doc.sheets ?? [],
    };

    // Reset editor state
    this.selection.clear();
    this.commandHistory = new CommandHistory();

    // Activate the first sheet, or create a blank one if the doc has none
    if (this.document.sheets.length === 0) {
      this.addSheet('Sheet1');
    }
    this.activeSheet = this.document.sheets[0];

    this.eventBus.emit('document:loaded', this.document);

    this.fitViewToActiveSheet();

    // Kick off rendering so the loaded content is visible immediately
    this.render();
  }

  private fitViewToActiveSheet(): void {
    const points: Vector2D[] = [];
    const toPoint = (value: any): Vector2D | null => {
      if (!value) return null;
      if (value instanceof Vector2D) return value;
      if (typeof value.x === 'number' && typeof value.y === 'number') {
        return new Vector2D(value.x, value.y);
      }
      return null;
    };

    for (const wire of this.activeSheet.wires ?? []) {
      const anyWire = wire as any;
      if (Array.isArray(anyWire.points)) {
        for (const point of anyWire.points) {
          const parsed = toPoint(point);
          if (parsed) points.push(parsed);
        }
      } else {
        const start = toPoint(anyWire.start);
        const end = toPoint(anyWire.end);
        if (start) points.push(start);
        if (end) points.push(end);
      }
    }

    for (const comp of this.activeSheet.components ?? []) {
      const parsed = toPoint((comp as any).position);
      if (parsed) points.push(parsed);
    }

    for (const label of this.activeSheet.netLabels ?? []) {
      const parsed = toPoint((label as any).position);
      if (parsed) points.push(parsed);
    }

    if (points.length === 0) return;

    let bounds = BBox.fromPoints(points);
    if (bounds.width < 1e-6 || bounds.height < 1e-6) {
      bounds = bounds.expand(20);
    }

    this.camera.zoomToFit(bounds, 0.15);
  }

  setActiveSheet(sheetIndex: number): void {
    if (sheetIndex < 0 || sheetIndex >= this.document.sheets.length) {
      throw new RangeError(`Sheet index ${sheetIndex} out of range`);
    }
    this.activeSheet = this.document.sheets[sheetIndex];
    this.selection.clear();
    this.eventBus.emit('sheet:changed', this.activeSheet);
  }

  addSheet(name?: string): Sheet {
    const sheet: Sheet = {
      id: generateId(),
      name: name ?? `Sheet${this.document.sheets.length + 1}`,
      components: [],
      wires: [],
      netLabels: [],
      powerPorts: [],
      junctions: [],
    };
    this.document.sheets.push(sheet);
    this.eventBus.emit('sheet:added', sheet);
    return sheet;
  }

  removeSheet(index: number): void {
    if (this.document.sheets.length <= 1) {
      throw new Error('Cannot remove the last sheet');
    }
    if (index < 0 || index >= this.document.sheets.length) {
      throw new RangeError(`Sheet index ${index} out of range`);
    }
    const removed = this.document.sheets.splice(index, 1)[0];
    if (this.activeSheet === removed) {
      this.activeSheet =
        this.document.sheets[Math.min(index, this.document.sheets.length - 1)];
    }
    this.selection.clear();
    this.eventBus.emit('sheet:removed', removed);
  }

  // ── Tool management ──────────────────────────────────────────────────────

  setTool(tool: SchematicTool): void {
    if (this.activeTool) {
      this.activeTool.onDeactivate();
    }
    this.activeTool = tool;
    this.activeTool.onActivate(this);
    this.canvas.style.cursor = tool.cursor;
    this.eventBus.emit('tool:changed', tool.name);
  }

  getActiveTool(): SchematicTool | null {
    return this.activeTool;
  }

  // ── Selection ────────────────────────────────────────────────────────────

  getSelection(): ReadonlySet<string> {
    return this.selection;
  }

  select(ids: string[]): void {
    for (const id of ids) {
      this.selection.add(id);
    }
    this.eventBus.emit('selection:changed', this.selection);
  }

  deselect(ids: string[]): void {
    for (const id of ids) {
      this.selection.delete(id);
    }
    this.eventBus.emit('selection:changed', this.selection);
  }

  clearSelection(): void {
    this.selection.clear();
    this.eventBus.emit('selection:changed', this.selection);
  }

  selectAll(): void {
    for (const comp of this.activeSheet.components ?? []) {
      this.selection.add(comp.id);
    }
    for (const wire of this.activeSheet.wires ?? []) {
      this.selection.add(wire.id);
    }
    for (const label of this.activeSheet.netLabels ?? []) {
      this.selection.add(label.id);
    }
    this.eventBus.emit('selection:changed', this.selection);
  }

  deleteSelection(): void {
    if (this.selection.size === 0) return;

    const ids = Array.from(this.selection);

    // Separate IDs by type
    const compIds: string[] = [];
    const wireIds: string[] = [];
    const labelIds: string[] = [];
    const sheet = this.activeSheet;

    const compIdSet = new Set(
      (sheet.components ?? []).map((c: SchematicComponent) => c.id)
    );
    const wireIdSet = new Set(
      (sheet.wires ?? []).map((w: Wire) => w.id)
    );
    const labelIdSet = new Set(
      (sheet.netLabels ?? []).map((l: NetLabel) => l.id)
    );

    for (const id of ids) {
      if (compIdSet.has(id)) compIds.push(id);
      else if (wireIdSet.has(id)) wireIds.push(id);
      else if (labelIdSet.has(id)) labelIds.push(id);
    }

    // Execute delete commands
    if (compIds.length > 0) {
      this.executeCommand(new DeleteComponentCommand(sheet, compIds));
    }
    if (wireIds.length > 0) {
      this.executeCommand(new DeleteWireCommand(sheet, wireIds));
    }
    // Net labels deleted same way as components (they're stored in netLabels array)
    if (labelIds.length > 0) {
      // Remove net labels inline – they don't have a dedicated delete command
      const removed = (sheet.netLabels ?? []).filter((l: NetLabel) =>
        labelIds.includes(l.id)
      );
      sheet.netLabels = (sheet.netLabels ?? []).filter(
        (l: NetLabel) => !labelIds.includes(l.id)
      );
      // We won't push a separate command here; the caller can extend if needed.
    }

    this.clearSelection();
  }

  // ── Command execution ────────────────────────────────────────────────────

  executeCommand(cmd: Command): void {
    this.commandHistory.execute(cmd);
    this.eventBus.emit('command:executed', cmd);
  }

  undo(): void {
    this.commandHistory.undo();
    this.eventBus.emit('command:undo', null);
  }

  redo(): void {
    this.commandHistory.redo();
    this.eventBus.emit('command:redo', null);
  }

  // ── Hit testing ──────────────────────────────────────────────────────────

  hitTest(worldPos: Vector2D): string | null {
    const sheet = this.activeSheet;
    const hitRadius = 8 / this.camera.zoom;

    // Test components
    for (const comp of sheet.components ?? []) {
      const dx = worldPos.x - comp.position.x;
      const dy = worldPos.y - comp.position.y;
      // Simple bounding-box hit test (assume ~40x30 symbol)
      const halfW = 35;
      const halfH = 25;
      if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) {
        return comp.id;
      }
    }

    // Test wires
    for (const wire of sheet.wires ?? []) {
      for (let i = 0; i < wire.points.length - 1; i++) {
        const a = wire.points[i];
        const b = wire.points[i + 1];
        const dist = this.pointToSegmentDist(worldPos, a, b);
        if (dist <= hitRadius) {
          return wire.id;
        }
      }
    }

    // Test net labels
    for (const label of sheet.netLabels ?? []) {
      const dx = worldPos.x - label.position.x;
      const dy = worldPos.y - label.position.y;
      if (dx >= -2 && dx <= 60 && Math.abs(dy) <= 12) {
        return label.id;
      }
    }

    return null;
  }

  private pointToSegmentDist(
    p: Vector2D,
    a: Vector2D,
    b: Vector2D
  ): number {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const abLenSq = abx * abx + aby * aby;

    if (abLenSq === 0) {
      return Math.hypot(apx, apy);
    }

    let t = (apx * abx + apy * aby) / abLenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = a.x + t * abx;
    const projY = a.y + t * aby;
    return Math.hypot(p.x - projX, p.y - projY);
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  render(): void {
    this.renderer.beginFrame();

    // Render the active sheet
    this.schematicRenderer.renderSheet(
      this.renderer,
      this.activeSheet,
      this.selection
    );

    // Render active tool preview
    if (this.activeTool) {
      this.activeTool.renderPreview(this.renderer);
    }

    this.renderer.endFrame();
  }

  startRenderLoop(): void {
    const loop = (): void => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  // ── Mouse/keyboard events ────────────────────────────────────────────────

  onMouseDown(e: MouseEvent): void {
    const worldPos = this.screenToWorld(new Vector2D(e.offsetX, e.offsetY));
    if (this.activeTool) {
      this.activeTool.onMouseDown(worldPos, e);
    }
  }

  onMouseMove(e: MouseEvent): void {
    const worldPos = this.screenToWorld(new Vector2D(e.offsetX, e.offsetY));
    if (this.activeTool) {
      this.activeTool.onMouseMove(worldPos, e);
    }
  }

  onMouseUp(e: MouseEvent): void {
    const worldPos = this.screenToWorld(new Vector2D(e.offsetX, e.offsetY));
    if (this.activeTool) {
      this.activeTool.onMouseUp(worldPos, e);
    }
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const screenPos = new Vector2D(e.offsetX, e.offsetY);
    this.camera.zoomAt(screenPos, zoomFactor);
  }

  onKeyDown(e: KeyboardEvent): void {
    // Global shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      this.redo();
      return;
    }

    if (this.activeTool) {
      this.activeTool.onKeyDown(e);
    }
  }

  // ── Coordinate conversion ────────────────────────────────────────────────

  screenToWorld(screenPoint: Vector2D): Vector2D {
    return this.camera.screenToWorld(screenPoint);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  destroy(): void {
    this.stopRenderLoop();
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);

    if (this.activeTool) {
      this.activeTool.onDeactivate();
      this.activeTool = null;
    }

    this.selection.clear();
    this.eventBus.emit('editor:destroyed', null);
  }
}
