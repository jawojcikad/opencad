import type { SchematicDocument, Component } from '@opencad/core';
export interface BOMEntry {
    reference: string;
    value: string;
    footprint: string;
    quantity: number;
    description: string;
    manufacturer?: string;
    partNumber?: string;
    supplier?: string;
    supplierPartNumber?: string;
    properties: Record<string, string>;
}
export declare class BOMGenerator {
    /**
     * Generate a flat (un‑grouped) BOM from a schematic document.
     *
     * Each placed component results in one entry with `quantity = 1`.
     * If a `components` library array is supplied, extra metadata
     * (manufacturer, partNumber, etc.) is merged in.
     */
    generateBOM(document: SchematicDocument, components: Component[]): BOMEntry[];
    /**
     * Group BOM entries with the same value + footprint + description
     * combination, summing quantities and merging reference designators.
     */
    groupBOM(entries: BOMEntry[]): BOMEntry[];
    /** Export as RFC 4180 CSV. */
    exportCSV(entries: BOMEntry[]): string;
    /** Export as TSV. */
    exportTSV(entries: BOMEntry[]): string;
    /** Export as pretty‑printed JSON. */
    exportJSON(entries: BOMEntry[]): string;
    /** Export as a self-contained HTML table. */
    exportHTML(entries: BOMEntry[]): string;
    private exportDelimited;
}
//# sourceMappingURL=bom-generator.d.ts.map