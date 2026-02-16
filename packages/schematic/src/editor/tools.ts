import {
  Vector2D,
  Wire,
  SchematicComponent,
  NetLabel,
  generateId,
} from '@opencad/core';
import { Canvas2DRenderer, snapToGrid } from '@opencad/renderer';

import type { SchematicEditor } from './schematic-editor';
import {
  PlaceComponentCommand,
  MoveComponentCommand,
  DrawWireCommand,
  PlaceNetLabelCommand,
  RotateComponentCommand,
} from './commands';

// ─── Tool Interface ─────────────────────────────────────────────────────────

export interface SchematicTool {
  name: string;
  cursor: string;
  onActivate(editor: SchematicEditor): void;
  onDeactivate(): void;
  onMouseDown(worldPos: Vector2D, e: MouseEvent): void;
  onMouseMove(worldPos: Vector2D, e: MouseEvent): void;
  onMouseUp(worldPos: Vector2D, e: MouseEvent): void;
  onKeyDown(e: KeyboardEvent): void;
  renderPreview(renderer: Canvas2DRenderer): void;
}

// ─── SelectTool ──────────────────────────────────────────────────────────────

export class SelectTool implements SchematicTool {
  public readonly name = 'select';
  public readonly cursor = 'default';

  private editor: SchematicEditor | null = null;
  private isDragging = false;
  private isBoxSelecting = false;
  private isMoving = false;
  private dragStart: Vector2D = { x: 0, y: 0 };
  private dragCurrent: Vector2D = { x: 0, y: 0 };
  private moveStart: Vector2D = { x: 0, y: 0 };
  private clickedOnSelected = false;

  onActivate(editor: SchematicEditor): void {
    this.editor = editor;
  }

  onDeactivate(): void {
    this.isDragging = false;
    this.isBoxSelecting = false;
    this.isMoving = false;
    this.editor = null;
  }

  onMouseDown(worldPos: Vector2D, e: MouseEvent): void {
    if (!this.editor) return;

    const snapped = snapToGrid(worldPos, 10);
    this.dragStart = snapped;
    this.dragCurrent = snapped;
    this.isDragging = true;

    const hitId = this.editor.hitTest(worldPos);

    if (hitId) {
      const selection = this.editor.getSelection();
      if (e.shiftKey) {
        if (selection.has(hitId)) {
          this.editor.deselect([hitId]);
        } else {
          this.editor.select([hitId]);
        }
        this.clickedOnSelected = false;
      } else {
        if (!selection.has(hitId)) {
          this.editor.clearSelection();
          this.editor.select([hitId]);
        }
        this.clickedOnSelected = true;
        this.moveStart = snapped;
        this.isMoving = true;
      }
    } else {
      if (!e.shiftKey) {
        this.editor.clearSelection();
      }
      this.isBoxSelecting = true;
    }
  }

  onMouseMove(worldPos: Vector2D, _e: MouseEvent): void {
    if (!this.editor || !this.isDragging) return;

    const snapped = snapToGrid(worldPos, 10);
    this.dragCurrent = snapped;
  }

  onMouseUp(worldPos: Vector2D, _e: MouseEvent): void {
    if (!this.editor) return;

    const snapped = snapToGrid(worldPos, 10);

    if (this.isMoving) {
      const dx = snapped.x - this.moveStart.x;
      const dy = snapped.y - this.moveStart.y;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        const ids = Array.from(this.editor.getSelection());
        if (ids.length > 0) {
          const cmd = new MoveComponentCommand(
            this.editor.getActiveSheet(),
            ids,
            { x: dx, y: dy }
          );
          this.editor.executeCommand(cmd);
        }
      }
    }

    if (this.isBoxSelecting) {
      const minX = Math.min(this.dragStart.x, snapped.x);
      const minY = Math.min(this.dragStart.y, snapped.y);
      const maxX = Math.max(this.dragStart.x, snapped.x);
      const maxY = Math.max(this.dragStart.y, snapped.y);

      if (maxX - minX > 1 || maxY - minY > 1) {
        const sheet = this.editor.getActiveSheet();
        const ids: string[] = [];

        for (const comp of sheet.components ?? []) {
          if (
            comp.position.x >= minX &&
            comp.position.x <= maxX &&
            comp.position.y >= minY &&
            comp.position.y <= maxY
          ) {
            ids.push(comp.id);
          }
        }

        for (const wire of sheet.wires ?? []) {
          const allInside = wire.points.every(
            (p: Vector2D) =>
              p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
          );
          if (allInside) {
            ids.push(wire.id);
          }
        }

        for (const label of sheet.netLabels ?? []) {
          if (
            label.position.x >= minX &&
            label.position.x <= maxX &&
            label.position.y >= minY &&
            label.position.y <= maxY
          ) {
            ids.push(label.id);
          }
        }

        if (ids.length > 0) {
          this.editor.select(ids);
        }
      }
    }

    this.isDragging = false;
    this.isBoxSelecting = false;
    this.isMoving = false;
    this.clickedOnSelected = false;
  }

  onKeyDown(e: KeyboardEvent): void {
    if (!this.editor) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.editor.deleteSelection();
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.editor.selectAll();
    } else if (e.key === 'Escape') {
      this.editor.clearSelection();
    }
  }

  renderPreview(renderer: Canvas2DRenderer): void {
    if (!this.isBoxSelecting || !this.isDragging) return;

    const ctx = renderer.getContext();
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)';
    ctx.fillStyle = 'rgba(0, 120, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const x = Math.min(this.dragStart.x, this.dragCurrent.x);
    const y = Math.min(this.dragStart.y, this.dragCurrent.y);
    const w = Math.abs(this.dragCurrent.x - this.dragStart.x);
    const h = Math.abs(this.dragCurrent.y - this.dragStart.y);

    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}

// ─── WireTool ────────────────────────────────────────────────────────────────

export class WireTool implements SchematicTool {
  public readonly name = 'wire';
  public readonly cursor = 'crosshair';

  private editor: SchematicEditor | null = null;
  private isDrawing = false;
  private points: Vector2D[] = [];
  private currentPos: Vector2D = { x: 0, y: 0 };
  private routingMode: 'h-first' | 'v-first' = 'h-first';

  onActivate(editor: SchematicEditor): void {
    this.editor = editor;
    this.reset();
  }

  onDeactivate(): void {
    this.reset();
    this.editor = null;
  }

  onMouseDown(worldPos: Vector2D, e: MouseEvent): void {
    if (!this.editor) return;

    const snapped = snapToGrid(worldPos, 10);

    if (!this.isDrawing) {
      // Start new wire
      this.isDrawing = true;
      this.points = [snapped];
      this.currentPos = snapped;
    } else {
      // Check for double-click to finish
      if (e.detail >= 2) {
        this.finishWire(snapped);
        return;
      }
      // Add 90-degree routed bend points
      const lastPoint = this.points[this.points.length - 1];
      const bends = this.computeRoutedSegment(lastPoint, snapped);
      for (const bp of bends) {
        this.points.push(bp);
      }
      this.points.push(snapped);
    }
  }

  onMouseMove(worldPos: Vector2D, _e: MouseEvent): void {
    if (!this.editor) return;
    this.currentPos = snapToGrid(worldPos, 10);
  }

  onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void {
    // Wire placement is click-based, not drag-based
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.isDrawing && this.points.length >= 2) {
        this.finishWire(this.points[this.points.length - 1]);
      } else {
        this.reset();
      }
    } else if (e.key === '/' || e.key === 'Tab') {
      // Toggle routing mode
      this.routingMode =
        this.routingMode === 'h-first' ? 'v-first' : 'h-first';
    }
  }

  renderPreview(renderer: Canvas2DRenderer): void {
    if (!this.isDrawing || this.points.length === 0) return;

    const ctx = renderer.getContext();
    ctx.save();
    ctx.strokeStyle = '#00cc44';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Draw committed segments
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    // Draw preview segment with 90-degree routing
    const lastPoint = this.points[this.points.length - 1];
    const bends = this.computeRoutedSegment(lastPoint, this.currentPos);
    for (const bp of bends) {
      ctx.lineTo(bp.x, bp.y);
    }
    ctx.lineTo(this.currentPos.x, this.currentPos.y);
    ctx.stroke();

    // Draw small circles at each point
    ctx.fillStyle = '#00cc44';
    for (const p of this.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private computeRoutedSegment(from: Vector2D, to: Vector2D): Vector2D[] {
    if (from.x === to.x || from.y === to.y) {
      return []; // Already aligned - straight line
    }

    if (this.routingMode === 'h-first') {
      return [{ x: to.x, y: from.y }];
    } else {
      return [{ x: from.x, y: to.y }];
    }
  }

  private finishWire(lastPos: Vector2D): void {
    if (!this.editor) return;

    // Add final routed segment if needed
    const lastPoint = this.points[this.points.length - 1];
    if (lastPoint.x !== lastPos.x || lastPoint.y !== lastPos.y) {
      const bends = this.computeRoutedSegment(lastPoint, lastPos);
      for (const bp of bends) {
        this.points.push(bp);
      }
      this.points.push(lastPos);
    }

    // Remove duplicate consecutive points
    const cleaned: Vector2D[] = [this.points[0]];
    for (let i = 1; i < this.points.length; i++) {
      const prev = cleaned[cleaned.length - 1];
      const cur = this.points[i];
      if (prev.x !== cur.x || prev.y !== cur.y) {
        cleaned.push(cur);
      }
    }

    if (cleaned.length >= 2) {
      const wire: Wire = {
        id: generateId(),
        points: cleaned,
        netName: '',
      };

      const cmd = new DrawWireCommand(this.editor.getActiveSheet(), wire);
      this.editor.executeCommand(cmd);
    }

    this.reset();
  }

  private reset(): void {
    this.isDrawing = false;
    this.points = [];
    this.currentPos = { x: 0, y: 0 };
  }
}

// ─── PlaceComponentTool ──────────────────────────────────────────────────────

export class PlaceComponentTool implements SchematicTool {
  public readonly name = 'place-component';
  public readonly cursor = 'crosshair';

  private editor: SchematicEditor | null = null;
  private template: SchematicComponent | null = null;
  private currentPos: Vector2D = { x: 0, y: 0 };
  private rotation: number = 0;

  constructor(template?: SchematicComponent) {
    this.template = template ?? null;
  }

  setTemplate(template: SchematicComponent): void {
    this.template = template;
  }

  onActivate(editor: SchematicEditor): void {
    this.editor = editor;
    this.rotation = 0;
  }

  onDeactivate(): void {
    this.editor = null;
    this.rotation = 0;
  }

  onMouseDown(worldPos: Vector2D, _e: MouseEvent): void {
    if (!this.editor || !this.template) return;

    const snapped = snapToGrid(worldPos, 10);
    const comp: SchematicComponent = {
      ...structuredClone(this.template),
      id: generateId(),
      position: { x: snapped.x, y: snapped.y },
      rotation: this.rotation,
    };

    const cmd = new PlaceComponentCommand(this.editor.getActiveSheet(), comp);
    this.editor.executeCommand(cmd);
  }

  onMouseMove(worldPos: Vector2D, _e: MouseEvent): void {
    this.currentPos = snapToGrid(worldPos, 10);
  }

  onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void {
    // Placement happens on mouse-down
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'r' || e.key === 'R') {
      this.rotation = (this.rotation + 90) % 360;
    } else if (e.key === 'Escape') {
      if (this.editor) {
        this.editor.setTool(new SelectTool());
      }
    }
  }

  renderPreview(renderer: Canvas2DRenderer): void {
    if (!this.template) return;

    const ctx = renderer.getContext();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(this.currentPos.x, this.currentPos.y);
    ctx.rotate((this.rotation * Math.PI) / 180);

    // Draw ghost body outline
    const symbol = this.template.symbol;
    if (symbol && symbol.graphics) {
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 2;
      for (const graphic of symbol.graphics) {
        if (graphic.type === 'rect') {
          ctx.strokeRect(graphic.x, graphic.y, graphic.width, graphic.height);
        } else if (graphic.type === 'circle') {
          ctx.beginPath();
          ctx.arc(graphic.cx, graphic.cy, graphic.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (graphic.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(graphic.points[0].x, graphic.points[0].y);
          for (let i = 1; i < graphic.points.length; i++) {
            ctx.lineTo(graphic.points[i].x, graphic.points[i].y);
          }
          ctx.stroke();
        }
      }
    } else {
      // Fallback: draw a generic rectangle
      ctx.strokeStyle = '#4488ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-30, -20, 60, 40);
    }

    // Draw pin markers
    if (symbol && symbol.pins) {
      ctx.fillStyle = '#ff4444';
      for (const pin of symbol.pins) {
        ctx.beginPath();
        ctx.arc(pin.position.x, pin.position.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ─── PlaceNetLabelTool ───────────────────────────────────────────────────────

export class PlaceNetLabelTool implements SchematicTool {
  public readonly name = 'place-net-label';
  public readonly cursor = 'crosshair';

  private editor: SchematicEditor | null = null;
  private netName: string;
  private currentPos: Vector2D = { x: 0, y: 0 };

  constructor(netName: string = 'NET') {
    this.netName = netName;
  }

  setNetName(name: string): void {
    this.netName = name;
  }

  onActivate(editor: SchematicEditor): void {
    this.editor = editor;
  }

  onDeactivate(): void {
    this.editor = null;
  }

  onMouseDown(worldPos: Vector2D, _e: MouseEvent): void {
    if (!this.editor) return;

    const snapped = snapToGrid(worldPos, 10);
    const label: NetLabel = {
      id: generateId(),
      name: this.netName,
      position: { x: snapped.x, y: snapped.y },
      rotation: 0,
    };

    const cmd = new PlaceNetLabelCommand(this.editor.getActiveSheet(), label);
    this.editor.executeCommand(cmd);
  }

  onMouseMove(worldPos: Vector2D, _e: MouseEvent): void {
    this.currentPos = snapToGrid(worldPos, 10);
  }

  onMouseUp(_worldPos: Vector2D, _e: MouseEvent): void {
    // Placement happens on mouse-down
  }

  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.editor) {
        this.editor.setTool(new SelectTool());
      }
    }
  }

  renderPreview(renderer: Canvas2DRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.globalAlpha = 0.5;

    // Draw net label ghost
    ctx.fillStyle = '#00aa88';
    ctx.font = '14px monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.netName, this.currentPos.x, this.currentPos.y - 2);

    // Draw marker line
    ctx.strokeStyle = '#00aa88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const textWidth = ctx.measureText(this.netName).width;
    ctx.moveTo(this.currentPos.x, this.currentPos.y);
    ctx.lineTo(this.currentPos.x + textWidth, this.currentPos.y);
    ctx.stroke();

    // Draw connection dot
    ctx.fillStyle = '#00aa88';
    ctx.beginPath();
    ctx.arc(this.currentPos.x, this.currentPos.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
