/**
 * Layer management for the rendering engine.
 *
 * Layers control visibility, colour and render order for both
 * schematic and PCB views.
 */
export class LayerManager {
    layers = new Map();
    addLayer(config) {
        this.layers.set(config.id, { ...config });
    }
    removeLayer(id) {
        this.layers.delete(id);
    }
    getLayer(id) {
        const cfg = this.layers.get(id);
        return cfg ? { ...cfg } : undefined;
    }
    setVisible(id, visible) {
        const layer = this.layers.get(id);
        if (layer)
            layer.visible = visible;
    }
    setColor(id, color) {
        const layer = this.layers.get(id);
        if (layer)
            layer.color = color;
    }
    setOpacity(id, opacity) {
        const layer = this.layers.get(id);
        if (layer)
            layer.opacity = Math.max(0, Math.min(1, opacity));
    }
    /** Return all visible layers sorted by order (ascending). */
    getVisibleLayers() {
        return this.getAllLayers().filter((l) => l.visible);
    }
    /** Return a snapshot of every layer sorted by order (ascending). */
    getAllLayers() {
        return Array.from(this.layers.values())
            .sort((a, b) => a.order - b.order)
            .map((l) => ({ ...l }));
    }
    /** Return layer ids sorted by rendering order (ascending). */
    getLayerOrder() {
        return this.getAllLayers().map((l) => l.id);
    }
    /**
     * Move layer `id` to `newOrder`.  Other layers are renumbered so
     * their relative order is preserved.
     */
    moveLayer(id, newOrder) {
        const layer = this.layers.get(id);
        if (!layer)
            return;
        // Pull the target out, sort the rest, then splice it back.
        const others = Array.from(this.layers.values())
            .filter((l) => l.id !== id)
            .sort((a, b) => a.order - b.order);
        // Clamp insertion index.
        const insertIdx = Math.max(0, Math.min(others.length, newOrder));
        others.splice(insertIdx, 0, layer);
        // Reassign sequential order numbers.
        others.forEach((l, i) => {
            l.order = i;
        });
    }
}
// ── Factory helpers ─────────────────────────────────────────────────
export function createSchematicLayers() {
    const mgr = new LayerManager();
    const defaults = [
        { id: 'background', name: 'Background', color: '#1e1e1e', visible: true, opacity: 1, selectable: false, order: 0 },
        { id: 'grid', name: 'Grid', color: '#333333', visible: true, opacity: 1, selectable: false, order: 1 },
        { id: 'wires', name: 'Wires', color: '#00cc00', visible: true, opacity: 1, selectable: true, order: 2 },
        { id: 'buses', name: 'Buses', color: '#0077ff', visible: true, opacity: 1, selectable: true, order: 3 },
        { id: 'symbols', name: 'Symbols', color: '#cc0000', visible: true, opacity: 1, selectable: true, order: 4 },
        { id: 'pins', name: 'Pins', color: '#00cccc', visible: true, opacity: 1, selectable: true, order: 5 },
        { id: 'text', name: 'Text', color: '#cccccc', visible: true, opacity: 1, selectable: true, order: 6 },
        { id: 'junction', name: 'Junctions', color: '#00cc00', visible: true, opacity: 1, selectable: true, order: 7 },
        { id: 'no-connect', name: 'No-connect', color: '#cc0000', visible: true, opacity: 1, selectable: true, order: 8 },
        { id: 'selection', name: 'Selection', color: '#ffff00', visible: true, opacity: 0.5, selectable: false, order: 100 },
    ];
    for (const cfg of defaults) {
        mgr.addLayer(cfg);
    }
    return mgr;
}
export function createPCBLayers() {
    const mgr = new LayerManager();
    const defaults = [
        { id: 'b.cu', name: 'Back Copper', color: '#0000cc', visible: true, opacity: 1, selectable: true, order: 0 },
        { id: 'inner1.cu', name: 'Inner 1', color: '#cc9900', visible: false, opacity: 1, selectable: true, order: 1 },
        { id: 'inner2.cu', name: 'Inner 2', color: '#cc00cc', visible: false, opacity: 1, selectable: true, order: 2 },
        { id: 'f.cu', name: 'Front Copper', color: '#cc0000', visible: true, opacity: 1, selectable: true, order: 3 },
        { id: 'b.silkscreen', name: 'Back Silkscreen', color: '#cc00cc', visible: true, opacity: 1, selectable: true, order: 4 },
        { id: 'f.silkscreen', name: 'Front Silkscreen', color: '#ffff00', visible: true, opacity: 1, selectable: true, order: 5 },
        { id: 'b.mask', name: 'Back Solder Mask', color: '#009900', visible: true, opacity: 0.5, selectable: false, order: 6 },
        { id: 'f.mask', name: 'Front Solder Mask', color: '#990099', visible: true, opacity: 0.5, selectable: false, order: 7 },
        { id: 'b.paste', name: 'Back Paste', color: '#666699', visible: false, opacity: 0.6, selectable: false, order: 8 },
        { id: 'f.paste', name: 'Front Paste', color: '#996666', visible: false, opacity: 0.6, selectable: false, order: 9 },
        { id: 'edge.cuts', name: 'Board Outline', color: '#cccc00', visible: true, opacity: 1, selectable: true, order: 10 },
        { id: 'margin', name: 'Margin', color: '#cc00cc', visible: false, opacity: 1, selectable: false, order: 11 },
        { id: 'b.courtyard', name: 'Back Courtyard', color: '#6666cc', visible: true, opacity: 0.5, selectable: false, order: 12 },
        { id: 'f.courtyard', name: 'Front Courtyard', color: '#cc6666', visible: true, opacity: 0.5, selectable: false, order: 13 },
        { id: 'b.fab', name: 'Back Fabrication', color: '#999999', visible: false, opacity: 1, selectable: false, order: 14 },
        { id: 'f.fab', name: 'Front Fabrication', color: '#999999', visible: false, opacity: 1, selectable: false, order: 15 },
        { id: 'dwgs.user', name: 'User Drawings', color: '#999999', visible: false, opacity: 1, selectable: true, order: 16 },
        { id: 'cmts.user', name: 'User Comments', color: '#6666cc', visible: false, opacity: 1, selectable: true, order: 17 },
        { id: 'selection', name: 'Selection', color: '#ffffff', visible: true, opacity: 0.5, selectable: false, order: 100 },
    ];
    for (const cfg of defaults) {
        mgr.addLayer(cfg);
    }
    return mgr;
}
//# sourceMappingURL=layer-manager.js.map