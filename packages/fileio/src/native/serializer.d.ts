import type { SchematicDocument, PCBDocument, Symbol, Footprint, Component, DesignRules } from '@opencad/core';
export interface OpenCADProjectFile {
    version: string;
    name: string;
    created: string;
    modified: string;
    schematic: SchematicDocument;
    pcb: PCBDocument;
    library: {
        symbols: Symbol[];
        footprints: Footprint[];
        components: Component[];
    };
    settings: {
        designRules: DesignRules;
        gridSettings: any;
    };
}
export declare class NativeSerializer {
    /**
     * Serialize an OpenCAD project to a JSON string.
     * Updates the `modified` timestamp automatically.
     */
    static serialize(project: OpenCADProjectFile): string;
    /**
     * Deserialize a JSON string into a validated OpenCADProjectFile.
     * Throws on invalid JSON or missing required fields.
     */
    static deserialize(json: string): OpenCADProjectFile;
    /**
     * Runtime type‑guard that verifies the top‑level shape of a project file.
     * Does *not* deep‑validate every nested object – that is the job of the
     * domain model constructors – but it ensures all required top‑level
     * properties exist and are roughly the right type.
     */
    static validateProject(data: unknown): data is OpenCADProjectFile;
}
//# sourceMappingURL=serializer.d.ts.map