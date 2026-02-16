import { Vector2D, Symbol, Pin, PinType } from '@opencad/core';
import { Canvas2DRenderer } from '@opencad/renderer';

/**
 * Renders schematic symbols (body, pins, labels) onto a Canvas2DRenderer.
 */
export class SymbolRenderer {
  private static readonly PIN_LENGTH = 20;
  private static readonly PIN_RADIUS = 3;
  private static readonly BODY_COLOR = '#333333';
  private static readonly BODY_FILL = '#fffff0';
  private static readonly PIN_COLOR = '#cc0000';
  private static readonly SELECTED_COLOR = '#0088ff';
  private static readonly LABEL_FONT = '11px monospace';
  private static readonly REF_FONT = 'bold 12px monospace';

  render(
    ctx: Canvas2DRenderer,
    symbol: Symbol,
    position: Vector2D,
    rotation: number,
    selected: boolean,
    mirrored: boolean = false
  ): void {
    const g = ctx.getContext();
    g.save();

    g.translate(position.x, position.y);
    g.rotate((rotation * Math.PI) / 180);
    if (mirrored) {
      g.scale(-1, 1);
    }

    this.drawBody(ctx, symbol, new Vector2D(0, 0), rotation, selected);
    this.drawPins(ctx, symbol.pins ?? [], new Vector2D(0, 0), rotation, selected);

    g.restore();
  }

  // ── Body ───────────────────────────────────────────────────────────────────

  private drawBody(
    ctx: Canvas2DRenderer,
    symbol: Symbol,
    _position: Vector2D,
    _rotation: number,
    selected: boolean
  ): void {
    const g = ctx.getContext();
    const strokeColor = selected
      ? SymbolRenderer.SELECTED_COLOR
      : SymbolRenderer.BODY_COLOR;

    const legacyGraphics = (symbol as any).graphics as any[] | undefined;

    if (legacyGraphics && legacyGraphics.length > 0) {
      for (const graphic of legacyGraphics) {
        g.strokeStyle = strokeColor;
        g.lineWidth = selected ? 2.5 : 2;

        switch (graphic.type) {
          case 'rect': {
            g.fillStyle = SymbolRenderer.BODY_FILL;
            g.fillRect(graphic.x, graphic.y, graphic.width, graphic.height);
            g.strokeRect(graphic.x, graphic.y, graphic.width, graphic.height);
            break;
          }
          case 'circle': {
            g.fillStyle = SymbolRenderer.BODY_FILL;
            g.beginPath();
            g.arc(graphic.cx, graphic.cy, graphic.radius, 0, Math.PI * 2);
            g.fill();
            g.stroke();
            break;
          }
          case 'ellipse': {
            g.fillStyle = SymbolRenderer.BODY_FILL;
            g.beginPath();
            g.ellipse(
              graphic.cx,
              graphic.cy,
              graphic.rx,
              graphic.ry,
              0,
              0,
              Math.PI * 2
            );
            g.fill();
            g.stroke();
            break;
          }
          case 'line': {
            if (graphic.points && graphic.points.length >= 2) {
              g.beginPath();
              g.moveTo(graphic.points[0].x, graphic.points[0].y);
              for (let i = 1; i < graphic.points.length; i++) {
                g.lineTo(graphic.points[i].x, graphic.points[i].y);
              }
              g.stroke();
            }
            break;
          }
          case 'polygon': {
            if (graphic.points && graphic.points.length >= 3) {
              g.fillStyle = graphic.fill ?? SymbolRenderer.BODY_FILL;
              g.beginPath();
              g.moveTo(graphic.points[0].x, graphic.points[0].y);
              for (let i = 1; i < graphic.points.length; i++) {
                g.lineTo(graphic.points[i].x, graphic.points[i].y);
              }
              g.closePath();
              g.fill();
              g.stroke();
            }
            break;
          }
          case 'arc': {
            g.beginPath();
            g.arc(
              graphic.cx,
              graphic.cy,
              graphic.radius,
              graphic.startAngle ?? 0,
              graphic.endAngle ?? Math.PI * 2
            );
            g.stroke();
            break;
          }
          case 'text': {
            g.fillStyle = strokeColor;
            g.font = graphic.font ?? SymbolRenderer.LABEL_FONT;
            g.textBaseline = 'middle';
            g.textAlign = graphic.align ?? 'center';
            g.fillText(graphic.text, graphic.x ?? 0, graphic.y ?? 0);
            break;
          }
          default:
            break;
        }
      }
    } else if (
      (symbol.lines && symbol.lines.length > 0) ||
      (symbol.rectangles && symbol.rectangles.length > 0) ||
      (symbol.circles && symbol.circles.length > 0) ||
      (symbol.texts && symbol.texts.length > 0)
    ) {
      g.strokeStyle = strokeColor;
      g.lineWidth = selected ? 2.5 : 2;

      for (const line of symbol.lines ?? []) {
        g.beginPath();
        g.moveTo(line.start.x, line.start.y);
        g.lineTo(line.end.x, line.end.y);
        g.stroke();
      }

      for (const rect of symbol.rectangles ?? []) {
        const x = rect.topLeft.x;
        const y = rect.topLeft.y;
        const w = rect.bottomRight.x - rect.topLeft.x;
        const h = rect.bottomRight.y - rect.topLeft.y;
        if (rect.filled) {
          g.fillStyle = SymbolRenderer.BODY_FILL;
          g.fillRect(x, y, w, h);
        }
        g.strokeRect(x, y, w, h);
      }

      for (const circle of symbol.circles ?? []) {
        g.beginPath();
        g.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
        if (circle.filled) {
          g.fillStyle = SymbolRenderer.BODY_FILL;
          g.fill();
        }
        g.stroke();
      }

      for (const text of symbol.texts ?? []) {
        if (text.visible === false) continue;
        g.fillStyle = strokeColor;
        g.font = `${text.fontSize ?? 11}px monospace`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(text.text, text.position.x, text.position.y);
      }
    } else {
      // Fallback: draw a generic IC body rectangle
      const halfW = 30;
      const halfH = Math.max(20, ((symbol.pins?.length ?? 2) / 2) * 12);
      g.fillStyle = SymbolRenderer.BODY_FILL;
      g.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);
      g.strokeStyle = strokeColor;
      g.lineWidth = selected ? 2.5 : 2;
      g.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);

      // Draw reference designator text
      if (symbol.name) {
        g.fillStyle = strokeColor;
        g.font = SymbolRenderer.REF_FONT;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(symbol.name, 0, 0);
      }
    }
  }

  // ── Pins ───────────────────────────────────────────────────────────────────

  private drawPins(
    ctx: Canvas2DRenderer,
    pins: Pin[],
    _position: Vector2D,
    _rotation: number,
    selected: boolean
  ): void {
    const g = ctx.getContext();

    for (const pin of pins) {
      const px = pin.position.x;
      const py = pin.position.y;

      // Determine pin line direction from orientation
      const pinLen = pin.length ?? SymbolRenderer.PIN_LENGTH;
      let endX = px;
      let endY = py;

      const orientation = this.mapPinOrientation(pin.orientation as any);
      switch (orientation) {
        case 'left':
          endX = px - pinLen;
          break;
        case 'right':
          endX = px + pinLen;
          break;
        case 'up':
          endY = py - pinLen;
          break;
        case 'down':
          endY = py + pinLen;
          break;
      }

      // Pin line
      g.strokeStyle = selected
        ? SymbolRenderer.SELECTED_COLOR
        : SymbolRenderer.PIN_COLOR;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(endX, endY);
      g.stroke();

      // Pin endpoint circle
      g.fillStyle = selected
        ? SymbolRenderer.SELECTED_COLOR
        : SymbolRenderer.PIN_COLOR;
      g.beginPath();
      g.arc(endX, endY, SymbolRenderer.PIN_RADIUS, 0, Math.PI * 2);
      g.fill();

      // Pin labels
      this.drawPinLabels(ctx, pin, new Vector2D(px, py), selected);
    }
  }

  private drawPinLabels(
    ctx: Canvas2DRenderer,
    pin: Pin,
    position: Vector2D,
    selected: boolean
  ): void {
    const g = ctx.getContext();
    const orientation = this.mapPinOrientation(pin.orientation as any);
    const nameOffset = 5;

    g.font = SymbolRenderer.LABEL_FONT;
    g.fillStyle = selected ? SymbolRenderer.SELECTED_COLOR : '#333';
    g.textBaseline = 'middle';

    // Pin name (inside the body)
    if (pin.name && pin.name !== '~') {
      switch (orientation) {
        case 'left':
          g.textAlign = 'left';
          g.fillText(pin.name, position.x + nameOffset, position.y);
          break;
        case 'right':
          g.textAlign = 'right';
          g.fillText(pin.name, position.x - nameOffset, position.y);
          break;
        case 'up':
          g.save();
          g.translate(position.x, position.y + nameOffset);
          g.rotate(-Math.PI / 2);
          g.textAlign = 'right';
          g.fillText(pin.name, 0, 0);
          g.restore();
          break;
        case 'down':
          g.save();
          g.translate(position.x, position.y - nameOffset);
          g.rotate(-Math.PI / 2);
          g.textAlign = 'left';
          g.fillText(pin.name, 0, 0);
          g.restore();
          break;
      }
    }

    // Pin number (outside the body, near the endpoint)
    if (pin.number) {
      g.font = '9px monospace';
      g.fillStyle = selected ? '#66aaff' : '#888';
      const pinLen = pin.length ?? SymbolRenderer.PIN_LENGTH;

      switch (orientation) {
        case 'left':
          g.textAlign = 'right';
          g.fillText(
            pin.number,
            position.x - pinLen + 2,
            position.y - 8
          );
          break;
        case 'right':
          g.textAlign = 'left';
          g.fillText(
            pin.number,
            position.x + pinLen - 2,
            position.y - 8
          );
          break;
        case 'up':
          g.textAlign = 'left';
          g.fillText(
            pin.number,
            position.x + 4,
            position.y - pinLen + 2
          );
          break;
        case 'down':
          g.textAlign = 'left';
          g.fillText(
            pin.number,
            position.x + 4,
            position.y + pinLen - 2
          );
          break;
      }
    }
  }

  private mapPinOrientation(orientation: unknown): 'left' | 'right' | 'up' | 'down' {
    if (typeof orientation === 'string') {
      if (orientation === 'left' || orientation === 'right' || orientation === 'up' || orientation === 'down') {
        return orientation;
      }
    }

    if (typeof orientation === 'number') {
      const normalized = ((orientation % 360) + 360) % 360;
      if (normalized === 0) return 'right';
      if (normalized === 90) return 'up';
      if (normalized === 180) return 'left';
      if (normalized === 270) return 'down';
    }

    return 'left';
  }
}
