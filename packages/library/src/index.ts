// --------------------------------------------------------------------------
// packages/library/src/index.ts
// Main barrel export for the @opencad/library package.
// --------------------------------------------------------------------------

// ── Symbols ──
export {
  createResistorSymbol,
  createCapacitorSymbol,
  createInductorSymbol,
  createCrystalSymbol,
  createDiodeSymbol,
  createLEDSymbol,
  createNPNSymbol,
  createPNPSymbol,
  createNMOSFETSymbol,
  createPMOSFETSymbol,
  createOpAmpSymbol,
  createANDGateSymbol,
  createORGateSymbol,
  createNOTGateSymbol,
  createNANDGateSymbol,
  createNORGateSymbol,
  createXORGateSymbol,
  createICSymbol,
  createConnectorSymbol,
  createGroundSymbol,
  createVCCSymbol,
  getAllBuiltinSymbols,
} from './symbols/basic-symbols';

export type {
  GraphicPrimitive,
  GraphicLine,
  GraphicRect,
  GraphicCircle,
  GraphicArc,
  GraphicPolyline,
  GraphicText,
} from './symbols/basic-symbols';

export { SymbolFactory } from './symbols/symbol-factory';

// ── Footprints ──
export { getAllBuiltinFootprints } from './footprints/basic-footprints';
export { FootprintFactory } from './footprints/footprint-factory';

// ── Library manager ──
export { LibraryManager } from './manager/library-manager';
export type { LibraryCategory } from './manager/library-manager';

// ── KiCad import ──
export { parseKiCadSymbolLibrary } from './formats/kicad-symbol-parser';
export {
  parseKiCadFootprint,
  parseKiCadFootprintLibrary,
} from './formats/kicad-footprint-parser';
