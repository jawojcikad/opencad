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
export function defaultDesignRules(): DesignRules {
  return {
    minClearance: 200_000,       // 0.2 mm
    minTrackWidth: 200_000,      // 0.2 mm
    minViaDiameter: 600_000,     // 0.6 mm
    minViaDrill: 300_000,        // 0.3 mm
    minHoleToHole: 250_000,      // 0.25 mm
    minSilkClearance: 150_000,   // 0.15 mm
    minMaskMargin: 50_000,       // 0.05 mm
    defaultTrackWidth: 250_000,  // 0.25 mm
    defaultViaDiameter: 800_000, // 0.8 mm
    defaultViaDrill: 400_000,    // 0.4 mm
    copperLayerCount: 2,
  };
}
