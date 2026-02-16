// --------------------------------------------------------------------------
// packages/library/src/symbols/basic-symbols.ts
// Built-in schematic symbols for OpenCAD
// All coordinates in mils (1 mil = 0.001 inch). Grid = 50 mil.
// Pin position = wire connection point. Pin orientation = direction from
// connection point toward the symbol body.
// --------------------------------------------------------------------------

import { Vector2D } from '@opencad/core/math/vector2d';
import {
  Symbol,
  Pin,
  PinType,
  PinShape,
  generateId,
} from '@opencad/core';

/* ------------------------------------------------------------------ */
/*  Graphic-primitive helper types                                     */
/* ------------------------------------------------------------------ */

export interface GraphicLine {
  type: 'line';
  start: Vector2D;
  end: Vector2D;
  width: number;
}

export interface GraphicRect {
  type: 'rectangle';
  start: Vector2D;
  end: Vector2D;
  width: number;
  fill?: boolean;
}

export interface GraphicCircle {
  type: 'circle';
  center: Vector2D;
  radius: number;
  width: number;
  fill?: boolean;
}

export interface GraphicArc {
  type: 'arc';
  center: Vector2D;
  radius: number;
  startAngle: number;
  endAngle: number;
  width: number;
}

export interface GraphicPolyline {
  type: 'polyline';
  points: Vector2D[];
  width: number;
  fill?: boolean;
}

export interface GraphicText {
  type: 'text';
  text: string;
  position: Vector2D;
  size: number;
  rotation?: number;
}

export type GraphicPrimitive =
  | GraphicLine
  | GraphicRect
  | GraphicCircle
  | GraphicArc
  | GraphicPolyline
  | GraphicText;

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function pt(x: number, y: number): Vector2D {
  return new Vector2D(x, y);
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w = 10,
): GraphicLine {
  return { type: 'line', start: pt(x1, y1), end: pt(x2, y2), width: w };
}

function rect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w = 10,
  fill = false,
): GraphicRect {
  return { type: 'rectangle', start: pt(x1, y1), end: pt(x2, y2), width: w, fill };
}

function circle(
  cx: number,
  cy: number,
  r: number,
  w = 10,
  fill = false,
): GraphicCircle {
  return { type: 'circle', center: pt(cx, cy), radius: r, width: w, fill };
}

function arc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
  w = 10,
): GraphicArc {
  return { type: 'arc', center: pt(cx, cy), radius: r, startAngle, endAngle, width: w };
}

function polyline(
  pts: Vector2D[],
  w = 10,
  fill = false,
): GraphicPolyline {
  return { type: 'polyline', points: pts, width: w, fill };
}

function text(
  t: string,
  x: number,
  y: number,
  size = 50,
  rotation = 0,
): GraphicText {
  return { type: 'text', text: t, position: pt(x, y), size, rotation };
}

function pin(
  name: string,
  number: string,
  x: number,
  y: number,
  orientation: number,
  type: PinType = PinType.Passive,
  shape: PinShape = PinShape.Line,
  length = 100,
): Pin {
  return {
    id: generateId(),
    name,
    number,
    position: pt(x, y),
    orientation,
    type,
    shape,
    length,
  };
}

function sym(
  name: string,
  description: string,
  graphics: GraphicPrimitive[],
  pins: Pin[],
  properties: Record<string, string> = {},
): Symbol {
  return {
    id: generateId(),
    name,
    pins,
    lines: [],
    arcs: [],
    rectangles: [],
    circles: [],
    texts: [],
  };
}

/* ================================================================== */
/*  PASSIVE COMPONENTS                                                 */
/* ================================================================== */

/** IEC-style rectangular resistor. Body 60×20 centred at origin. */
export function createResistorSymbol(): Symbol {
  return sym('Resistor', 'Generic resistor', [
    rect(-30, -10, 30, 10),
    text('R', 0, -25, 40),
  ], [
    pin('1', '1', -100, 0, 0, PinType.Passive),
    pin('2', '2', 100, 0, 180, PinType.Passive),
  ], { Value: '10k' });
}

/** Capacitor – two parallel lines. */
export function createCapacitorSymbol(): Symbol {
  return sym('Capacitor', 'Generic capacitor', [
    line(-30, -5, -30, -40),
    line(-30, -5, -30, 40),
    line(-10, -5, -10, -40),
    line(-10, -5, -10, 40),
    // Rewrite as two vertical plates at x = -8 and x = 8
    line(-8, -30, -8, 30),
    line(8, -30, 8, 30),
    text('C', 0, -45, 40),
  ], [
    pin('1', '1', -100, 0, 0, PinType.Passive),
    pin('2', '2', 100, 0, 180, PinType.Passive),
  ], { Value: '100n' });
}

/** Inductor – four arcs. */
export function createInductorSymbol(): Symbol {
  const arcs: GraphicArc[] = [];
  const arcRadius = 15;
  for (let i = 0; i < 4; i++) {
    const cx = -45 + i * 30 + 15;
    arcs.push(arc(cx, 0, arcRadius, 0, 180));
  }
  return sym('Inductor', 'Generic inductor', [
    ...arcs,
    text('L', 0, -25, 40),
  ], [
    pin('1', '1', -100, 0, 0, PinType.Passive),
    pin('2', '2', 100, 0, 180, PinType.Passive),
  ], { Value: '10u' });
}

/** Crystal – rectangle with two vertical lines. */
export function createCrystalSymbol(): Symbol {
  return sym('Crystal', 'Crystal oscillator', [
    rect(-15, -25, 15, 25),
    line(-25, -30, -25, 30),
    line(25, -30, 25, 30),
    text('Y', 0, -45, 40),
  ], [
    pin('1', '1', -100, 0, 0, PinType.Passive),
    pin('2', '2', 100, 0, 180, PinType.Passive),
  ], { Value: '16MHz' });
}

/* ================================================================== */
/*  DIODES                                                             */
/* ================================================================== */

/** Standard diode – triangle + bar. Anode left, Cathode right. */
export function createDiodeSymbol(): Symbol {
  return sym('Diode', 'Generic diode', [
    // Triangle (anode → cathode)
    polyline([pt(-30, 0), pt(30, 30), pt(30, -30), pt(-30, 0)], 10, true),
    // Cathode bar
    line(30, -30, 30, 30),
    text('D', 0, -45, 40),
  ], [
    pin('A', '1', -100, 0, 0, PinType.Passive),
    pin('K', '2', 100, 0, 180, PinType.Passive),
  ]);
}

/** LED – diode with two small arrows. */
export function createLEDSymbol(): Symbol {
  return sym('LED', 'Light-emitting diode', [
    // Triangle
    polyline([pt(-30, 0), pt(30, 30), pt(30, -30), pt(-30, 0)], 10, true),
    // Cathode bar
    line(30, -30, 30, 30),
    // Arrows (light emission)
    line(15, -35, 30, -55),
    line(30, -55, 20, -50),
    line(30, -55, 25, -45),
    line(30, -35, 45, -55),
    line(45, -55, 35, -50),
    line(45, -55, 40, -45),
    text('LED', 0, -60, 40),
  ], [
    pin('A', '1', -100, 0, 0, PinType.Passive),
    pin('K', '2', 100, 0, 180, PinType.Passive),
  ]);
}

/* ================================================================== */
/*  BIPOLAR TRANSISTORS                                                */
/* ================================================================== */

/** NPN: Base left, Collector top-right, Emitter bottom-right. */
export function createNPNSymbol(): Symbol {
  return sym('NPN', 'NPN bipolar transistor', [
    // Collector vertical line (body)
    line(-20, -40, -20, 40),
    // Base line stub
    line(-20, 0, -20, 0),
    // Collector line
    line(-20, -20, 40, -50),
    // Emitter line
    line(-20, 20, 40, 50),
    // Emitter arrow
    polyline([pt(25, 38), pt(40, 50), pt(30, 48)], 8),
    // Circle (body)
    circle(10, 0, 50, 6),
    text('Q', 55, 0, 40),
  ], [
    pin('B', '1', -100, 0, 0, PinType.Input),
    pin('C', '2', 40, -100, 270, PinType.Passive),
    pin('E', '3', 40, 100, 90, PinType.Passive),
  ]);
}

/** PNP: same geometry, reversed emitter arrow. */
export function createPNPSymbol(): Symbol {
  return sym('PNP', 'PNP bipolar transistor', [
    line(-20, -40, -20, 40),
    line(-20, -20, 40, -50),
    line(-20, 20, 40, 50),
    // Emitter arrow points INTO the body for PNP
    polyline([pt(-10, 14), pt(-20, 20), pt(-12, 24)], 8),
    circle(10, 0, 50, 6),
    text('Q', 55, 0, 40),
  ], [
    pin('B', '1', -100, 0, 0, PinType.Input),
    pin('C', '2', 40, -100, 270, PinType.Passive),
    pin('E', '3', 40, 100, 90, PinType.Passive),
  ]);
}

/* ================================================================== */
/*  MOSFETs                                                            */
/* ================================================================== */

/** N-channel MOSFET (enhancement mode). Gate left, Drain top, Source bottom. */
export function createNMOSFETSymbol(): Symbol {
  return sym('N-MOSFET', 'N-channel MOSFET', [
    // Gate vertical line
    line(-40, -30, -40, 30),
    // Channel line (broken to show enhancement mode)
    line(-25, -35, -25, -10),
    line(-25, -5, -25, 5),
    line(-25, 10, -25, 35),
    // Gate input horizontal
    line(-40, 0, -40, 0), // stub (pin connects here via pin length)
    // Drain connection
    line(-25, -25, 30, -25),
    line(30, -25, 30, -50),
    // Source connection
    line(-25, 25, 30, 25),
    line(30, 25, 30, 50),
    // Body connection to source
    line(-25, 0, 30, 0),
    line(30, 0, 30, 25),
    // Arrow on source (N-channel: points inward)
    polyline([pt(10, 0), pt(20, -5), pt(20, 5), pt(10, 0)], 6, true),
    circle(5, 0, 55, 6),
    text('M', 60, 0, 40),
  ], [
    pin('G', '1', -100, 0, 0, PinType.Input),
    pin('D', '2', 30, -100, 270, PinType.Passive),
    pin('S', '3', 30, 100, 90, PinType.Passive),
  ]);
}

/** P-channel MOSFET (enhancement mode). */
export function createPMOSFETSymbol(): Symbol {
  return sym('P-MOSFET', 'P-channel MOSFET', [
    line(-40, -30, -40, 30),
    line(-25, -35, -25, -10),
    line(-25, -5, -25, 5),
    line(-25, 10, -25, 35),
    line(-25, -25, 30, -25),
    line(30, -25, 30, -50),
    line(-25, 25, 30, 25),
    line(30, 25, 30, 50),
    line(-25, 0, 30, 0),
    line(30, 0, 30, 25),
    // Arrow on source (P-channel: points outward)
    polyline([pt(20, 0), pt(10, -5), pt(10, 5), pt(20, 0)], 6, true),
    // Gate bubble for P-channel
    circle(-45, 0, 5, 6),
    circle(5, 0, 55, 6),
    text('M', 60, 0, 40),
  ], [
    pin('G', '1', -100, 0, 0, PinType.Input),
    pin('D', '2', 30, -100, 270, PinType.Passive),
    pin('S', '3', 30, 100, 90, PinType.Passive),
  ]);
}

/* ================================================================== */
/*  OP-AMP                                                             */
/* ================================================================== */

/**
 * Op-Amp: triangle body, 5 pins.
 * +In (non-inv) and −In (inv) on left, Out on right, V+ top, V− bottom.
 */
export function createOpAmpSymbol(): Symbol {
  return sym('OpAmp', 'Operational amplifier', [
    // Triangle body
    polyline([pt(-60, -70), pt(-60, 70), pt(80, 0), pt(-60, -70)], 10),
    // Plus sign near +In
    line(-45, -30, -45, -10),
    line(-55, -20, -35, -20),
    // Minus sign near −In
    line(-55, 20, -35, 20),
    text('U', 10, -30, 40),
  ], [
    pin('+In', '1', -150, -30, 0, PinType.Input),
    pin('-In', '2', -150, 30, 0, PinType.Input),
    pin('Out', '3', 150, 0, 180, PinType.Output),
    pin('V+', '4', 0, -100, 270, PinType.PowerInput),
    pin('V-', '5', 0, 100, 90, PinType.PowerInput),
  ]);
}

/* ================================================================== */
/*  LOGIC GATES                                                        */
/* ================================================================== */

/** AND gate – distinctive shape. */
export function createANDGateSymbol(): Symbol {
  return sym('AND', '2-input AND gate', [
    // Left side vertical
    line(-50, -40, -50, 40),
    // Top & bottom horizontal to arc centre
    line(-50, -40, 0, -40),
    line(-50, 40, 0, 40),
    // Right-side arc
    arc(0, 0, 40, -90, 90),
    text('&', -20, 0, 40),
  ], [
    pin('A', '1', -150, -20, 0, PinType.Input),
    pin('B', '2', -150, 20, 0, PinType.Input),
    pin('Y', '3', 100, 0, 180, PinType.Output),
  ]);
}

/** OR gate – distinctive shape. */
export function createORGateSymbol(): Symbol {
  return sym('OR', '2-input OR gate', [
    // Curved left side
    arc(-70, 0, 50, -40, 40),
    // Top curve
    arc(-10, -80, 90, 240, 270),
    // Bottom curve
    arc(-10, 80, 90, 90, 120),
    // Straight segments connecting curves
    line(-50, -35, 0, -40),
    line(-50, 35, 0, 40),
    text('≥1', -20, 0, 35),
  ], [
    pin('A', '1', -150, -20, 0, PinType.Input),
    pin('B', '2', -150, 20, 0, PinType.Input),
    pin('Y', '3', 100, 0, 180, PinType.Output),
  ]);
}

/** NOT (Inverter) gate. */
export function createNOTGateSymbol(): Symbol {
  return sym('NOT', 'Inverter gate', [
    // Triangle
    polyline([pt(-50, -40), pt(-50, 40), pt(30, 0), pt(-50, -40)], 10),
    // Bubble
    circle(37, 0, 7),
    text('1', -20, 0, 35),
  ], [
    pin('A', '1', -150, 0, 0, PinType.Input),
    pin('Y', '2', 100, 0, 180, PinType.Output, PinShape.Inverted),
  ]);
}

/** NAND gate – AND + bubble. */
export function createNANDGateSymbol(): Symbol {
  return sym('NAND', '2-input NAND gate', [
    line(-50, -40, -50, 40),
    line(-50, -40, 0, -40),
    line(-50, 40, 0, 40),
    arc(0, 0, 40, -90, 90),
    circle(47, 0, 7),
    text('&', -20, 0, 40),
  ], [
    pin('A', '1', -150, -20, 0, PinType.Input),
    pin('B', '2', -150, 20, 0, PinType.Input),
    pin('Y', '3', 110, 0, 180, PinType.Output, PinShape.Inverted),
  ]);
}

/** NOR gate – OR + bubble. */
export function createNORGateSymbol(): Symbol {
  return sym('NOR', '2-input NOR gate', [
    arc(-70, 0, 50, -40, 40),
    arc(-10, -80, 90, 240, 270),
    arc(-10, 80, 90, 90, 120),
    line(-50, -35, 0, -40),
    line(-50, 35, 0, 40),
    circle(47, 0, 7),
    text('≥1', -20, 0, 35),
  ], [
    pin('A', '1', -150, -20, 0, PinType.Input),
    pin('B', '2', -150, 20, 0, PinType.Input),
    pin('Y', '3', 110, 0, 180, PinType.Output, PinShape.Inverted),
  ]);
}

/** XOR gate. */
export function createXORGateSymbol(): Symbol {
  return sym('XOR', '2-input XOR gate', [
    arc(-70, 0, 50, -40, 40),
    // Extra curved line for XOR
    arc(-80, 0, 50, -40, 40),
    arc(-10, -80, 90, 240, 270),
    arc(-10, 80, 90, 90, 120),
    line(-50, -35, 0, -40),
    line(-50, 35, 0, 40),
    text('=1', -20, 0, 35),
  ], [
    pin('A', '1', -150, -20, 0, PinType.Input),
    pin('B', '2', -150, 20, 0, PinType.Input),
    pin('Y', '3', 100, 0, 180, PinType.Output),
  ]);
}

/* ================================================================== */
/*  GENERIC IC  (DIP-style rectangle, configurable pin count)          */
/* ================================================================== */

/**
 * Generic IC in DIP-style layout.
 * @param name   symbol name (shown inside rectangle)
 * @param pinNames  array of pin names, left-side first then right-side
 * @param pinsPerSide  how many pins on each side (default: half of total)
 */
export function createICSymbol(
  name: string,
  pinNames: string[],
  pinsPerSide?: number,
): Symbol {
  const total = pinNames.length;
  const leftCount = pinsPerSide ?? Math.ceil(total / 2);
  const rightCount = total - leftCount;
  const maxPins = Math.max(leftCount, rightCount);
  const pinSpacing = 100; // mils between pins
  const halfH = (maxPins * pinSpacing) / 2;
  const bodyW = 200;
  const halfW = bodyW / 2;

  const graphics: GraphicPrimitive[] = [
    rect(-halfW, -halfH, halfW, halfH),
    text(name, 0, -halfH - 20, 40),
  ];

  const pins: Pin[] = [];

  // Left-side pins (numbered 1…leftCount)
  for (let i = 0; i < leftCount; i++) {
    const y = -halfH + pinSpacing / 2 + i * pinSpacing;
    pins.push(
      pin(pinNames[i], String(i + 1), -halfW - 100, y, 0, PinType.Unspecified),
    );
    graphics.push(text(pinNames[i], -halfW + 10, y, 30));
  }

  // Right-side pins (numbered leftCount+1…total), listed bottom→top
  for (let i = 0; i < rightCount; i++) {
    const y = halfH - pinSpacing / 2 - i * pinSpacing;
    const idx = leftCount + i;
    pins.push(
      pin(
        pinNames[idx],
        String(idx + 1),
        halfW + 100,
        y,
        180,
        PinType.Unspecified,
      ),
    );
    graphics.push(text(pinNames[idx], halfW - 10, y, 30));
  }

  return sym(name, `Generic IC: ${name}`, graphics, pins);
}

/* ================================================================== */
/*  CONNECTOR (single-row, configurable pin count)                     */
/* ================================================================== */

export function createConnectorSymbol(
  name: string,
  pinCount: number,
  type: 'male' | 'female' = 'male',
): Symbol {
  const pinSpacing = 100;
  const halfH = (pinCount * pinSpacing) / 2;
  const bodyW = 80;

  const graphics: GraphicPrimitive[] = [
    rect(-bodyW / 2, -halfH, bodyW / 2, halfH),
    text(name, 0, -halfH - 20, 35),
  ];

  const pins: Pin[] = [];
  for (let i = 0; i < pinCount; i++) {
    const y = -halfH + pinSpacing / 2 + i * pinSpacing;
    pins.push(
      pin(
        String(i + 1),
        String(i + 1),
        -bodyW / 2 - 100,
        y,
        0,
        PinType.Passive,
      ),
    );
    // small circle or line inside body to mark pin
    if (type === 'male') {
      graphics.push(line(-bodyW / 2, y, -bodyW / 2 + 20, y, 8));
    } else {
      graphics.push(arc(-bodyW / 2 + 10, y, 8, 0, 360, 6));
    }
  }
  return sym(name, `${pinCount}-pin ${type} connector`, graphics, pins);
}

/* ================================================================== */
/*  POWER SYMBOLS                                                      */
/* ================================================================== */

/** GND symbol – flat bar with descending lines. */
export function createGroundSymbol(): Symbol {
  return sym('GND', 'Ground', [
    line(0, 0, 0, 30),
    line(-30, 30, 30, 30),
    line(-20, 40, 20, 40),
    line(-10, 50, 10, 50),
    text('GND', 0, 65, 35),
  ], [
    pin('GND', '1', 0, -50, 270, PinType.PowerOutput),
  ]);
}

/** VCC / VDD – upward bar. */
export function createVCCSymbol(name = 'VCC'): Symbol {
  return sym(name, `${name} power rail`, [
    line(0, 0, 0, -30),
    line(-20, -30, 20, -30),
    line(-20, -30, 0, -50),
    line(20, -30, 0, -50),
    text(name, 0, -65, 35),
  ], [
    pin(name, '1', 0, 50, 90, PinType.PowerOutput),
  ]);
}

/* ================================================================== */
/*  EXPORT: All built-in symbols collected in one array                 */
/* ================================================================== */

/**
 * Returns every built-in symbol. Each call produces fresh instances so
 * IDs are unique per import.
 */
export function getAllBuiltinSymbols(): Symbol[] {
  return [
    createResistorSymbol(),
    createCapacitorSymbol(),
    createInductorSymbol(),
    createCrystalSymbol(),
    createDiodeSymbol(),
    createLEDSymbol(),
    createNPNSymbol(),
    createPNPSymbol(),
    createNMOSFETSymbol(),
    createPMOSFETSymbol(),
    createOpAmpSymbol(),
    createANDGateSymbol(),
    createORGateSymbol(),
    createNOTGateSymbol(),
    createNANDGateSymbol(),
    createNORGateSymbol(),
    createXORGateSymbol(),
    createICSymbol('IC8', ['1', '2', '3', '4', '5', '6', '7', '8']),
    createConnectorSymbol('Conn_2', 2),
    createGroundSymbol(),
    createVCCSymbol('VCC'),
    createVCCSymbol('VDD'),
  ];
}
