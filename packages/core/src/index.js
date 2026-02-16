// ── Math ─────────────────────────────────────────────────
export { Vector2D, BBox, Matrix3, lineIntersection, pointToLineDistance, pointOnLineSegment, polygonContainsPoint, polygonArea, circleContainsPoint, arcPoints, } from './math';
// ── Units ────────────────────────────────────────────────
export { Unit, mmToMil, milToMm, mmToInch, inchToMm, convert, formatValue, mmToNm, nmToMm, milToNm, nmToMil, } from './units';
// ── Model ────────────────────────────────────────────────
export { generateId, PinType, PinShape, Layer, PadShape, PadType, defaultDesignRules, } from './model';
// ── Events ───────────────────────────────────────────────
export { EventBus, CommandHistory } from './events';
// ── Spatial ──────────────────────────────────────────────
export { RTree } from './spatial';
//# sourceMappingURL=index.js.map