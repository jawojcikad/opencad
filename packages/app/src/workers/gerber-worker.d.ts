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
    reference: string;
    position: Vec2;
    rotation: number;
    layer: string;
    pads: PadDef[];
    silkscreen: {
        lines: {
            x1: number;
            y1: number;
            x2: number;
            y2: number;
        }[];
    };
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
export interface BoardOutline {
    points: Vec2[];
}
export interface PCBDocument {
    boardOutline: BoardOutline;
    footprints: FootprintDef[];
    tracks: Track[];
    vias: Via[];
    layers: string[];
}
export interface GerberFile {
    filename: string;
    content: string;
}
//# sourceMappingURL=gerber-worker.d.ts.map