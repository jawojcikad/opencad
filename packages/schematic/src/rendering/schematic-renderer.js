import { SymbolRenderer } from './symbol-renderer';
import { WireRenderer } from './wire-renderer';
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
export class SchematicRenderer {
    symbolRenderer;
    wireRenderer;
    constructor() {
        this.symbolRenderer = new SymbolRenderer();
        this.wireRenderer = new WireRenderer();
    }
    renderSheet(renderer, sheet, selection) {
        // 1. Wires
        const wires = sheet.wires ?? [];
        for (const wire of wires) {
            const isSelected = selection.has(wire.id);
            this.wireRenderer.renderWire(renderer, wire, isSelected);
        }
        // 2. Components (symbols + pins)
        const components = sheet.components ?? [];
        for (const comp of components) {
            const isSelected = selection.has(comp.id);
            if (comp.symbol) {
                this.symbolRenderer.render(renderer, comp.symbol, comp.position, comp.rotation ?? 0, isSelected, comp.mirrored ?? false);
            }
            // Draw reference designator and value above the component
            this.renderComponentLabels(renderer, comp, isSelected);
        }
        // 3. Net labels
        const netLabels = sheet.netLabels ?? [];
        for (const label of netLabels) {
            const isSelected = selection.has(label.id);
            this.wireRenderer.renderNetLabel(renderer, label, isSelected);
        }
        // 4. Power ports
        const powerPorts = sheet.powerPorts ?? [];
        for (const port of powerPorts) {
            const isSelected = selection.has(port.id);
            this.wireRenderer.renderPowerPort(renderer, port, isSelected);
        }
        // 5. Junctions
        const junctions = sheet.junctions ?? [];
        for (const junction of junctions) {
            this.wireRenderer.renderJunction(renderer, junction);
        }
    }
    /**
     * Draws reference designator (e.g. "R1") and value (e.g. "10k") labels
     * positioned relative to the component.
     */
    renderComponentLabels(renderer, comp, selected) {
        const g = renderer.getContext();
        g.save();
        g.translate(comp.position.x, comp.position.y);
        const refColor = selected ? '#0088ff' : '#333333';
        const valColor = selected ? '#4488ff' : '#666666';
        // Reference designator
        if (comp.reference) {
            g.font = 'bold 12px monospace';
            g.fillStyle = refColor;
            g.textAlign = 'center';
            g.textBaseline = 'bottom';
            g.fillText(comp.reference, 0, -28);
        }
        // Value
        if (comp.value) {
            g.font = '11px monospace';
            g.fillStyle = valColor;
            g.textAlign = 'center';
            g.textBaseline = 'top';
            g.fillText(comp.value, 0, 28);
        }
        g.restore();
    }
}
//# sourceMappingURL=schematic-renderer.js.map