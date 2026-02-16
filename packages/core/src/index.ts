// ── Math ─────────────────────────────────────────────────
export {
  Vector2D,
  BBox,
  Matrix3,
  lineIntersection,
  pointToLineDistance,
  pointOnLineSegment,
  polygonContainsPoint,
  polygonArea,
  circleContainsPoint,
  arcPoints,
} from './math';

// ── Units ────────────────────────────────────────────────
export {
  Unit,
  mmToMil,
  milToMm,
  mmToInch,
  inchToMm,
  convert,
  formatValue,
  mmToNm,
  nmToMm,
  milToNm,
  nmToMil,
} from './units';

// ── Model ────────────────────────────────────────────────
export {
  type UUID,
  generateId,
  type Identifiable,
  type Named,
  type Positioned,
  type Net,
  type NetClass,
  PinType,
  PinShape,
  type Pin,
  type Component,
  type SymbolLine,
  type SymbolArc,
  type SymbolRectangle,
  type SymbolCircle,
  type SymbolText,
  type Symbol,
  type SchematicComponent,
  type Wire,
  type NetLabel,
  type PowerPort,
  type Junction,
  type Bus,
  type BusEntry,
  type HierarchicalSheetPin,
  type HierarchicalSheet,
  type Sheet,
  type SchematicDocument,
  Layer,
  PadShape,
  PadType,
  type Pad,
  type FootprintLine,
  type FootprintArc,
  type FootprintCircle,
  type FootprintText,
  type Model3DRef,
  type Footprint,
  type Track,
  type Via,
  type CopperZoneFillSettings,
  type CopperZone,
  type BoardOutline,
  type LayerStackEntry,
  type PCBDocument,
  type DesignRules,
  defaultDesignRules,
  normalizePCBDocument,
} from './model';

// ── Events ───────────────────────────────────────────────
export { EventBus, type Command, CommandHistory } from './events';

// ── Spatial ──────────────────────────────────────────────
export { type SpatialItem, RTree } from './spatial';
