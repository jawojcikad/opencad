export interface Vec2 {
    x: number;
    y: number;
}
export interface PadDef {
    id: string;
    net: string;
    position: Vec2;
    size: Vec2;
}
export interface FootprintDef {
    id: string;
    position: Vec2;
    rotation: number;
    pads: PadDef[];
}
export interface Track {
    id: string;
    net: string;
    layer: string;
    width: number;
    points: Vec2[];
}
export interface DesignRules {
    clearance: number;
    trackWidth: number;
    viaDiameter: number;
    viaDrill: number;
    minTrackWidth: number;
}
export interface BoardOutline {
    points: Vec2[];
}
export interface PCBDocument {
    boardOutline: BoardOutline;
    footprints: FootprintDef[];
    tracks: Track[];
    designRules: DesignRules;
}
export interface AutorouterConfig {
    gridResolution: number;
    maxIterations: number;
    preferredLayer: string;
}
//# sourceMappingURL=autorouter-worker.d.ts.map