import { Layer } from '@opencad/core';
export interface PCBLayerStack {
    copperLayers: Layer[];
    copperLayerCount: number;
    addInnerLayer(): Layer;
    removeInnerLayer(layer: Layer): void;
    getLayerPair(layer: Layer): Layer;
    isOuterLayer(layer: Layer): boolean;
    getLayersBetween(top: Layer, bottom: Layer): Layer[];
}
export declare function createDefaultLayerStack(copperCount?: number): PCBLayerStack;
//# sourceMappingURL=layer-stack.d.ts.map