/**
 * Layer management for the rendering engine.
 *
 * Layers control visibility, colour and render order for both
 * schematic and PCB views.
 */
export interface LayerConfig {
    id: string;
    name: string;
    color: string;
    visible: boolean;
    opacity: number;
    selectable: boolean;
    /** Rendering order — lower numbers are drawn first (behind). */
    order: number;
}
export declare class LayerManager {
    private layers;
    addLayer(config: LayerConfig): void;
    removeLayer(id: string): void;
    getLayer(id: string): LayerConfig | undefined;
    setVisible(id: string, visible: boolean): void;
    setColor(id: string, color: string): void;
    setOpacity(id: string, opacity: number): void;
    /** Return all visible layers sorted by order (ascending). */
    getVisibleLayers(): LayerConfig[];
    /** Return a snapshot of every layer sorted by order (ascending). */
    getAllLayers(): LayerConfig[];
    /** Return layer ids sorted by rendering order (ascending). */
    getLayerOrder(): string[];
    /**
     * Move layer `id` to `newOrder`.  Other layers are renumbered so
     * their relative order is preserved.
     */
    moveLayer(id: string, newOrder: number): void;
}
export declare function createSchematicLayers(): LayerManager;
export declare function createPCBLayers(): LayerManager;
//# sourceMappingURL=layer-manager.d.ts.map