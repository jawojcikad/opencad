// --------------------------------------------------------------------------
// packages/library/src/footprints/footprint-factory.ts
// Factory for footprint lookup and parametric footprint generation.
// --------------------------------------------------------------------------

import { Footprint, generateId } from '@opencad/core';

import {
  getAllBuiltinFootprints,
  createSMDChipFootprint,
  createSOIC,
  createQFP,
  createDIP,
  createPinHeader,
  createQFN,
} from './basic-footprints';

export class FootprintFactory {
  private static _cache: Footprint[] | null = null;

  private static ensureCache(): Footprint[] {
    if (!this._cache) {
      this._cache = getAllBuiltinFootprints();
    }
    return this._cache;
  }

  /** Return every built-in footprint. */
  static getBuiltinFootprints(): Footprint[] {
    return this.ensureCache();
  }

  /** Find a built-in footprint by name (case-insensitive). */
  static getFootprint(name: string): Footprint | undefined {
    const lower = name.toLowerCase();
    return this.ensureCache().find((f) => f.name.toLowerCase() === lower);
  }

  /* ---------------------------------------------------------------- */
  /*  Parametric generators                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Create a 2-pad SMD chip footprint with explicit dimensions.
   *
   * @param name        Footprint name, e.g. "MY_0805"
   * @param bodyLength  Body length along pad axis (mm)
   * @param bodyWidth   Body width perpendicular to pad axis (mm)
   * @param padLength   Individual pad length (mm)
   * @param padWidth    Individual pad width (mm)
   * @param padSpacing  Centre-to-centre distance between pads (mm)
   */
  static createSMDChip(
    name: string,
    bodyLength: number,
    bodyWidth: number,
    padLength: number,
    padWidth: number,
    padSpacing: number,
  ): Footprint {
    const fp = createSMDChipFootprint({
      code: name,
      bodyL: bodyLength,
      bodyW: bodyWidth,
      padL: padLength,
      padW: padWidth,
      padSpacing,
    });
    fp.name = name;
    return fp;
  }

  /**
   * Create a SOIC-style footprint.
   *
   * @param name      Footprint name
   * @param pinCount  Total pin count (must be even)
   * @param pitch     Pin pitch in mm (typically 1.27)
   * @param bodyWidth Body width in mm (typically 3.9 for narrow, 5.3 for wide)
   */
  static createSOIC(
    name: string,
    pinCount: number,
    pitch: number,
    bodyWidth: number,
  ): Footprint {
    const fp = createSOIC(pinCount, pitch, bodyWidth);
    fp.name = name;
    return fp;
  }

  /**
   * Create a QFP-style footprint.
   *
   * @param name      Footprint name
   * @param pinCount  Total pin count (must be divisible by 4)
   * @param pitch     Pin pitch in mm
   * @param bodySize  Body side length in mm (square body)
   */
  static createQFP(
    name: string,
    pinCount: number,
    pitch: number,
    bodySize: number,
  ): Footprint {
    const fp = createQFP(pinCount, pitch, bodySize);
    fp.name = name;
    return fp;
  }

  /**
   * Create a DIP (Dual In-line Package) footprint.
   *
   * @param name        Footprint name
   * @param pinCount    Total pin count (must be even)
   * @param pitch       Pin pitch in mm (typically 2.54)
   * @param rowSpacing  Row centre-to-centre spacing in mm (typically 7.62)
   */
  static createDIP(
    name: string,
    pinCount: number,
    pitch: number,
    rowSpacing: number,
  ): Footprint {
    const fp = createDIP(pinCount, pitch, rowSpacing);
    fp.name = name;
    return fp;
  }

  /**
   * Create a pin header footprint.
   *
   * @param name   Footprint name
   * @param rows   Number of rows (pins per column)
   * @param cols   Number of columns (1 or 2 typical)
   * @param pitch  Pin pitch in mm (typically 2.54)
   */
  static createPinHeader(
    name: string,
    rows: number,
    cols: number,
    pitch: number,
  ): Footprint {
    const fp = createPinHeader(rows, cols, pitch);
    fp.name = name;
    return fp;
  }

  /**
   * Create a QFN (Quad Flat No-lead) footprint.
   *
   * @param name          Footprint name
   * @param pinCount      Total pin count (divisible by 4)
   * @param pitch         Pin pitch in mm
   * @param bodySize      Body side length in mm (square)
   * @param padWidth      Pad width in mm
   * @param padLength     Pad length in mm
   * @param hasThermalPad Whether to add an exposed/thermal pad in the centre
   */
  static createQFN(
    name: string,
    pinCount: number,
    pitch: number,
    bodySize: number,
    padWidth: number,
    padLength: number,
    hasThermalPad: boolean,
  ): Footprint {
    const fp = createQFN(pinCount, pitch, bodySize, padWidth, padLength, hasThermalPad);
    fp.name = name;
    return fp;
  }
}
