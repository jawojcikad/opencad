/** Supported display / input units. */
export var Unit;
(function (Unit) {
    Unit[Unit["MM"] = 0] = "MM";
    Unit[Unit["MIL"] = 1] = "MIL";
    Unit[Unit["INCH"] = 2] = "INCH";
})(Unit || (Unit = {}));
// ─── Conversion constants ──────────────────────────────────
const MM_PER_INCH = 25.4;
const MIL_PER_INCH = 1000;
const MM_PER_MIL = MM_PER_INCH / MIL_PER_INCH; // 0.0254
const NM_PER_MM = 1_000_000;
const NM_PER_MIL = NM_PER_MM * MM_PER_MIL; // 25_400
// ─── mm ↔ mil / inch ──────────────────────────────────────
export function mmToMil(mm) {
    return mm / MM_PER_MIL;
}
export function milToMm(mil) {
    return mil * MM_PER_MIL;
}
export function mmToInch(mm) {
    return mm / MM_PER_INCH;
}
export function inchToMm(inch) {
    return inch * MM_PER_INCH;
}
// ─── Internal unit: nanometers (integer) ───────────────────
export function mmToNm(mm) {
    return Math.round(mm * NM_PER_MM);
}
export function nmToMm(nm) {
    return nm / NM_PER_MM;
}
export function milToNm(mil) {
    return Math.round(mil * NM_PER_MIL);
}
export function nmToMil(nm) {
    return nm / NM_PER_MIL;
}
// ─── Generic conversion ───────────────────────────────────
/** Convert `value` from one unit to another. */
export function convert(value, from, to) {
    if (from === to)
        return value;
    // First convert `from` → mm, then mm → `to`.
    let mm;
    switch (from) {
        case Unit.MM:
            mm = value;
            break;
        case Unit.MIL:
            mm = milToMm(value);
            break;
        case Unit.INCH:
            mm = inchToMm(value);
            break;
    }
    switch (to) {
        case Unit.MM:
            return mm;
        case Unit.MIL:
            return mmToMil(mm);
        case Unit.INCH:
            return mmToInch(mm);
    }
}
// ─── Formatting ────────────────────────────────────────────
const UNIT_SUFFIX = {
    [Unit.MM]: 'mm',
    [Unit.MIL]: 'mil',
    [Unit.INCH]: '"',
};
/**
 * Format a numeric value with its unit suffix.
 *
 * @param value     The numeric value.
 * @param unit      The unit to display.
 * @param precision Number of decimal digits (default 3).
 */
export function formatValue(value, unit, precision = 3) {
    return `${value.toFixed(precision)} ${UNIT_SUFFIX[unit]}`;
}
//# sourceMappingURL=units.js.map