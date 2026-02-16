import { PCBDocument } from '@opencad/core';
export interface DrillHole {
    x: number;
    y: number;
    diameter: number;
    plated: boolean;
}
/**
 * Generates Excellon NC drill files from a `PCBDocument`.
 *
 * Format specifics:
 * - Metric (METRIC,TZ — trailing‑zero suppression)
 * - Absolute co‑ordinates
 * - 3.3 format (3 integer + 3 fractional digits of mm)
 * - Tool definitions: `T01C0.300` (tool 1, diameter 0.3 mm)
 * - Drill hits: `X12345Y67890`
 */
export declare class ExcellonGenerator {
    /**
     * Generate a single drill file containing *all* holes (plated and
     * non‑plated are separated by tool groups for convenience, but are
     * in one file).
     */
    generateDrillFile(document: PCBDocument): string;
    /** Generate a drill file containing only plated holes. */
    generatePlatedDrills(document: PCBDocument): string;
    /** Generate a drill file containing only non‑plated holes. */
    generateNonPlatedDrills(document: PCBDocument): string;
    /**
     * Walk through vias and through‑hole pads in the PCB document and
     * collect every drill hole.
     */
    private collectHoles;
    /**
     * Group holes by drill diameter so each unique diameter gets its own
     * tool number.
     */
    private groupByDiameter;
    /**
     * Build the header section.
     *
     * @param tools Map of tool‑number → diameter (mm)
     */
    private formatHeader;
    /**
     * Format a co‑ordinate value (mm) to Excellon 3.3 format.
     * Values like 12.345 → `12345`, -1.5 → `-1500`.
     */
    private formatCoord;
    private buildFile;
    /** Pad tool number to at least 2 digits: 1 → "01". */
    private padTool;
}
//# sourceMappingURL=excellon-generator.d.ts.map