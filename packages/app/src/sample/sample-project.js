// ---------------------------------------------------------------------------
// OpenCAD — Sample Project (555 Timer LED Blinker)
// ---------------------------------------------------------------------------
// Creates a fully-populated demo project loaded on first launch so users
// immediately see something on the canvas.
//
// Circuit: Classic 555 astable LED blinker
//   VCC ─┬─ R1 ─┬─ R2 ─┬─ C1 ─┬─ GND
//        │      │      │      │
//        │     DIS    THR     │
//        │      │      │      │
//        ├──── VCC    IC1     │
//        │     (555)  OUT ── R3 ── LED ── GND
//        │      │      │
//        │     RST   TRIG ───┘
//        │      │
//        └──────┘
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let _idCounter = 0;
function uid(prefix) {
    return `${prefix}-${++_idCounter}`;
}
function pin(name, number, x, y, type = 'passive', orientation = 0) {
    return { id: uid('pin'), name, number, position: { x, y }, type, orientation };
}
function pad(id, net, x, y, w, h, shape = 'rect', type = 'smd', drill) {
    return { id, net, position: { x, y }, size: { x: w, y: h }, shape, type, drill };
}
// ---------------------------------------------------------------------------
// Schematic Symbol Definitions
// ---------------------------------------------------------------------------
function createBattery(ref, x, y) {
    return {
        id: uid('comp'),
        symbolId: 'battery',
        reference: ref,
        value: '9V',
        position: { x, y },
        rotation: 0,
        pins: [
            pin('VCC', '1', 0, -30, 'power', 90),
            pin('GND', '2', 0, 30, 'power', 270),
        ],
        graphics: {
            rects: [],
            circles: [],
            lines: [
                { x1: -15, y1: -10, x2: 15, y2: -10 }, // + plate (wide)
                { x1: -8, y1: -4, x2: 8, y2: -4 }, // - plate (narrow)
                { x1: -15, y1: 6, x2: 15, y2: 6 }, // + plate
                { x1: -8, y1: 12, x2: 8, y2: 12 }, // - plate
                { x1: 0, y1: -30, x2: 0, y2: -10 }, // lead +
                { x1: 0, y1: 12, x2: 0, y2: 30 }, // lead -
            ],
            texts: [
                { x: 20, y: -10, text: ref, size: 10 },
                { x: 20, y: 5, text: '9V', size: 8 },
            ],
        },
    };
}
function createResistor(ref, value, x, y, rotation = 0) {
    return {
        id: uid('comp'),
        symbolId: 'resistor',
        reference: ref,
        value,
        position: { x, y },
        rotation,
        pins: [
            pin('1', '1', -30, 0, 'passive', 0),
            pin('2', '2', 30, 0, 'passive', 180),
        ],
        graphics: {
            rects: [{ x: -20, y: -8, w: 40, h: 16 }],
            circles: [],
            lines: [
                { x1: -30, y1: 0, x2: -20, y2: 0 },
                { x1: 20, y1: 0, x2: 30, y2: 0 },
            ],
            texts: [
                { x: -20, y: -14, text: ref, size: 10 },
                { x: -20, y: 22, text: value, size: 8 },
            ],
        },
    };
}
function createCapacitor(ref, value, x, y) {
    return {
        id: uid('comp'),
        symbolId: 'capacitor',
        reference: ref,
        value,
        position: { x, y },
        rotation: 0,
        pins: [
            pin('1', '1', 0, -20, 'passive', 90),
            pin('2', '2', 0, 20, 'passive', 270),
        ],
        graphics: {
            rects: [],
            circles: [],
            lines: [
                { x1: -12, y1: -4, x2: 12, y2: -4 },
                { x1: -12, y1: 4, x2: 12, y2: 4 },
                { x1: 0, y1: -20, x2: 0, y2: -4 },
                { x1: 0, y1: 4, x2: 0, y2: 20 },
            ],
            texts: [
                { x: 16, y: -10, text: ref, size: 10 },
                { x: 16, y: 6, text: value, size: 8 },
            ],
        },
    };
}
function create555(ref, x, y) {
    return {
        id: uid('comp'),
        symbolId: 'ne555',
        reference: ref,
        value: 'NE555',
        position: { x, y },
        rotation: 0,
        pins: [
            pin('GND', '1', -50, 40, 'power', 0),
            pin('TRIG', '2', -50, 20, 'input', 0),
            pin('OUT', '3', 50, 0, 'output', 180),
            pin('RST', '4', -50, -40, 'input', 0),
            pin('CTRL', '5', 50, 20, 'input', 180),
            pin('THR', '6', -50, 0, 'input', 0),
            pin('DIS', '7', -50, -20, 'output', 0),
            pin('VCC', '8', 0, -50, 'power', 270),
        ],
        graphics: {
            rects: [{ x: -40, y: -45, w: 80, h: 90 }],
            circles: [],
            lines: [],
            texts: [
                { x: -35, y: -55, text: ref, size: 10 },
                { x: -35, y: 55, text: 'NE555', size: 8 },
                // Pin names inside body
                { x: -38, y: -38, text: 'RST', size: 7 },
                { x: -38, y: -18, text: 'DIS', size: 7 },
                { x: -38, y: 2, text: 'THR', size: 7 },
                { x: -38, y: 22, text: 'TRIG', size: 7 },
                { x: -38, y: 42, text: 'GND', size: 7 },
                { x: 10, y: 2, text: 'OUT', size: 7 },
                { x: 10, y: 22, text: 'CTRL', size: 7 },
                { x: -10, y: -48, text: 'VCC', size: 7 },
            ],
        },
    };
}
function createLED(ref, color, x, y) {
    return {
        id: uid('comp'),
        symbolId: 'led',
        reference: ref,
        value: color,
        position: { x, y },
        rotation: 0,
        pins: [
            pin('A', '1', 0, -20, 'passive', 90),
            pin('K', '2', 0, 20, 'passive', 270),
        ],
        graphics: {
            rects: [],
            circles: [],
            lines: [
                // Triangle
                { x1: -10, y1: -8, x2: 10, y2: -8 },
                { x1: -10, y1: -8, x2: 0, y2: 8 },
                { x1: 10, y1: -8, x2: 0, y2: 8 },
                // Bar
                { x1: -10, y1: 8, x2: 10, y2: 8 },
                // Leads
                { x1: 0, y1: -20, x2: 0, y2: -8 },
                { x1: 0, y1: 8, x2: 0, y2: 20 },
                // Arrows (light emission)
                { x1: 8, y1: -6, x2: 14, y2: -12 },
                { x1: 12, y1: -2, x2: 18, y2: -8 },
            ],
            texts: [
                { x: 20, y: -6, text: ref, size: 10 },
                { x: 20, y: 10, text: color, size: 8 },
            ],
        },
    };
}
// ---------------------------------------------------------------------------
// PCB Footprint Definitions
// ---------------------------------------------------------------------------
function dip8Footprint(compId, ref, value, x, y, padNets) {
    const pitch = 2.54;
    const rowSpacing = 7.62;
    const pads = [];
    // Pins 1-4 on left, 5-8 on right (DIP-8)
    for (let i = 0; i < 4; i++) {
        pads.push(pad(`pad-${i + 1}`, padNets[i] ?? '', -rowSpacing / 2, -pitch * 1.5 + pitch * i, 1.6, 1.6, 'circle', 'through-hole', 0.8));
    }
    for (let i = 0; i < 4; i++) {
        pads.push(pad(`pad-${8 - i}`, padNets[7 - i] ?? '', rowSpacing / 2, -pitch * 1.5 + pitch * i, 1.6, 1.6, 'circle', 'through-hole', 0.8));
    }
    // Silkscreen outline
    const halfW = rowSpacing / 2 + 1.5;
    const halfH = pitch * 2 + 1;
    return {
        id: uid('fp'),
        componentId: compId,
        reference: ref,
        value,
        position: { x, y },
        rotation: 0,
        layer: 'F.Cu',
        pads,
        silkscreen: {
            lines: [
                { x1: -halfW, y1: -halfH, x2: halfW, y2: -halfH },
                { x1: halfW, y1: -halfH, x2: halfW, y2: halfH },
                { x1: halfW, y1: halfH, x2: -halfW, y2: halfH },
                { x1: -halfW, y1: halfH, x2: -halfW, y2: -halfH },
                // Notch
                { x1: -1, y1: -halfH, x2: 0, y2: -halfH + 1.5 },
                { x1: 0, y1: -halfH + 1.5, x2: 1, y2: -halfH },
            ],
        },
    };
}
function resistorFootprint(compId, ref, value, x, y, net1, net2) {
    // 0805 SMD footprint
    return {
        id: uid('fp'),
        componentId: compId,
        reference: ref,
        value,
        position: { x, y },
        rotation: 0,
        layer: 'F.Cu',
        pads: [
            pad('pad-1', net1, -1.0, 0, 1.2, 1.4, 'rect', 'smd'),
            pad('pad-2', net2, 1.0, 0, 1.2, 1.4, 'rect', 'smd'),
        ],
        silkscreen: {
            lines: [
                { x1: -0.5, y1: -0.8, x2: 0.5, y2: -0.8 },
                { x1: -0.5, y1: 0.8, x2: 0.5, y2: 0.8 },
            ],
        },
    };
}
function capacitorFootprint(compId, ref, value, x, y, net1, net2) {
    // 0805 SMD capacitor
    return {
        id: uid('fp'),
        componentId: compId,
        reference: ref,
        value,
        position: { x, y },
        rotation: 0,
        layer: 'F.Cu',
        pads: [
            pad('pad-1', net1, -1.0, 0, 1.2, 1.4, 'rect', 'smd'),
            pad('pad-2', net2, 1.0, 0, 1.2, 1.4, 'rect', 'smd'),
        ],
        silkscreen: {
            lines: [
                { x1: -0.5, y1: -0.8, x2: 0.5, y2: -0.8 },
                { x1: -0.5, y1: 0.8, x2: 0.5, y2: 0.8 },
            ],
        },
    };
}
function ledFootprint(compId, ref, value, x, y, net1, net2) {
    // 0805 LED footprint
    return {
        id: uid('fp'),
        componentId: compId,
        reference: ref,
        value,
        position: { x, y },
        rotation: 0,
        layer: 'F.Cu',
        pads: [
            pad('pad-A', net1, -1.1, 0, 1.0, 1.4, 'rect', 'smd'),
            pad('pad-K', net2, 1.1, 0, 1.0, 1.4, 'rect', 'smd'),
        ],
        silkscreen: {
            lines: [
                { x1: -0.6, y1: -0.9, x2: 0.6, y2: -0.9 },
                { x1: 0.6, y1: -0.9, x2: 0.6, y2: 0.9 },
                { x1: 0.6, y1: 0.9, x2: -0.6, y2: 0.9 },
                { x1: -0.6, y1: 0.9, x2: -0.6, y2: -0.9 },
                // Cathode marker
                { x1: 0.4, y1: -0.9, x2: 0.4, y2: 0.9 },
            ],
        },
    };
}
function batteryFootprint(compId, ref, x, y, netVCC, netGND) {
    // 2-pin through-hole battery connector
    return {
        id: uid('fp'),
        componentId: compId,
        reference: ref,
        value: '9V',
        position: { x, y },
        rotation: 0,
        layer: 'F.Cu',
        pads: [
            pad('pad-1', netVCC, 0, -2.54, 1.8, 1.8, 'circle', 'through-hole', 1.0),
            pad('pad-2', netGND, 0, 2.54, 1.8, 1.8, 'circle', 'through-hole', 1.0),
        ],
        silkscreen: {
            lines: [
                { x1: -3, y1: -5, x2: 3, y2: -5 },
                { x1: 3, y1: -5, x2: 3, y2: 5 },
                { x1: 3, y1: 5, x2: -3, y2: 5 },
                { x1: -3, y1: 5, x2: -3, y2: -5 },
                // + indicator
                { x1: -2, y1: -3.5, x2: -1, y2: -3.5 },
                { x1: -1.5, y1: -4, x2: -1.5, y2: -3 },
            ],
        },
    };
}
// ---------------------------------------------------------------------------
// Build the complete sample project
// ---------------------------------------------------------------------------
export function createSampleProject() {
    _idCounter = 0;
    // Net names
    const VCC = 'VCC';
    const GND = 'GND';
    const DIS_THR = 'DIS_THR'; // Discharge/Threshold node
    const TRIG_THR = 'TRIG_THR'; // Trigger/Threshold node (same as above for astable)
    const NET_OUT = 'OUT'; // 555 output
    const NET_LED = 'LED_A'; // Between R3 and LED anode
    // ---- Schematic Components ----
    const battery = createBattery('BT1', 100, 200);
    const r1 = createResistor('R1', '10kΩ', 250, 120);
    const r2 = createResistor('R2', '47kΩ', 250, 180);
    const c1 = createCapacitor('C1', '10µF', 350, 260);
    const ic1 = create555('U1', 400, 160);
    const r3 = createResistor('R3', '470Ω', 550, 160);
    const led = createLED('D1', 'Red', 620, 200);
    const components = [battery, r1, r2, c1, ic1, r3, led];
    // ---- Wires ----
    const wires = [
        // VCC rail: Battery+ → R1 pin 1
        { id: uid('wire'), net: VCC, points: [{ x: 100, y: 170 }, { x: 100, y: 100 }, { x: 220, y: 100 }, { x: 220, y: 120 }] },
        // VCC → 555 VCC (pin 8)
        { id: uid('wire'), net: VCC, points: [{ x: 220, y: 100 }, { x: 400, y: 100 }, { x: 400, y: 110 }] },
        // VCC → 555 RST (pin 4)
        { id: uid('wire'), net: VCC, points: [{ x: 400, y: 100 }, { x: 350, y: 100 }, { x: 350, y: 120 }] },
        // R1 pin 2 → R2 pin 1 (DIS node)
        { id: uid('wire'), net: DIS_THR, points: [{ x: 280, y: 120 }, { x: 300, y: 120 }, { x: 300, y: 140 }, { x: 350, y: 140 }] },
        // DIS node → 555 DIS (pin 7)
        { id: uid('wire'), net: DIS_THR, points: [{ x: 300, y: 140 }, { x: 350, y: 140 }] },
        // R2 pin 2 → THR/TRIG node
        { id: uid('wire'), net: TRIG_THR, points: [{ x: 280, y: 180 }, { x: 320, y: 180 }, { x: 350, y: 160 }] },
        // THR/TRIG → 555 THR (pin 6)
        { id: uid('wire'), net: TRIG_THR, points: [{ x: 320, y: 180 }, { x: 350, y: 180 }] },
        // THR/TRIG → 555 TRIG (pin 2)
        { id: uid('wire'), net: TRIG_THR, points: [{ x: 320, y: 180 }, { x: 350, y: 180 }] },
        // THR/TRIG → C1 pin 1
        { id: uid('wire'), net: TRIG_THR, points: [{ x: 350, y: 180 }, { x: 350, y: 240 }] },
        // C1 pin 2 → GND
        { id: uid('wire'), net: GND, points: [{ x: 350, y: 280 }, { x: 350, y: 300 }] },
        // 555 GND (pin 1) → GND
        { id: uid('wire'), net: GND, points: [{ x: 350, y: 200 }, { x: 350, y: 300 }] },
        // GND rail back to battery
        { id: uid('wire'), net: GND, points: [{ x: 350, y: 300 }, { x: 100, y: 300 }, { x: 100, y: 230 }] },
        // 555 OUT (pin 3) → R3
        { id: uid('wire'), net: NET_OUT, points: [{ x: 450, y: 160 }, { x: 520, y: 160 }] },
        // R3 → LED anode
        { id: uid('wire'), net: NET_LED, points: [{ x: 580, y: 160 }, { x: 620, y: 160 }, { x: 620, y: 180 }] },
        // LED cathode → GND
        { id: uid('wire'), net: GND, points: [{ x: 620, y: 220 }, { x: 620, y: 300 }, { x: 350, y: 300 }] },
    ];
    // ---- Power ports ----
    const powerPorts = [
        { id: uid('pwr'), net: VCC, position: { x: 100, y: 90 }, type: 'vcc' },
        { id: uid('pwr'), net: GND, position: { x: 100, y: 310 }, type: 'gnd' },
    ];
    // ---- Net labels ----
    const netLabels = [
        { id: uid('nl'), net: VCC, position: { x: 220, y: 95 } },
        { id: uid('nl'), net: GND, position: { x: 350, y: 305 } },
        { id: uid('nl'), net: NET_OUT, position: { x: 480, y: 155 } },
        { id: uid('nl'), net: DIS_THR, position: { x: 305, y: 135 } },
        { id: uid('nl'), net: TRIG_THR, position: { x: 325, y: 175 } },
    ];
    // ---- PCB Footprints ----
    //
    // Board: 50mm × 40mm
    // Components placed with real coordinates (mm from board origin)
    const pcbFootprints = [
        batteryFootprint(battery.id, 'BT1', 5, 20, VCC, GND),
        resistorFootprint(r1.id, 'R1', '10kΩ', 18, 10, VCC, DIS_THR),
        resistorFootprint(r2.id, 'R2', '47kΩ', 18, 18, DIS_THR, TRIG_THR),
        capacitorFootprint(c1.id, 'C1', '10µF', 18, 30, TRIG_THR, GND),
        dip8Footprint(ic1.id, 'U1', 'NE555', 32, 20, [
            GND, // pin 1
            TRIG_THR, // pin 2
            NET_OUT, // pin 3
            VCC, // pin 4 (RST tied to VCC)
            '', // pin 5 (CTRL, often decoupled but left unconnected here)
            TRIG_THR, // pin 6 (THR)
            DIS_THR, // pin 7 (DIS)
            VCC, // pin 8
        ]),
        resistorFootprint(r3.id, 'R3', '470Ω', 44, 15, NET_OUT, NET_LED),
        ledFootprint(led.id, 'D1', 'Red', 44, 25, NET_LED, GND),
    ];
    // ---- Assemble project ----
    const now = new Date().toISOString();
    const project = {
        formatVersion: '1.0.0',
        metadata: {
            name: '555 Timer LED Blinker',
            author: 'OpenCAD Sample',
            createdAt: now,
            modifiedAt: now,
            version: '0.1.0',
        },
        schematic: {
            sheets: [
                {
                    id: 'sheet-main',
                    name: 'Main',
                    components,
                    wires,
                    netLabels,
                    powerPorts,
                },
            ],
        },
        pcb: {
            boardOutline: {
                points: [
                    { x: 0, y: 0 },
                    { x: 50, y: 0 },
                    { x: 50, y: 40 },
                    { x: 0, y: 40 },
                ],
            },
            footprints: pcbFootprints,
            tracks: [], // No pre-routed tracks — user can auto-route or manually route
            vias: [],
            designRules: {
                clearance: 0.2,
                trackWidth: 0.25,
                viaDiameter: 0.8,
                viaDrill: 0.4,
                minTrackWidth: 0.15,
            },
            layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS', 'F.Mask', 'B.Mask', 'Edge.Cuts'],
        },
    };
    return project;
}
//# sourceMappingURL=sample-project.js.map