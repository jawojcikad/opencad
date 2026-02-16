import { PCBDocument, Layer } from '@opencad/core';
export interface GerberAperture {
    code: number;
    type: 'circle' | 'rectangle' | 'obround' | 'polygon';
    parameters: number[];
}
/**
 * Generates Gerber RS‑274X files from a `PCBDocument`.
 *
 * Co‑ordinate format: **2.6** (mm, 6 decimal places, leading‑zero
 * suppression, absolute co‑ordinates).
 *
 * Aperture codes start at D10 as per the spec.
 */
export declare class GerberGenerator {
    private apertures;
    private commands;
    private apertureIndex;
    constructor();
    /**
     * Generate *all* standard Gerber fabrication files for the given PCB.
     *
     * Returns a `Map<string, string>` where the key is the suggested
     * filename and the value is the full Gerber file content.
     */
    generateAll(document: PCBDocument): Map<string, string>;
    generateCopperLayer(document: PCBDocument, layer: Layer): string;
    generateSilkscreen(document: PCBDocument, layer: Layer): string;
    generateSolderMask(document: PCBDocument, layer: Layer): string;
    generatePasteMask(document: PCBDocument, layer: Layer): string;
    generateBoardOutline(document: PCBDocument): string;
    private header;
    private footer;
    private defineAperture;
    private selectAperture;
    /** Move without drawing (D02). */
    private moveTo;
    /** Draw line to (D01). */
    private lineTo;
    /** Flash aperture at position (D03). */
    private flash;
    /** Layer polarity. */
    private setPolarity;
    /** Start region fill (G36). */
    private regionStart;
    /** End region fill (G37). */
    private regionEnd;
    /**
     * Format a co‑ordinate value (mm) into Gerber 2.6 integer format.
     *
     * The 2.6 format means 2 integer digits and 6 fractional digits with
     * *leading‑zero suppression*.  The value is in mm so we multiply by
     * 10^6 to get the integer representation.
     */
    private formatCoord;
    private renderTrack;
    private renderPad;
    private renderVia;
    private renderZone;
    private renderOutline;
    /**
     * Register an aperture (or return the code of an existing identical
     * one) and emit the `%ADD…%` definition into the command list.
     */
    private addAperture;
    private reset;
    private sanitiseFilename;
}
//# sourceMappingURL=gerber-generator.d.ts.map