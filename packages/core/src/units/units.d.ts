/** Supported display / input units. */
export declare enum Unit {
    MM = 0,
    MIL = 1,
    INCH = 2
}
export declare function mmToMil(mm: number): number;
export declare function milToMm(mil: number): number;
export declare function mmToInch(mm: number): number;
export declare function inchToMm(inch: number): number;
export declare function mmToNm(mm: number): number;
export declare function nmToMm(nm: number): number;
export declare function milToNm(mil: number): number;
export declare function nmToMil(nm: number): number;
/** Convert `value` from one unit to another. */
export declare function convert(value: number, from: Unit, to: Unit): number;
/**
 * Format a numeric value with its unit suffix.
 *
 * @param value     The numeric value.
 * @param unit      The unit to display.
 * @param precision Number of decimal digits (default 3).
 */
export declare function formatValue(value: number, unit: Unit, precision?: number): string;
//# sourceMappingURL=units.d.ts.map