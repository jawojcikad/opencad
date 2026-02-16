export interface Vec2 {
    x: number;
    y: number;
}
export interface PadDef {
    id: string;
    net: string;
    position: Vec2;
    size: Vec2;
    shape: string;
    type: string;
    drill?: number;
}
export interface FootprintDef {
    id: string;
    componentId: string;
    reference: string;
    position: Vec2;
    rotation: number;
    layer: string;
    pads: PadDef[];
}
export interface Track {
    id: string;
    net: string;
    layer: string;
    width: number;
    points: Vec2[];
}
export interface Via {
    id: string;
    net: string;
    position: Vec2;
    diameter: number;
    drill: number;
}
export interface DesignRules {
    clearance: number;
    trackWidth: number;
    viaDiameter: number;
    viaDrill: number;
    minTrackWidth: number;
}
export interface PCBDocument {
    footprints: FootprintDef[];
    tracks: Track[];
    vias: Via[];
    designRules: DesignRules;
    layers: string[];
}
export interface DRCViolation {
    id: string;
    type: 'clearance' | 'min-track-width' | 'min-drill' | 'unconnected' | 'overlap';
    severity: 'error' | 'warning';
    message: string;
    position: Vec2;
    objectIds: string[];
}
//# sourceMappingURL=drc-worker.d.ts.map