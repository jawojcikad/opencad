// --------------------------------------------------------------------------
// packages/library/src/footprints/basic-footprints.ts
// Built-in PCB footprints for OpenCAD.
// All dimensions in **millimetres**.  Pad positions follow IPC-7351 / IPC-SM-782.
// --------------------------------------------------------------------------

import { Vector2D } from '@opencad/core/math/vector2d';
import { BBox } from '@opencad/core/math/bbox';
import {
  Footprint,
  Pad,
  PadShape,
  PadType,
  Layer,
  generateId,
} from '@opencad/core';

import type { GraphicPrimitive } from '../symbols/basic-symbols';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function pt(x: number, y: number) {
  return new Vector2D(x, y);
}

function smdPad(
  num: string,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: PadShape = PadShape.Rect,
  rotation = 0,
): Pad {
  return {
    id: generateId(),
    number: num,
    position: pt(x, y),
    size: pt(w, h),
    shape,
    type: PadType.SMD,
    rotation,
    layers: [Layer.FCu, Layer.FMask, Layer.FPaste],
  };
}

function thPad(
  num: string,
  x: number,
  y: number,
  padDia: number,
  drillDia: number,
  shape: PadShape = PadShape.Circle,
): Pad {
  return {
    id: generateId(),
    number: num,
    position: pt(x, y),
    size: pt(padDia, padDia),
    shape,
    type: PadType.ThroughHole,
    rotation: 0,
    drill: drillDia,
    layers: [Layer.FCu, Layer.BCu, Layer.FMask, Layer.BMask],
  };
}

function ovalThPad(
  num: string,
  x: number,
  y: number,
  pw: number,
  ph: number,
  drillDia: number,
): Pad {
  return {
    id: generateId(),
    number: num,
    position: pt(x, y),
    size: pt(pw, ph),
    shape: PadShape.Oval,
    type: PadType.ThroughHole,
    rotation: 0,
    drill: drillDia,
    layers: [Layer.FCu, Layer.BCu, Layer.FMask, Layer.BMask],
  };
}

/** Silkscreen rectangle outline */
function silkRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w = 0.12,
): GraphicPrimitive[] {
  return [
    { type: 'line', start: pt(x1, y1), end: pt(x2, y1), width: w },
    { type: 'line', start: pt(x2, y1), end: pt(x2, y2), width: w },
    { type: 'line', start: pt(x2, y2), end: pt(x1, y2), width: w },
    { type: 'line', start: pt(x1, y2), end: pt(x1, y1), width: w },
  ];
}

/** Courtyard rectangle */
function courtyard(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Vector2D[] {
  return [pt(x1, y1), pt(x2, y1), pt(x2, y2), pt(x1, y2)];
}

function fpText(
  label: string,
  x: number,
  y: number,
  size = 1.0,
): GraphicPrimitive {
  return { type: 'text', text: label, position: pt(x, y), size };
}

function fp(
  name: string,
  description: string,
  pads: Pad[],
  graphics: GraphicPrimitive[],
  cy: Vector2D[],
  model3d?: Footprint['model3d'],
): Footprint {
  return {
    id: generateId(),
    name,
    position: new Vector2D(0, 0),
    rotation: 0,
    pads,
    lines: [],
    arcs: [],
    circles: [],
    texts: [],
    courtyard: cy,
    model3d,
  };
}

/* ================================================================== */
/*  SMD CHIP RESISTOR / CAPACITOR                                      */
/* ================================================================== */

interface ChipSpec {
  /** Imperial code, e.g. "0402" */
  code: string;
  /** Body length (mm) */
  bodyL: number;
  /** Body width (mm) */
  bodyW: number;
  /** Pad length (mm) */
  padL: number;
  /** Pad width (mm) */
  padW: number;
  /** Centre-to-centre pad spacing along length axis (mm) */
  padSpacing: number;
}

const CHIP_SPECS: ChipSpec[] = [
  { code: '0201', bodyL: 0.6,  bodyW: 0.3,  padL: 0.28, padW: 0.3,  padSpacing: 0.66 },
  { code: '0402', bodyL: 1.0,  bodyW: 0.5,  padL: 0.56, padW: 0.62, padSpacing: 1.0  },
  { code: '0603', bodyL: 1.6,  bodyW: 0.8,  padL: 0.8,  padW: 0.95, padSpacing: 1.6  },
  { code: '0805', bodyL: 2.0,  bodyW: 1.25, padL: 1.0,  padW: 1.45, padSpacing: 1.9  },
  { code: '1206', bodyL: 3.2,  bodyW: 1.6,  padL: 1.15, padW: 1.8,  padSpacing: 3.0  },
  { code: '1210', bodyL: 3.2,  bodyW: 2.5,  padL: 1.15, padW: 2.7,  padSpacing: 3.0  },
  { code: '2512', bodyL: 6.3,  bodyW: 3.2,  padL: 1.4,  padW: 3.4,  padSpacing: 6.2  },
];

function createSMDChipFootprint(spec: ChipSpec): Footprint {
  const x = spec.padSpacing / 2;
  const pads: Pad[] = [
    smdPad('1', -x, 0, spec.padL, spec.padW, PadShape.Rect),
    smdPad('2',  x, 0, spec.padL, spec.padW, PadShape.Rect),
  ];
  const halfBL = spec.bodyL / 2;
  const halfBW = spec.bodyW / 2;
  const cx = x + spec.padL / 2 + 0.2;
  const cy = Math.max(halfBW, spec.padW / 2) + 0.2;
  return fp(
    `C_${spec.code}`,
    `${spec.code} SMD chip (${spec.bodyL}x${spec.bodyW} mm)`,
    pads,
    [
      ...silkRect(-halfBL, -halfBW, halfBL, halfBW),
      fpText(`%R`, 0, -halfBW - 0.5, 0.5),
    ],
    courtyard(-cx, -cy, cx, cy),
    { path: `${spec.code}.step`, offset: {x:0,y:0,z:0}, rotation: {x:0,y:0,z:0}, scale: {x:1,y:1,z:1} },
  );
}

/* ================================================================== */
/*  THROUGH-HOLE RESISTOR (AXIAL)                                      */
/* ================================================================== */

function createAxialResistorFootprint(pitch: number): Footprint {
  const halfP = pitch / 2;
  const bodyL = pitch * 0.6;
  const halfBL = bodyL / 2;
  const bodyR = 1.3; // radius of body cylinder
  return fp(
    `R_Axial_${pitch}mm`,
    `Axial resistor, ${pitch} mm pitch`,
    [
      thPad('1', -halfP, 0, 1.6, 0.8),
      thPad('2',  halfP, 0, 1.6, 0.8),
    ],
    [
      ...silkRect(-halfBL, -bodyR, halfBL, bodyR),
      fpText('%R', 0, -bodyR - 0.8, 0.8),
    ],
    courtyard(-halfP - 1.0, -bodyR - 0.5, halfP + 1.0, bodyR + 0.5),
  );
}

/* ================================================================== */
/*  ELECTROLYTIC CAPACITOR (RADIAL)                                    */
/* ================================================================== */

function createRadialCapFootprint(
  diameter: number,
  pitch: number,
  drillDia = 0.8,
): Footprint {
  const r = diameter / 2;
  return fp(
    `CP_Radial_D${diameter}`,
    `Radial electrolytic capacitor, ${diameter} mm diameter, ${pitch} mm pitch`,
    [
      thPad('1', -pitch / 2, 0, 1.6, drillDia, PadShape.Rect), // square for pin 1
      thPad('2',  pitch / 2, 0, 1.6, drillDia),
    ],
    [
      { type: 'circle', center: pt(0, 0), radius: r, width: 0.12 },
      // Polarity mark
      { type: 'line', start: pt(-pitch / 2 - 0.5, -1), end: pt(-pitch / 2 - 0.5, 1), width: 0.2 },
      { type: 'line', start: pt(-pitch / 2 - 1, 0), end: pt(-pitch / 2, 0), width: 0.2 },
      fpText('%R', 0, -r - 0.8, 0.8),
    ],
    courtyard(-r - 0.5, -r - 0.5, r + 0.5, r + 0.5),
  );
}

/* ================================================================== */
/*  SOT-23 FAMILY                                                      */
/* ================================================================== */

function createSOT23(pinCount: 3 | 5 | 6): Footprint {
  const padW = 0.6;
  const padH = 1.1;
  const pitch = 0.95;
  const rowSpacing = 2.6; // centre-to-centre between rows (along body width)
  const halfRow = rowSpacing / 2;

  const pads: Pad[] = [];
  if (pinCount === 3) {
    // SOT-23-3: pin1 left-bottom, pin2 left-top, pin3 right-centre
    pads.push(smdPad('1', -halfRow, pitch / 2, padH, padW));
    pads.push(smdPad('2', -halfRow, -pitch / 2, padH, padW));
    pads.push(smdPad('3',  halfRow, 0, padH, padW));
  } else {
    // SOT-23-5 / SOT-23-6: pins on left and right in standard order
    const leftPins = pinCount === 5 ? 3 : 3;
    const rightPins = pinCount === 5 ? 2 : 3;
    for (let i = 0; i < leftPins; i++) {
      const y = (i - (leftPins - 1) / 2) * pitch;
      pads.push(smdPad(String(i + 1), -halfRow, y, padH, padW));
    }
    for (let i = 0; i < rightPins; i++) {
      const y = ((rightPins - 1) / 2 - i) * pitch;
      pads.push(smdPad(String(leftPins + i + 1), halfRow, y, padH, padW));
    }
  }

  const bodyL = 1.6;
  const bodyW = 2.9;
  const halfBL = bodyL / 2;
  const halfBW = bodyW / 2;

  return fp(
    `SOT-23-${pinCount}`,
    `SOT-23-${pinCount} package`,
    pads,
    [
      ...silkRect(-halfBW, -halfBL, halfBW, halfBL),
      // Pin 1 marker
      { type: 'circle', center: pt(-halfBW + 0.4, halfBL - 0.4), radius: 0.15, width: 0.12, fill: true },
      fpText('%R', 0, -halfBL - 0.8, 0.7),
    ],
    courtyard(-halfRow - padH / 2 - 0.25, -halfBL - 0.25, halfRow + padH / 2 + 0.25, halfBL + 0.25),
  );
}

/* ================================================================== */
/*  SOT-223                                                            */
/* ================================================================== */

function createSOT223(): Footprint {
  const pitch = 2.3;
  const rowSpacing = 6.5; // centre-to-centre
  const halfRow = rowSpacing / 2;
  const padW = 0.7;
  const padH = 1.5;
  const tabW = 3.2;
  const tabH = 1.5;

  const pads: Pad[] = [
    smdPad('1', -halfRow, -pitch, padH, padW),
    smdPad('2', -halfRow, 0, padH, padW),
    smdPad('3', -halfRow, pitch, padH, padW),
    smdPad('4',  halfRow, 0, tabH, tabW), // big tab pad
  ];

  const bodyL = 3.5;
  const bodyW = 6.5;

  return fp(
    'SOT-223',
    'SOT-223 package',
    pads,
    [
      ...silkRect(-bodyW / 2, -bodyL / 2, bodyW / 2, bodyL / 2),
      fpText('%R', 0, -bodyL / 2 - 0.8, 0.7),
    ],
    courtyard(-halfRow - padH / 2 - 0.25, -bodyL / 2 - 0.25, halfRow + padH / 2 + 0.25, bodyL / 2 + 0.25),
  );
}

/* ================================================================== */
/*  SOIC (Small-Outline IC)                                            */
/* ================================================================== */

function createSOIC(pinCount: number, pitch = 1.27, bodyWidth = 3.9): Footprint {
  const pinsPerSide = pinCount / 2;
  const rowSpacing = bodyWidth + 2 * 1.27; // pad centre-to-centre across body
  const halfRow = rowSpacing / 2;
  const padW = 0.6;
  const padH = 1.55;
  const halfSpan = ((pinsPerSide - 1) * pitch) / 2;

  const pads: Pad[] = [];
  // Left side: pin 1 at top-left going down
  for (let i = 0; i < pinsPerSide; i++) {
    const y = -halfSpan + i * pitch;
    pads.push(smdPad(String(i + 1), -halfRow, y, padH, padW));
  }
  // Right side: pins going bottom→top
  for (let i = 0; i < pinsPerSide; i++) {
    const y = halfSpan - i * pitch;
    pads.push(smdPad(String(pinsPerSide + i + 1), halfRow, y, padH, padW));
  }

  const bodyL = (pinsPerSide - 1) * pitch + 1.5;
  const halfBL = bodyL / 2;
  const halfBW = bodyWidth / 2;

  return fp(
    `SOIC-${pinCount}`,
    `SOIC-${pinCount}, ${pitch} mm pitch, ${bodyWidth} mm body width`,
    pads,
    [
      ...silkRect(-halfBW, -halfBL, halfBW, halfBL),
      { type: 'circle', center: pt(-halfBW + 0.6, -halfBL + 0.6), radius: 0.2, width: 0.12, fill: true },
      fpText('%R', 0, -halfBL - 0.8, 0.7),
    ],
    courtyard(
      -halfRow - padH / 2 - 0.25,
      -halfBL - 0.25,
      halfRow + padH / 2 + 0.25,
      halfBL + 0.25,
    ),
  );
}

/* ================================================================== */
/*  TSSOP                                                              */
/* ================================================================== */

function createTSSOP(pinCount: number): Footprint {
  const pitch = 0.65;
  const bodyWidth = 4.4;
  const pinsPerSide = pinCount / 2;
  const rowSpacing = bodyWidth + 2 * 0.95; // typical pad extent
  const halfRow = rowSpacing / 2;
  const padW = 0.4;
  const padH = 1.1;
  const halfSpan = ((pinsPerSide - 1) * pitch) / 2;

  const pads: Pad[] = [];
  for (let i = 0; i < pinsPerSide; i++) {
    const y = -halfSpan + i * pitch;
    pads.push(smdPad(String(i + 1), -halfRow, y, padH, padW));
  }
  for (let i = 0; i < pinsPerSide; i++) {
    const y = halfSpan - i * pitch;
    pads.push(smdPad(String(pinsPerSide + i + 1), halfRow, y, padH, padW));
  }

  const bodyL = (pinsPerSide - 1) * pitch + 1.2;
  const halfBL = bodyL / 2;
  const halfBW = bodyWidth / 2;

  return fp(
    `TSSOP-${pinCount}`,
    `TSSOP-${pinCount}, ${pitch} mm pitch`,
    pads,
    [
      ...silkRect(-halfBW, -halfBL, halfBW, halfBL),
      { type: 'circle', center: pt(-halfBW + 0.4, -halfBL + 0.4), radius: 0.15, width: 0.12, fill: true },
      fpText('%R', 0, -halfBL - 0.8, 0.6),
    ],
    courtyard(
      -halfRow - padH / 2 - 0.25,
      -halfBL - 0.25,
      halfRow + padH / 2 + 0.25,
      halfBL + 0.25,
    ),
  );
}

/* ================================================================== */
/*  QFP (Quad Flat Package)                                            */
/* ================================================================== */

function createQFP(
  pinCount: number,
  pitch: number,
  bodySize: number,
): Footprint {
  const pinsPerSide = pinCount / 4;
  const padW = pitch * 0.55;
  const padH = 1.5;
  const halfBody = bodySize / 2;
  const padCentre = halfBody + padH / 2 + 0.1; // pad centre distance from origin
  const halfSpan = ((pinsPerSide - 1) * pitch) / 2;

  const pads: Pad[] = [];
  let num = 1;
  // Bottom side (left→right)
  for (let i = 0; i < pinsPerSide; i++) {
    const x = -halfSpan + i * pitch;
    pads.push(smdPad(String(num++), x, padCentre, padW, padH));
  }
  // Right side (bottom→top)
  for (let i = 0; i < pinsPerSide; i++) {
    const y = halfSpan - i * pitch;
    pads.push(smdPad(String(num++), padCentre, y, padH, padW));
  }
  // Top side (right→left)
  for (let i = 0; i < pinsPerSide; i++) {
    const x = halfSpan - i * pitch;
    pads.push(smdPad(String(num++), x, -padCentre, padW, padH));
  }
  // Left side (top→bottom)
  for (let i = 0; i < pinsPerSide; i++) {
    const y = -halfSpan + i * pitch;
    pads.push(smdPad(String(num++), -padCentre, y, padH, padW));
  }

  const cExt = padCentre + padH / 2 + 0.25;
  return fp(
    `QFP-${pinCount}`,
    `QFP-${pinCount}, ${pitch} mm pitch, ${bodySize} mm body`,
    pads,
    [
      ...silkRect(-halfBody, -halfBody, halfBody, halfBody),
      { type: 'circle', center: pt(-halfBody + 0.6, halfBody - 0.6), radius: 0.25, width: 0.12, fill: true },
      fpText('%R', 0, 0, 0.8),
    ],
    courtyard(-cExt, -cExt, cExt, cExt),
  );
}

/* ================================================================== */
/*  QFN (Quad Flat No-lead)                                            */
/* ================================================================== */

function createQFN(
  pinCount: number,
  pitch: number,
  bodySize: number,
  padWidth: number,
  padLength: number,
  hasThermalPad: boolean,
): Footprint {
  const pinsPerSide = pinCount / 4;
  const halfBody = bodySize / 2;
  const padCentre = halfBody - padLength / 2 + 0.05;
  const halfSpan = ((pinsPerSide - 1) * pitch) / 2;

  const pads: Pad[] = [];
  let num = 1;

  // Bottom side
  for (let i = 0; i < pinsPerSide; i++) {
    const x = -halfSpan + i * pitch;
    pads.push(smdPad(String(num++), x, halfBody - padLength / 2, padWidth, padLength));
  }
  // Right side
  for (let i = 0; i < pinsPerSide; i++) {
    const y = halfSpan - i * pitch;
    pads.push(smdPad(String(num++), halfBody - padLength / 2, y, padLength, padWidth));
  }
  // Top side (right→left)
  for (let i = 0; i < pinsPerSide; i++) {
    const x = halfSpan - i * pitch;
    pads.push(smdPad(String(num++), x, -(halfBody - padLength / 2), padWidth, padLength));
  }
  // Left side (top→bottom)
  for (let i = 0; i < pinsPerSide; i++) {
    const y = -halfSpan + i * pitch;
    pads.push(smdPad(String(num++), -(halfBody - padLength / 2), y, padLength, padWidth));
  }

  // Thermal (exposed) pad
  if (hasThermalPad) {
    const tpSize = bodySize * 0.55;
    pads.push(smdPad(String(num), 0, 0, tpSize, tpSize, PadShape.Rect));
  }

  const cExt = halfBody + 0.25;
  return fp(
    `QFN-${pinCount}`,
    `QFN-${pinCount}, ${pitch} mm pitch, ${bodySize} mm body${hasThermalPad ? ', exposed pad' : ''}`,
    pads,
    [
      ...silkRect(-halfBody, -halfBody, halfBody, halfBody),
      { type: 'circle', center: pt(-halfBody + 0.4, halfBody - 0.4), radius: 0.2, width: 0.12, fill: true },
      fpText('%R', 0, 0, 0.7),
    ],
    courtyard(-cExt, -cExt, cExt, cExt),
  );
}

/* ================================================================== */
/*  DIP (Dual In-line Package)                                         */
/* ================================================================== */

function createDIP(pinCount: number, pitch = 2.54, rowSpacing = 7.62): Footprint {
  const pinsPerSide = pinCount / 2;
  const padDia = 1.6;
  const drillDia = 0.8;
  const halfRow = rowSpacing / 2;
  const halfSpan = ((pinsPerSide - 1) * pitch) / 2;

  const pads: Pad[] = [];
  // Left side: pin 1 at top-left, going down
  for (let i = 0; i < pinsPerSide; i++) {
    const y = -halfSpan + i * pitch;
    const shape = i === 0 ? PadShape.Rect : PadShape.Circle; // pin 1 square
    pads.push(thPad(String(i + 1), -halfRow, y, padDia, drillDia, shape));
  }
  // Right side: going bottom→top
  for (let i = 0; i < pinsPerSide; i++) {
    const y = halfSpan - i * pitch;
    pads.push(thPad(String(pinsPerSide + i + 1), halfRow, y, padDia, drillDia));
  }

  const bodyL = (pinsPerSide - 1) * pitch + 2.0;
  const halfBL = bodyL / 2;
  const bodyW = rowSpacing - 1.5;
  const halfBW = bodyW / 2;

  const graphics: GraphicPrimitive[] = [
    ...silkRect(-halfBW, -halfBL, halfBW, halfBL),
    // Notch at pin 1 end
    { type: 'arc', center: pt(0, -halfBL), radius: 1.0, startAngle: 0, endAngle: 180, width: 0.12 },
    fpText('%R', 0, -halfBL - 1.2, 0.8),
  ];

  const cExt_x = halfRow + padDia / 2 + 0.5;
  const cExt_y = halfBL + 0.5;
  return fp(
    `DIP-${pinCount}`,
    `DIP-${pinCount}, ${pitch} mm pitch, ${rowSpacing} mm row spacing`,
    pads,
    graphics,
    courtyard(-cExt_x, -cExt_y, cExt_x, cExt_y),
  );
}

/* ================================================================== */
/*  TO-92                                                              */
/* ================================================================== */

function createTO92(): Footprint {
  const pitch = 1.27;
  return fp(
    'TO-92',
    'TO-92 through-hole transistor package',
    [
      thPad('1', -pitch, 0, 1.5, 0.75, PadShape.Rect),
      thPad('2', 0, 0, 1.5, 0.75),
      thPad('3', pitch, 0, 1.5, 0.75),
    ],
    [
      { type: 'arc', center: pt(0, 0.7), radius: 2.5, startAngle: 200, endAngle: 340, width: 0.12 },
      { type: 'line', start: pt(-2.1, -1.0), end: pt(2.1, -1.0), width: 0.12 },
      fpText('%R', 0, -2.5, 0.7),
    ],
    courtyard(-2.5, -2.0, 2.5, 3.5),
  );
}

/* ================================================================== */
/*  TO-220                                                             */
/* ================================================================== */

function createTO220(): Footprint {
  const pitch = 2.54;
  return fp(
    'TO-220',
    'TO-220 through-hole power package',
    [
      thPad('1', -pitch, 0, 2.0, 1.0, PadShape.Rect),
      thPad('2', 0, 0, 2.0, 1.0),
      thPad('3', pitch, 0, 2.0, 1.0),
      // Mounting hole (non-plated)
      {
        id: generateId(),
        number: '',
        position: pt(0, -5.08),
        size: pt(4.0, 4.0),
        shape: PadShape.Circle,
        type: PadType.NPTH,
        rotation: 0,
        drill: 3.2,
        layers: [Layer.EdgeCuts],
      },
    ],
    [
      ...silkRect(-5.2, -8.5, 5.2, 2.0),
      fpText('%R', 0, -9.5, 0.8),
    ],
    courtyard(-6.0, -10.0, 6.0, 3.0),
  );
}

/* ================================================================== */
/*  TO-263 (D2PAK)                                                     */
/* ================================================================== */

function createTO263(): Footprint {
  const pitch = 2.54;
  const tabWidth = 6.0;
  const tabHeight = 5.0;
  return fp(
    'TO-263',
    'TO-263 / D2PAK power package',
    [
      smdPad('1', -pitch, 5.5, 1.0, 2.0),
      smdPad('2', 0, 5.5, 1.0, 2.0),
      smdPad('3', pitch, 5.5, 1.0, 2.0),
      smdPad('4', 0, -3.0, tabWidth, tabHeight), // thermal tab
    ],
    [
      ...silkRect(-5.0, -6.5, 5.0, 4.5),
      fpText('%R', 0, -7.5, 0.8),
    ],
    courtyard(-5.5, -7.0, 5.5, 7.0),
  );
}

/* ================================================================== */
/*  PIN HEADERS                                                        */
/* ================================================================== */

function createPinHeader(rows: number, cols: number, pitch = 2.54): Footprint {
  const pads: Pad[] = [];
  let num = 1;
  const xOff = ((cols - 1) * pitch) / 2;
  const yOff = ((rows - 1) * pitch) / 2;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = -xOff + c * pitch;
      const y = -yOff + r * pitch;
      const shape = num === 1 ? PadShape.Rect : PadShape.Circle;
      pads.push(thPad(String(num++), x, y, 1.7, 1.0, shape));
    }
  }

  const halfW = (cols * pitch) / 2 + 0.3;
  const halfH = (rows * pitch) / 2 + 0.3;

  return fp(
    `PinHeader_${cols}x${rows.toString().padStart(2, '0')}_P${pitch}mm`,
    `${cols}x${rows} pin header, ${pitch} mm pitch`,
    pads,
    [
      ...silkRect(-halfW, -halfH, halfW, halfH),
      fpText('%R', 0, -halfH - 0.8, 0.7),
    ],
    courtyard(-halfW - 0.25, -halfH - 0.25, halfW + 0.25, halfH + 0.25),
  );
}

/* ================================================================== */
/*  USB MICRO-B                                                        */
/* ================================================================== */

function createUSBMicroB(): Footprint {
  // Simplified USB Micro-B SMD receptacle
  const pitch = 0.65;
  const padW = 0.4;
  const padH = 1.35;
  const pads: Pad[] = [];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * pitch;
    pads.push(smdPad(String(i + 1), x, 3.6, padW, padH));
  }
  // Shield / mounting pads
  pads.push(smdPad('S1', -3.2, 2.5, 1.8, 1.9));
  pads.push(smdPad('S2',  3.2, 2.5, 1.8, 1.9));

  return fp(
    'USB_Micro-B',
    'USB Micro-B SMD receptacle',
    pads,
    [
      ...silkRect(-3.8, 0, 3.8, 4.8),
      fpText('USB', 0, -0.8, 0.7),
    ],
    courtyard(-4.5, -0.5, 4.5, 5.5),
  );
}

/* ================================================================== */
/*  USB TYPE-C (simplified 16-pin)                                     */
/* ================================================================== */

function createUSBTypeC(): Footprint {
  // Simplified USB Type-C receptacle (16 signal pins + 4 shield)
  const pitch = 0.5;
  const padW = 0.3;
  const padH = 1.0;
  const pads: Pad[] = [];

  // Top row pins (A-side) — 12 pins
  const topPinNames = ['GND','TX1+','TX1-','VBUS','CC1','D+','D-','SBU1','VBUS','RX2-','RX2+','GND'];
  for (let i = 0; i < 12; i++) {
    const x = (i - 5.5) * pitch;
    pads.push(smdPad(`A${i + 1}`, x, 4.6, padW, padH));
  }

  // Bottom row (B-side) — mirrored
  const botPinNames = ['GND','RX1+','RX1-','VBUS','SBU2','D-','D+','CC2','VBUS','TX2-','TX2+','GND'];
  for (let i = 0; i < 12; i++) {
    const x = (5.5 - i) * pitch;
    pads.push(smdPad(`B${i + 1}`, x, 5.1, padW, padH));
  }

  // Shield tabs
  pads.push(smdPad('S1', -4.32, 3.0, 1.0, 2.0));
  pads.push(smdPad('S2',  4.32, 3.0, 1.0, 2.0));
  pads.push(smdPad('S3', -4.32, 6.0, 1.0, 2.0));
  pads.push(smdPad('S4',  4.32, 6.0, 1.0, 2.0));

  return fp(
    'USB_Type-C',
    'USB Type-C receptacle (simplified)',
    pads,
    [
      ...silkRect(-4.5, 0, 4.5, 7.5),
      fpText('USB-C', 0, -0.8, 0.7),
    ],
    courtyard(-5.5, -0.5, 5.5, 8.5),
  );
}

/* ================================================================== */
/*  DC BARREL JACK                                                     */
/* ================================================================== */

function createDCBarrelJack(): Footprint {
  return fp(
    'DC_Barrel_Jack',
    'DC barrel jack (5.5/2.1 mm), through-hole',
    [
      thPad('1', 0, 0, 2.4, 1.3),       // centre pin (positive)
      thPad('2', -6.0, 0, 2.4, 1.3),    // sleeve (negative)
      thPad('3', -3.0, 4.7, 2.4, 1.3),  // switch pin
    ],
    [
      ...silkRect(-7.5, -5.0, 2.5, 5.0),
      fpText('J', 0, -6.0, 0.8),
    ],
    courtyard(-8.0, -5.5, 3.0, 5.5),
  );
}

/* ================================================================== */
/*  EXPORT: Collect all built-in footprints                             */
/* ================================================================== */

export function getAllBuiltinFootprints(): Footprint[] {
  const fps: Footprint[] = [];

  // SMD chip sizes
  for (const spec of CHIP_SPECS) {
    fps.push(createSMDChipFootprint(spec));
  }

  // Axial resistors (various pitches)
  for (const pitch of [7.62, 10.16, 12.7]) {
    fps.push(createAxialResistorFootprint(pitch));
  }

  // Radial electrolytic caps (diameter, pitch)
  for (const [dia, p] of [[5, 2.5], [6.3, 2.5], [8, 3.5], [10, 5]] as [number, number][]) {
    fps.push(createRadialCapFootprint(dia, p));
  }

  // SOT packages
  fps.push(createSOT23(3));
  fps.push(createSOT23(5));
  fps.push(createSOT23(6));
  fps.push(createSOT223());

  // SOIC
  fps.push(createSOIC(8));
  fps.push(createSOIC(14));
  fps.push(createSOIC(16));

  // TSSOP
  fps.push(createTSSOP(16));
  fps.push(createTSSOP(20));

  // QFP
  fps.push(createQFP(32, 0.8, 7.0));
  fps.push(createQFP(44, 0.8, 10.0));
  fps.push(createQFP(64, 0.5, 10.0));
  fps.push(createQFP(100, 0.5, 14.0));

  // QFN
  fps.push(createQFN(16, 0.5, 3.0, 0.25, 0.5, true));
  fps.push(createQFN(32, 0.5, 5.0, 0.25, 0.5, true));

  // DIP
  fps.push(createDIP(8));
  fps.push(createDIP(14));
  fps.push(createDIP(16));
  fps.push(createDIP(28));
  fps.push(createDIP(40));

  // TO packages
  fps.push(createTO92());
  fps.push(createTO220());
  fps.push(createTO263());

  // Pin headers 1×N (N = 2..10)
  for (let n = 2; n <= 10; n++) {
    fps.push(createPinHeader(n, 1));
  }
  // Pin headers 2×N (N = 2..10)
  for (let n = 2; n <= 10; n++) {
    fps.push(createPinHeader(n, 2));
  }

  // Connectors
  fps.push(createUSBMicroB());
  fps.push(createUSBTypeC());
  fps.push(createDCBarrelJack());

  return fps;
}

/* Re-export parametric creators for FootprintFactory */
export {
  createSMDChipFootprint,
  createSOIC,
  createQFP,
  createDIP,
  createPinHeader,
  createQFN,
  CHIP_SPECS,
};
