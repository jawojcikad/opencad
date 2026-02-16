// @opencad/schematic - Schematic capture editor

// ─── Editor ──────────────────────────────────────────────────────────────────
export { SchematicEditor } from './editor/schematic-editor';
export {
  type SchematicTool,
  SelectTool,
  WireTool,
  PlaceComponentTool,
  PlaceNetLabelTool,
} from './editor/tools';
export {
  PlaceComponentCommand,
  MoveComponentCommand,
  DeleteComponentCommand,
  DrawWireCommand,
  DeleteWireCommand,
  PlaceNetLabelCommand,
  RotateComponentCommand,
} from './editor/commands';

// ─── Rendering ───────────────────────────────────────────────────────────────
export { SymbolRenderer } from './rendering/symbol-renderer';
export { WireRenderer } from './rendering/wire-renderer';
export { SchematicRenderer } from './rendering/schematic-renderer';

// ─── ERC ─────────────────────────────────────────────────────────────────────
export {
  ERCViolationType,
  type ERCViolation,
  ERCChecker,
} from './erc/erc';

// ─── Netlist ─────────────────────────────────────────────────────────────────
export {
  type NetlistEntry,
  type Netlist,
  NetlistExtractor,
} from './netlist/netlist-extractor';
