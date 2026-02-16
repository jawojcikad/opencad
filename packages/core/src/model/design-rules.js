/**
 * Sensible defaults loosely based on common 2-layer PCB fabrication
 * capabilities (values in nanometers).
 */
export function defaultDesignRules() {
    return {
        minClearance: 200_000, // 0.2 mm
        minTrackWidth: 200_000, // 0.2 mm
        minViaDiameter: 600_000, // 0.6 mm
        minViaDrill: 300_000, // 0.3 mm
        minHoleToHole: 250_000, // 0.25 mm
        minSilkClearance: 150_000, // 0.15 mm
        minMaskMargin: 50_000, // 0.05 mm
        defaultTrackWidth: 250_000, // 0.25 mm
        defaultViaDiameter: 800_000, // 0.8 mm
        defaultViaDrill: 400_000, // 0.4 mm
        copperLayerCount: 2,
    };
}
//# sourceMappingURL=design-rules.js.map