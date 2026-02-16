const FRONT_COPPER = 'F.Cu';
const BACK_COPPER = 'B.Cu';
function makeInnerLayer(index) {
    return `In${index}.Cu`;
}
class DefaultPCBLayerStack {
    copperLayers;
    get copperLayerCount() {
        return this.copperLayers.length;
    }
    constructor(copperCount) {
        if (copperCount < 2) {
            copperCount = 2;
        }
        if (copperCount % 2 !== 0) {
            copperCount += 1;
        }
        this.copperLayers = [FRONT_COPPER];
        for (let i = 1; i <= copperCount - 2; i++) {
            this.copperLayers.push(makeInnerLayer(i));
        }
        this.copperLayers.push(BACK_COPPER);
    }
    addInnerLayer() {
        const innerCount = this.copperLayers.length - 2;
        const newLayer = makeInnerLayer(innerCount + 1);
        // Insert before B.Cu (last element)
        this.copperLayers.splice(this.copperLayers.length - 1, 0, newLayer);
        return newLayer;
    }
    removeInnerLayer(layer) {
        if (this.isOuterLayer(layer)) {
            throw new Error('Cannot remove outer copper layer');
        }
        const idx = this.copperLayers.indexOf(layer);
        if (idx === -1) {
            throw new Error(`Layer ${layer} not found in stack`);
        }
        if (this.copperLayers.length <= 2) {
            throw new Error('Cannot remove layer: minimum 2 copper layers required');
        }
        this.copperLayers.splice(idx, 1);
        // Re-index inner layers
        let innerIdx = 1;
        for (let i = 1; i < this.copperLayers.length - 1; i++) {
            this.copperLayers[i] = makeInnerLayer(innerIdx);
            innerIdx++;
        }
    }
    getLayerPair(layer) {
        if (layer === FRONT_COPPER)
            return BACK_COPPER;
        if (layer === BACK_COPPER)
            return FRONT_COPPER;
        const idx = this.copperLayers.indexOf(layer);
        if (idx === -1) {
            throw new Error(`Layer ${layer} not found`);
        }
        // For inner layers, pair with the mirrored position
        const mirroredIdx = this.copperLayers.length - 1 - idx;
        return this.copperLayers[mirroredIdx];
    }
    isOuterLayer(layer) {
        return layer === FRONT_COPPER || layer === BACK_COPPER;
    }
    getLayersBetween(top, bottom) {
        const topIdx = this.copperLayers.indexOf(top);
        const bottomIdx = this.copperLayers.indexOf(bottom);
        if (topIdx === -1 || bottomIdx === -1) {
            throw new Error('Layer not found in stack');
        }
        const startIdx = Math.min(topIdx, bottomIdx);
        const endIdx = Math.max(topIdx, bottomIdx);
        return this.copperLayers.slice(startIdx, endIdx + 1);
    }
}
export function createDefaultLayerStack(copperCount = 2) {
    return new DefaultPCBLayerStack(copperCount);
}
//# sourceMappingURL=layer-stack.js.map