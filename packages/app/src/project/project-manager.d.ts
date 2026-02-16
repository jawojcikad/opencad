/** Minimal shared types  — will be superseded by @opencad/core once wired up */
export interface Vec2 {
    x: number;
    y: number;
}
export interface PinDef {
    id: string;
    name: string;
    number: string;
    position: Vec2;
    type: 'input' | 'output' | 'bidirectional' | 'passive' | 'power';
    orientation: number;
}
export interface SymbolGraphics {
    rects: {
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
    circles: {
        cx: number;
        cy: number;
        r: number;
    }[];
    lines: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }[];
    texts: {
        x: number;
        y: number;
        text: string;
        size: number;
    }[];
}
export interface SchematicComponent {
    id: string;
    symbolId: string;
    reference: string;
    value: string;
    position: Vec2;
    rotation: number;
    pins: PinDef[];
    graphics: SymbolGraphics;
}
export interface Wire {
    id: string;
    net: string;
    points: Vec2[];
}
export interface NetLabel {
    id: string;
    net: string;
    position: Vec2;
}
export interface PowerPort {
    id: string;
    net: string;
    position: Vec2;
    type: 'vcc' | 'gnd';
}
export interface SchematicSheet {
    id: string;
    name: string;
    components: SchematicComponent[];
    wires: Wire[];
    netLabels: NetLabel[];
    powerPorts: PowerPort[];
}
export interface SchematicDocument {
    sheets: SchematicSheet[];
}
export interface PadDef {
    id: string;
    net: string;
    position: Vec2;
    size: Vec2;
    shape: 'circle' | 'rect' | 'oval';
    type: 'smd' | 'through-hole';
    drill?: number;
}
export interface FootprintDef {
    id: string;
    componentId: string;
    reference: string;
    value: string;
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
export interface DesignRules {
    clearance: number;
    trackWidth: number;
    viaDiameter: number;
    viaDrill: number;
    minTrackWidth: number;
}
export interface PCBDocument {
    boardOutline: BoardOutline;
    footprints: FootprintDef[];
    tracks: Track[];
    vias: Via[];
    designRules: DesignRules;
    layers: string[];
}
export interface ProjectMetadata {
    name: string;
    author: string;
    createdAt: string;
    modifiedAt: string;
    version: string;
}
export interface OpenCADProjectFile {
    formatVersion: string;
    metadata: ProjectMetadata;
    schematic: SchematicDocument;
    pcb: PCBDocument;
}
export declare class ProjectManager {
    private currentProject;
    newProject(name?: string): OpenCADProjectFile;
    setProject(project: OpenCADProjectFile): void;
    saveProject(): void;
    loadProject(file: File): Promise<OpenCADProjectFile>;
    exportGerber(): void;
    exportBOM(): void;
    autoSave(): void;
    loadAutoSave(): OpenCADProjectFile | null;
    getCurrentProject(): OpenCADProjectFile | null;
}
//# sourceMappingURL=project-manager.d.ts.map