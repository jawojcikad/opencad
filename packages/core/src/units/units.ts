/** Supported display / input units. */
export enum Unit {
  MM,
  MIL,
  INCH,
}

// ─── Conversion constants ──────────────────────────────────

const MM_PER_INCH = 25.4;
const MIL_PER_INCH = 1000;
const MM_PER_MIL = MM_PER_INCH / MIL_PER_INCH; // 0.0254
const NM_PER_MM = 1_000_000;
const NM_PER_MIL = NM_PER_MM * MM_PER_MIL; // 25_400

// ─── mm ↔ mil / inch ──────────────────────────────────────

export function mmToMil(mm: number): number {
  return mm / MM_PER_MIL;
}

export function milToMm(mil: number): number {
  return mil * MM_PER_MIL;
}

export function mmToInch(mm: number): number {
  return mm / MM_PER_INCH;
}

export function inchToMm(inch: number): number {
  return inch * MM_PER_INCH;
}

// ─── Internal unit: nanometers (integer) ───────────────────

export function mmToNm(mm: number): number {
  return Math.round(mm * NM_PER_MM);
}

export function nmToMm(nm: number): number {
  return nm / NM_PER_MM;
}

export function milToNm(mil: number): number {
  return Math.round(mil * NM_PER_MIL);
}

export function nmToMil(nm: number): number {
  return nm / NM_PER_MIL;
}

// ─── Generic conversion ───────────────────────────────────

/** Convert `value` from one unit to another. */
export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;

  // First convert `from` → mm, then mm → `to`.
  let mm: number;
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

const UNIT_SUFFIX: Record<Unit, string> = {
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
export function formatValue(
  value: number,
  unit: Unit,
  precision: number = 3,
): string {
  return `${value.toFixed(precision)} ${UNIT_SUFFIX[unit]}`;
}
