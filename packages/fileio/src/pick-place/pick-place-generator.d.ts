import type { PCBDocument } from '@opencad/core';
export interface PickPlaceEntry {
    reference: string;
    value: string;
    footprint: string;
    x: number;
    y: number;
    rotation: number;
    side: 'top' | 'bottom';
}
/**
 * Generates pick‑and‑place (centroid / XY) data from a PCB document.
 *
 * The output is typically consumed by SMT assembly houses to program
 * their placement machines.
 */
export declare class PickPlaceGenerator {
    /**
     * Collect pick‑and‑place entries for every footprint in the PCB.
     *
     * Through‑hole‑only footprints (every pad has a drill) are skipped
     * since they are not placed by a pick‑and‑place machine.
     */
    generate(document: PCBDocument): PickPlaceEntry[];
    /**
     * Export entries as a CSV file suitable for most SMT assembly services.
     *
     * Columns: Reference, Value, Package, X (mm), Y (mm), Rotation, Side
     */
    exportCSV(entries: PickPlaceEntry[]): string;
}
//# sourceMappingURL=pick-place-generator.d.ts.map