import { Sheet } from '@opencad/core';
import { Canvas2DRenderer } from '@opencad/renderer';
/**
 * Orchestrates rendering of an entire schematic sheet by delegating
 * to SymbolRenderer and WireRenderer for individual elements.
 *
 * Rendering order follows the pipeline defined in ARCHITECTURE.md:
 *   1. Wires and buses
 *   2. Component symbols
 *   3. Pin markers and names
 *   4. Net labels and power ports
 *   5. Junctions
 *   6. Selection overlay
 */
export declare class SchematicRenderer {
    private symbolRenderer;
    private wireRenderer;
    constructor();
    renderSheet(renderer: Canvas2DRenderer, sheet: Sheet, selection: Set<string>): void;
    /**
     * Draws reference designator (e.g. "R1") and value (e.g. "10k") labels
     * positioned relative to the component.
     */
    private renderComponentLabels;
}
//# sourceMappingURL=schematic-renderer.d.ts.map