import { Vector2D, Symbol } from '@opencad/core';
import { Canvas2DRenderer } from '@opencad/renderer';
/**
 * Renders schematic symbols (body, pins, labels) onto a Canvas2DRenderer.
 */
export declare class SymbolRenderer {
    private static readonly PIN_LENGTH;
    private static readonly PIN_RADIUS;
    private static readonly BODY_COLOR;
    private static readonly BODY_FILL;
    private static readonly PIN_COLOR;
    private static readonly SELECTED_COLOR;
    private static readonly LABEL_FONT;
    private static readonly REF_FONT;
    render(ctx: Canvas2DRenderer, symbol: Symbol, position: Vector2D, rotation: number, selected: boolean, mirrored?: boolean): void;
    private drawBody;
    private drawPins;
    private drawPinLabels;
    private mapPinOrientation;
}
//# sourceMappingURL=symbol-renderer.d.ts.map