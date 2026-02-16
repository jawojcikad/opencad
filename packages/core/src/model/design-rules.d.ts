export interface DesignRules {
    /** Minimum copper-to-copper clearance (nm). */
    minClearance: number;
    /** Minimum track width (nm). */
    minTrackWidth: number;
    /** Minimum via pad diameter (nm). */
    minViaDiameter: number;
    /** Minimum via drill diameter (nm). */
    minViaDrill: number;
    /** Minimum hole-to-hole clearance (nm). */
    minHoleToHole: number;
    /** Minimum silkscreen-to-pad clearance (nm). */
    minSilkClearance: number;
    /** Default solder mask expansion (nm). */
    minMaskMargin: number;
    /** Default track width (nm). */
    defaultTrackWidth: number;
    /** Default via pad diameter (nm). */
    defaultViaDiameter: number;
    /** Default via drill diameter (nm). */
    defaultViaDrill: number;
    /** Number of copper layers. */
    copperLayerCount: number;
}
/**
 * Sensible defaults loosely based on common 2-layer PCB fabrication
 * capabilities (values in nanometers).
 */
export declare function defaultDesignRules(): DesignRules;
//# sourceMappingURL=design-rules.d.ts.map