// --------------------------------------------------------------------------
// packages/library/src/symbols/symbol-factory.ts
// Factory for symbol lookup, creation of generic ICs and connectors.
// --------------------------------------------------------------------------

import { Symbol, generateId } from '@opencad/core';

import {
  getAllBuiltinSymbols,
  createICSymbol,
  createConnectorSymbol,
} from './basic-symbols';

export class SymbolFactory {
  private static _cache: Symbol[] | null = null;

  /** Lazy-initialised cache of built-in symbols. */
  private static ensureCache(): Symbol[] {
    if (!this._cache) {
      this._cache = getAllBuiltinSymbols();
    }
    return this._cache;
  }

  /** Get every built-in symbol template. */
  static getBuiltinSymbols(): Symbol[] {
    return this.ensureCache();
  }

  /**
   * Look up a symbol by name (case-insensitive).
   * Returns `undefined` when no match is found.
   */
  static getSymbol(name: string): Symbol | undefined {
    const lower = name.toLowerCase();
    return this.ensureCache().find((s) => s.name.toLowerCase() === lower);
  }

  /**
   * Create a generic IC symbol (DIP-style rectangle) with the given
   * pin names.  `pinsPerSide` defaults to half the total pin count.
   *
   * ```
   * const timer = SymbolFactory.createIC('NE555', [
   *   'GND','TRIG','OUT','RESET','CTRL','THRES','DISCH','VCC'
   * ]);
   * ```
   */
  static createIC(
    name: string,
    pinNames: string[],
    pinsPerSide?: number,
  ): Symbol {
    return createICSymbol(name, pinNames, pinsPerSide);
  }

  /**
   * Create a single-row connector symbol.
   *
   * @param name     Display name, e.g. "J1"
   * @param pinCount Number of pins
   * @param type     Visual style: `'male'` (stub) or `'female'` (arc)
   */
  static createConnector(
    name: string,
    pinCount: number,
    type: 'male' | 'female' = 'male',
  ): Symbol {
    return createConnectorSymbol(name, pinCount, type);
  }
}
