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

const FRONT_COPPER: Layer = 'F.Cu' as Layer;
const BACK_COPPER: Layer = 'B.Cu' as Layer;

function makeInnerLayer(index: number): Layer {
  return `In${index}.Cu` as Layer;
}

class DefaultPCBLayerStack implements PCBLayerStack {
  public copperLayers: Layer[];

  get copperLayerCount(): number {
    return this.copperLayers.length;
  }

  constructor(copperCount: number) {
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

  addInnerLayer(): Layer {
    const innerCount = this.copperLayers.length - 2;
    const newLayer = makeInnerLayer(innerCount + 1);
    // Insert before B.Cu (last element)
    this.copperLayers.splice(this.copperLayers.length - 1, 0, newLayer);
    return newLayer;
  }

  removeInnerLayer(layer: Layer): void {
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

  getLayerPair(layer: Layer): Layer {
    if (layer === FRONT_COPPER) return BACK_COPPER;
    if (layer === BACK_COPPER) return FRONT_COPPER;

    const idx = this.copperLayers.indexOf(layer);
    if (idx === -1) {
      throw new Error(`Layer ${layer} not found`);
    }
    // For inner layers, pair with the mirrored position
    const mirroredIdx = this.copperLayers.length - 1 - idx;
    return this.copperLayers[mirroredIdx];
  }

  isOuterLayer(layer: Layer): boolean {
    return layer === FRONT_COPPER || layer === BACK_COPPER;
  }

  getLayersBetween(top: Layer, bottom: Layer): Layer[] {
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

export function createDefaultLayerStack(copperCount: number = 2): PCBLayerStack {
  return new DefaultPCBLayerStack(copperCount);
}
