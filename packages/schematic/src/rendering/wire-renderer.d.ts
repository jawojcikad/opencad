import { Wire, Junction, NetLabel, PowerPort } from '@opencad/core';
import { Canvas2DRenderer } from '@opencad/renderer';
/**
 * Renders wires, junctions, net labels, and power ports on a schematic sheet.
 */
export declare class WireRenderer {
    private static readonly WIRE_COLOR;
    private static readonly WIRE_SELECTED_COLOR;
    private static readonly WIRE_WIDTH;
    private static readonly JUNCTION_RADIUS;
    private static readonly JUNCTION_COLOR;
    private static readonly LABEL_COLOR;
    private static readonly LABEL_SELECTED_COLOR;
    private static readonly POWER_COLOR;
    renderWire(ctx: Canvas2DRenderer, wire: Wire, selected: boolean): void;
    renderJunction(ctx: Canvas2DRenderer, junction: Junction): void;
    renderNetLabel(ctx: Canvas2DRenderer, label: NetLabel, selected: boolean): void;
    renderPowerPort(ctx: Canvas2DRenderer, port: PowerPort, selected: boolean): void;
}
//# sourceMappingURL=wire-renderer.d.ts.map