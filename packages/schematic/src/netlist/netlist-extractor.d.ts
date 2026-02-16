import { SchematicDocument, Sheet } from '@opencad/core';
export interface NetlistEntry {
    netName: string;
    connections: Array<{
        componentRef: string;
        pinNumber: string;
        pinName: string;
    }>;
}
export interface Netlist {
    components: Array<{
        reference: string;
        value: string;
        footprint: string;
        properties: Record<string, string>;
    }>;
    nets: NetlistEntry[];
}
declare class UnionFind {
    private parent;
    private rank;
    make(x: string): void;
    find(x: string): string;
    union(a: string, b: string): void;
    groups(): Map<string, string[]>;
}
export declare class NetlistExtractor {
    /**
     * Extract a full netlist from a schematic document.
     */
    extract(document: SchematicDocument): Netlist;
    buildConnectivity(sheet: Sheet): UnionFind;
    resolveNetNames(connectivity: UnionFind, sheet: Sheet): Map<string, string>;
    collectComponents(document: SchematicDocument): Netlist['components'];
    private findComponent;
}
export {};
//# sourceMappingURL=netlist-extractor.d.ts.map