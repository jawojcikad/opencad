import { Vector2D } from '../math/vector2d';
import { Identifiable, Named, Positioned, UUID } from './base';
import { Pin } from './pin';

// ─── Graphical primitives used inside symbols ──────────────

export interface SymbolLine {
  start: Vector2D;
  end: Vector2D;
  strokeWidth: number;
}

export interface SymbolArc {
  center: Vector2D;
  radius: number;
  startAngle: number;
  endAngle: number;
  strokeWidth: number;
}

export interface SymbolRectangle {
  topLeft: Vector2D;
  bottomRight: Vector2D;
  strokeWidth: number;
  filled: boolean;
}

export interface SymbolCircle {
  center: Vector2D;
  radius: number;
  strokeWidth: number;
  filled: boolean;
}

export interface SymbolText {
  position: Vector2D;
  text: string;
  fontSize: number;
  rotation: number;
  visible: boolean;
}

// ─── Symbol ────────────────────────────────────────────────

export interface Symbol extends Identifiable, Named {
  pins: Pin[];
  lines: SymbolLine[];
  arcs: SymbolArc[];
  rectangles: SymbolRectangle[];
  circles: SymbolCircle[];
  texts: SymbolText[];
}

// ─── Schematic component (placed symbol instance) ──────────

export interface SchematicComponent extends Identifiable, Positioned {
  /** UUID of the Component definition. */
  componentId: UUID;
  /** UUID of the Symbol definition used for rendering. */
  symbolId: UUID;
  /** Reference designator assigned on this sheet (e.g. "R1"). */
  reference: string;
  value: string;
  /** Per-pin net assignments, keyed by Pin.id → Net.id. */
  pinNetMap: Record<UUID, UUID>;
  mirrored: boolean;
}

// ─── Wires & connectivity ──────────────────────────────────

export interface Wire extends Identifiable {
  /** Polyline vertices. */
  points: Vector2D[];
  netId?: UUID;
}

export interface NetLabel extends Identifiable, Positioned {
  text: string;
  netId: UUID;
}

export interface PowerPort extends Identifiable, Positioned {
  name: string;
  netId: UUID;
  style: 'bar' | 'circle' | 'arrow';
}

export interface Junction extends Identifiable {
  position: Vector2D;
  netId?: UUID;
}

// ─── Bus ───────────────────────────────────────────────────

export interface Bus extends Identifiable {
  /** Labels of the nets this bus contains, e.g. ["D0","D1",…] */
  members: string[];
  points: Vector2D[];
}

export interface BusEntry extends Identifiable {
  position: Vector2D;
  /** Direction vector for the short diagonal line. */
  direction: Vector2D;
  busId: UUID;
  netId: UUID;
}

// ─── Hierarchical sheet symbol ─────────────────────────────

export interface HierarchicalSheetPin extends Identifiable, Named {
  position: Vector2D;
  netId: UUID;
  direction: 'input' | 'output' | 'bidirectional' | 'passive';
}

export interface HierarchicalSheet extends Identifiable, Named, Positioned {
  sheetId: UUID; // points to the child Sheet
  size: Vector2D; // width, height of the rectangle
  pins: HierarchicalSheetPin[];
}

// ─── Sheet & document ──────────────────────────────────────

export interface Sheet extends Identifiable, Named {
  components: SchematicComponent[];
  wires: Wire[];
  netLabels: NetLabel[];
  powerPorts: PowerPort[];
  junctions: Junction[];
  buses: Bus[];
  busEntries: BusEntry[];
  hierarchicalSheets: HierarchicalSheet[];
}

export interface SchematicDocument extends Identifiable, Named {
  sheets: Sheet[];
}
