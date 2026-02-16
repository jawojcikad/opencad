import { Vector2D, } from '@opencad/core';
/* ================================================================== */
/*  S-Expression Parser                                                */
/* ================================================================== */
/**
 * A fully functional S‑expression parser for KiCad file formats.
 *
 * KiCad files (`.kicad_sch`, `.kicad_pcb`, `.kicad_pro`, etc.) use a
 * Lisp‑like S‑expression syntax:
 *
 * ```
 * (kicad_pcb (version 20211014) (generator pcbnew)
 *   (general (thickness 1.6))
 *   ...)
 * ```
 *
 * This parser converts such strings into nested JS arrays where each
 * S‑expression `(a b c)` becomes `['a', 'b', 'c']` and nested
 * sub‑expressions are nested arrays.
 *
 * Atoms that look like numbers are converted to `number`.
 * Quoted strings have their quotes stripped.
 */
export class SExpressionParser {
    static parse(input) {
        const tokens = SExpressionParser.tokenize(input);
        const result = [];
        let pos = 0;
        function parseExpr() {
            if (pos >= tokens.length) {
                throw new Error('Unexpected end of input');
            }
            const token = tokens[pos];
            if (token === '(') {
                pos++; // consume '('
                const list = [];
                while (pos < tokens.length && tokens[pos] !== ')') {
                    list.push(parseExpr());
                }
                if (pos >= tokens.length) {
                    throw new Error('Missing closing parenthesis');
                }
                pos++; // consume ')'
                return list;
            }
            if (token === ')') {
                throw new Error('Unexpected closing parenthesis');
            }
            // Atom
            pos++;
            return SExpressionParser.parseAtom(token);
        }
        while (pos < tokens.length) {
            result.push(parseExpr());
        }
        return result;
    }
    /**
     * Tokenize an S‑expression string into an array of string tokens.
     * Handles quoted strings (preserving spaces inside), parentheses,
     * and regular atoms.
     */
    static tokenize(input) {
        const tokens = [];
        let i = 0;
        const len = input.length;
        while (i < len) {
            const ch = input[i];
            // Whitespace – skip
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
                i++;
                continue;
            }
            // Parentheses
            if (ch === '(' || ch === ')') {
                tokens.push(ch);
                i++;
                continue;
            }
            // Quoted string
            if (ch === '"') {
                let str = '';
                i++; // skip opening quote
                while (i < len && input[i] !== '"') {
                    if (input[i] === '\\' && i + 1 < len) {
                        // Escape sequence
                        i++;
                        switch (input[i]) {
                            case 'n':
                                str += '\n';
                                break;
                            case 't':
                                str += '\t';
                                break;
                            case '\\':
                                str += '\\';
                                break;
                            case '"':
                                str += '"';
                                break;
                            default:
                                str += input[i];
                        }
                    }
                    else {
                        str += input[i];
                    }
                    i++;
                }
                i++; // skip closing quote
                tokens.push(str);
                continue;
            }
            // Comment (KiCad doesn't formally have comments, but some files
            // contain lines starting with #)
            if (ch === '#') {
                while (i < len && input[i] !== '\n')
                    i++;
                continue;
            }
            // Regular atom (symbol / number)
            let atom = '';
            while (i < len &&
                input[i] !== ' ' &&
                input[i] !== '\t' &&
                input[i] !== '\n' &&
                input[i] !== '\r' &&
                input[i] !== '(' &&
                input[i] !== ')' &&
                input[i] !== '"') {
                atom += input[i];
                i++;
            }
            if (atom.length > 0) {
                tokens.push(atom);
            }
        }
        return tokens;
    }
    /** Convert an atom string to a number if possible, else keep as string. */
    static parseAtom(token) {
        // Try integer
        if (/^-?\d+$/.test(token)) {
            return parseInt(token, 10);
        }
        // Try float
        if (/^-?\d+\.\d+$/.test(token)) {
            return parseFloat(token);
        }
        return token;
    }
}
/* ================================================================== */
/*  KiCad Schematic Parser (.kicad_sch)                                */
/* ================================================================== */
/**
 * Parses a KiCad 6/7/8 `.kicad_sch` file into an OpenCAD
 * `SchematicDocument`.
 */
export class KiCadSchematicParser {
    parse(content) {
        const tree = SExpressionParser.parse(content);
        // The root element should be a single list starting with 'kicad_sch'
        const root = this.findNode(tree, 'kicad_sch');
        if (!root) {
            throw new Error('Not a valid KiCad schematic file');
        }
        const components = this.parseSymbolInstances(root);
        const wires = this.parseWires(root);
        const labels = this.parseLabels(root);
        // Page size
        const paper = this.findChild(root, 'paper');
        const paperSize = paper ? String(paper[1] ?? 'A4') : 'A4';
        const { width, height } = this.paperDimensions(paperSize);
        const sheet = {
            name: 'Sheet1',
            components,
            wires,
            netLabels: labels,
            width,
            height,
        };
        return {
            sheets: [sheet],
            title: this.extractTitle(root),
        };
    }
    /* -------- Symbol / component instances ----------------------------- */
    parseSymbolInstances(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node) || node[0] !== 'symbol')
                continue;
            const libId = this.getPropertyValue(node, 'lib_id') ?? '';
            const at = this.findChild(node, 'at');
            const x = at ? Number(at[1] ?? 0) : 0;
            const y = at ? Number(at[2] ?? 0) : 0;
            const rot = at ? Number(at[3] ?? 0) : 0;
            const reference = this.getPropertyFieldValue(node, 'Reference') ??
                this.getPropertyValue(node, 'reference') ??
                '';
            const value = this.getPropertyFieldValue(node, 'Value') ??
                this.getPropertyValue(node, 'value') ??
                '';
            const props = {};
            for (const child of node) {
                if (Array.isArray(child) && child[0] === 'property') {
                    const key = String(child[1] ?? '');
                    const val = String(child[2] ?? '');
                    props[key] = val;
                }
            }
            results.push({
                id: `${reference}_${libId}`,
                reference,
                value,
                position: { x, y },
                rotation: rot,
                symbol: { id: libId, name: libId, pins: [] },
                properties: props,
            });
        }
        return results;
    }
    /* -------- Wires ---------------------------------------------------- */
    parseWires(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node) || node[0] !== 'wire')
                continue;
            const pts = this.findChild(node, 'pts');
            if (!pts)
                continue;
            const xyNodes = pts.filter((n) => Array.isArray(n) && n[0] === 'xy');
            if (xyNodes.length < 2)
                continue;
            // KiCad wires are multi‑segment polylines stored as sets of xy
            for (let i = 0; i < xyNodes.length - 1; i++) {
                results.push({
                    start: {
                        x: Number(xyNodes[i][1] ?? 0),
                        y: Number(xyNodes[i][2] ?? 0),
                    },
                    end: {
                        x: Number(xyNodes[i + 1][1] ?? 0),
                        y: Number(xyNodes[i + 1][2] ?? 0),
                    },
                });
            }
        }
        return results;
    }
    /* -------- Labels --------------------------------------------------- */
    parseLabels(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node))
                continue;
            if (node[0] !== 'label' &&
                node[0] !== 'global_label' &&
                node[0] !== 'hierarchical_label')
                continue;
            const name = String(node[1] ?? '');
            const at = this.findChild(node, 'at');
            const x = at ? Number(at[1] ?? 0) : 0;
            const y = at ? Number(at[2] ?? 0) : 0;
            const rot = at ? Number(at[3] ?? 0) : 0;
            results.push({
                name,
                position: { x, y },
                rotation: rot,
            });
        }
        return results;
    }
    /* -------- Utilities ------------------------------------------------ */
    extractTitle(root) {
        const titleBlock = this.findChild(root, 'title_block');
        if (!titleBlock)
            return 'Untitled';
        const title = this.findChild(titleBlock, 'title');
        return title ? String(title[1] ?? 'Untitled') : 'Untitled';
    }
    paperDimensions(size) {
        const sizes = {
            A4: { width: 297, height: 210 },
            A3: { width: 420, height: 297 },
            A2: { width: 594, height: 420 },
            A1: { width: 841, height: 594 },
            A0: { width: 1189, height: 841 },
            A: { width: 279.4, height: 215.9 },
            B: { width: 431.8, height: 279.4 },
            C: { width: 558.8, height: 431.8 },
            D: { width: 863.6, height: 558.8 },
            E: { width: 1117.6, height: 863.6 },
        };
        return sizes[size] ?? sizes['A4'];
    }
    /** Find a child node whose first element is `name`. */
    findChild(list, name) {
        for (const item of list) {
            if (Array.isArray(item) && item[0] === name)
                return item;
        }
        return undefined;
    }
    /** Find a node anywhere in iterables. */
    findNode(tree, name) {
        for (const item of tree) {
            if (Array.isArray(item)) {
                if (item[0] === name)
                    return item;
                const found = this.findNode(item, name);
                if (found)
                    return found;
            }
        }
        return undefined;
    }
    /** Get a KiCad property value by key (e.g. `(property "key" "value")`). */
    getPropertyValue(list, key) {
        const prop = this.findChild(list, key);
        return prop ? String(prop[1] ?? '') : undefined;
    }
    /** Get a KiCad named property field value. */
    getPropertyFieldValue(list, fieldName) {
        for (const item of list) {
            if (Array.isArray(item) &&
                item[0] === 'property' &&
                String(item[1]) === fieldName) {
                return String(item[2] ?? '');
            }
        }
        return undefined;
    }
}
/* ================================================================== */
/*  KiCad PCB Parser (.kicad_pcb)                                      */
/* ================================================================== */
/**
 * Parses a KiCad 6/7/8 `.kicad_pcb` file into an OpenCAD `PCBDocument`.
 */
export class KiCadPCBParser {
    parse(content) {
        const tree = SExpressionParser.parse(content);
        const root = this.findNode(tree, 'kicad_pcb');
        if (!root) {
            throw new Error('Not a valid KiCad PCB file');
        }
        const layers = this.parseLayers(root);
        const tracks = this.parseTracks(root);
        const vias = this.parseVias(root);
        const footprints = this.parseFootprints(root);
        const zones = this.parseZones(root);
        const boardOutline = this.parseBoardOutline(root);
        // Design rules (from setup → design_rules or defaults)
        const setup = this.findChild(root, 'setup');
        const designRules = this.parseDesignRules(setup);
        return {
            layers,
            tracks,
            vias,
            footprints,
            zones,
            boardOutline,
            designRules,
        };
    }
    /* -------- Layers --------------------------------------------------- */
    parseLayers(root) {
        const layerNode = this.findChild(root, 'layers');
        if (!layerNode)
            return [];
        const results = [];
        for (let i = 1; i < layerNode.length; i++) {
            const item = layerNode[i];
            if (!Array.isArray(item))
                continue;
            const id = String(item[0] ?? '');
            const name = String(item[1] ?? '');
            const type = String(item[2] ?? '');
            results.push({ id, name, type });
        }
        return results;
    }
    /* -------- Tracks (segments) ---------------------------------------- */
    parseTracks(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node) || node[0] !== 'segment')
                continue;
            const start = this.findChild(node, 'start');
            const end = this.findChild(node, 'end');
            const widthNode = this.findChild(node, 'width');
            const layerNode = this.findChild(node, 'layer');
            const netNode = this.findChild(node, 'net');
            results.push({
                start: {
                    x: Number(start?.[1] ?? 0),
                    y: Number(start?.[2] ?? 0),
                },
                end: {
                    x: Number(end?.[1] ?? 0),
                    y: Number(end?.[2] ?? 0),
                },
                width: Number(widthNode?.[1] ?? 0.25),
                layer: String(layerNode?.[1] ?? ''),
                net: netNode ? String(netNode[1] ?? '') : undefined,
            });
        }
        return results;
    }
    /* -------- Vias ----------------------------------------------------- */
    parseVias(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node) || node[0] !== 'via')
                continue;
            const at = this.findChild(node, 'at');
            const sizeNode = this.findChild(node, 'size');
            const drillNode = this.findChild(node, 'drill');
            const layersNode = this.findChild(node, 'layers');
            const netNode = this.findChild(node, 'net');
            const layers = [];
            if (layersNode) {
                for (let i = 1; i < layersNode.length; i++) {
                    layers.push(String(layersNode[i]));
                }
            }
            results.push({
                position: {
                    x: Number(at?.[1] ?? 0),
                    y: Number(at?.[2] ?? 0),
                },
                diameter: Number(sizeNode?.[1] ?? 0.6),
                drill: Number(drillNode?.[1] ?? 0.3),
                layers,
                net: netNode ? String(netNode[1] ?? '') : undefined,
            });
        }
        return results;
    }
    /* -------- Footprints ----------------------------------------------- */
    parseFootprints(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node) || node[0] !== 'footprint')
                continue;
            const name = String(node[1] ?? '');
            const at = this.findChild(node, 'at');
            const layerNode = this.findChild(node, 'layer');
            const x = Number(at?.[1] ?? 0);
            const y = Number(at?.[2] ?? 0);
            const rot = Number(at?.[3] ?? 0);
            const reference = this.getPropertyFieldValue(node, 'Reference') ?? '';
            const value = this.getPropertyFieldValue(node, 'Value') ?? '';
            // Parse pads
            const pads = [];
            for (const child of node) {
                if (!Array.isArray(child) || child[0] !== 'pad')
                    continue;
                const padNumber = String(child[1] ?? '');
                const padType = String(child[2] ?? ''); // smd, thru_hole, np_thru_hole
                const padShape = String(child[3] ?? ''); // circle, rect, oval, roundrect
                const padAt = this.findChild(child, 'at');
                const padSizeNode = this.findChild(child, 'size');
                const padDrillNode = this.findChild(child, 'drill');
                const padLayersNode = this.findChild(child, 'layers');
                const padNetNode = this.findChild(child, 'net');
                const padLayers = [];
                if (padLayersNode) {
                    for (let i = 1; i < padLayersNode.length; i++) {
                        padLayers.push(String(padLayersNode[i]));
                    }
                }
                const shape = this.normalizeShape(padShape);
                pads.push({
                    number: padNumber,
                    position: {
                        x: Number(padAt?.[1] ?? 0),
                        y: Number(padAt?.[2] ?? 0),
                    },
                    size: {
                        x: Number(padSizeNode?.[1] ?? 1),
                        y: Number(padSizeNode?.[2] ?? 1),
                    },
                    shape,
                    drill: padType === 'thru_hole' || padType === 'np_thru_hole'
                        ? Number(padDrillNode?.[1] ?? 0.3)
                        : undefined,
                    plated: padType !== 'np_thru_hole',
                    layers: padLayers,
                    net: padNetNode ? String(padNetNode[1] ?? '') : undefined,
                });
            }
            results.push({
                id: name,
                name,
                reference,
                value,
                position: { x, y },
                rotation: rot,
                layer: String(layerNode?.[1] ?? ''),
                pads,
            });
        }
        return results;
    }
    /* -------- Zones ---------------------------------------------------- */
    parseZones(root) {
        const results = [];
        for (const node of root) {
            if (!Array.isArray(node) || node[0] !== 'zone')
                continue;
            const netNode = this.findChild(node, 'net');
            const layerNode = this.findChild(node, 'layer');
            const layersNode = this.findChild(node, 'layers');
            const layer = layerNode
                ? String(layerNode[1] ?? '')
                : layersNode
                    ? String(layersNode[1] ?? '')
                    : '';
            // Filled polygon
            const filledPolygon = this.findChild(node, 'filled_polygon') ??
                this.findChild(node, 'polygon');
            const outline = [];
            if (filledPolygon) {
                const pts = this.findChild(filledPolygon, 'pts');
                if (pts) {
                    for (const pt of pts) {
                        if (Array.isArray(pt) && pt[0] === 'xy') {
                            outline.push(new Vector2D(Number(pt[1] ?? 0), Number(pt[2] ?? 0)));
                        }
                    }
                }
            }
            // If no filled polygon, try the outline directly
            if (outline.length === 0) {
                const outlineNode = this.findChild(node, 'polygon');
                if (outlineNode) {
                    const pts = this.findChild(outlineNode, 'pts');
                    if (pts) {
                        for (const pt of pts) {
                            if (Array.isArray(pt) && pt[0] === 'xy') {
                                outline.push(new Vector2D(Number(pt[1] ?? 0), Number(pt[2] ?? 0)));
                            }
                        }
                    }
                }
            }
            results.push({
                outline,
                layer,
                net: netNode ? String(netNode[1] ?? '') : undefined,
            });
        }
        return results;
    }
    /* -------- Board outline -------------------------------------------- */
    parseBoardOutline(root) {
        const vertices = [];
        // In KiCad, the board outline is made of `gr_line` / `gr_arc`
        // elements on the `Edge.Cuts` layer.
        const lines = [];
        for (const node of root) {
            if (!Array.isArray(node))
                continue;
            if (node[0] !== 'gr_line' && node[0] !== 'gr_rect')
                continue;
            const layerNode = this.findChild(node, 'layer');
            const layerName = String(layerNode?.[1] ?? '');
            if (layerName !== 'Edge.Cuts')
                continue;
            if (node[0] === 'gr_line') {
                const start = this.findChild(node, 'start');
                const end = this.findChild(node, 'end');
                if (start && end) {
                    lines.push({
                        start: new Vector2D(Number(start[1] ?? 0), Number(start[2] ?? 0)),
                        end: new Vector2D(Number(end[1] ?? 0), Number(end[2] ?? 0)),
                    });
                }
            }
            else if (node[0] === 'gr_rect') {
                const start = this.findChild(node, 'start');
                const end = this.findChild(node, 'end');
                if (start && end) {
                    const x1 = Number(start[1] ?? 0);
                    const y1 = Number(start[2] ?? 0);
                    const x2 = Number(end[1] ?? 0);
                    const y2 = Number(end[2] ?? 0);
                    vertices.push(new Vector2D(x1, y1), new Vector2D(x2, y1), new Vector2D(x2, y2), new Vector2D(x1, y2));
                }
            }
        }
        // Chain the line segments into a closed outline
        if (vertices.length === 0 && lines.length > 0) {
            this.chainLines(lines, vertices);
        }
        return { vertices };
    }
    /**
     * Chain disconnected line segments into an ordered vertex sequence.
     * Uses a simple greedy algorithm with epsilon matching.
     */
    chainLines(lines, out) {
        if (lines.length === 0)
            return;
        const eps = 0.001;
        const eq = (a, b) => Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
        const remaining = [...lines];
        let current = remaining.shift();
        out.push(current.start);
        out.push(current.end);
        let changed = true;
        while (changed && remaining.length > 0) {
            changed = false;
            const tail = out[out.length - 1];
            for (let i = 0; i < remaining.length; i++) {
                const seg = remaining[i];
                if (eq(seg.start, tail)) {
                    out.push(seg.end);
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                }
                if (eq(seg.end, tail)) {
                    out.push(seg.start);
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                }
            }
        }
    }
    /* -------- Design rules --------------------------------------------- */
    parseDesignRules(setup) {
        const defaults = {
            minTraceWidth: 0.2,
            minClearance: 0.2,
            minViaDiameter: 0.6,
            minViaDrill: 0.3,
        };
        if (!setup)
            return defaults;
        const traceWidth = this.findChild(setup, 'trace_min');
        const clearance = this.findChild(setup, 'clearance_min');
        const viaDia = this.findChild(setup, 'via_min_size');
        const viaDrill = this.findChild(setup, 'via_min_drill');
        // Newer KiCad uses design_rules sub‑node
        const dr = this.findChild(setup, 'design_rules');
        if (dr) {
            const rule0 = this.findChild(dr, 'rule');
            if (rule0) {
                const tw = this.findChild(rule0, 'width');
                const cl = this.findChild(rule0, 'clearance');
                if (tw)
                    defaults.minTraceWidth = Number(tw[1] ?? 0.2);
                if (cl)
                    defaults.minClearance = Number(cl[1] ?? 0.2);
            }
        }
        if (traceWidth)
            defaults.minTraceWidth = Number(traceWidth[1] ?? 0.2);
        if (clearance)
            defaults.minClearance = Number(clearance[1] ?? 0.2);
        if (viaDia)
            defaults.minViaDiameter = Number(viaDia[1] ?? 0.6);
        if (viaDrill)
            defaults.minViaDrill = Number(viaDrill[1] ?? 0.3);
        return defaults;
    }
    /* -------- Utilities ------------------------------------------------ */
    normalizeShape(kicadShape) {
        switch (kicadShape) {
            case 'circle':
                return 'circle';
            case 'rect':
            case 'roundrect':
                return 'rectangle';
            case 'oval':
                return 'obround';
            case 'trapezoid':
                return 'polygon';
            case 'custom':
                return 'polygon';
            default:
                return 'circle';
        }
    }
    findChild(list, name) {
        for (const item of list) {
            if (Array.isArray(item) && item[0] === name)
                return item;
        }
        return undefined;
    }
    findNode(tree, name) {
        for (const item of tree) {
            if (Array.isArray(item)) {
                if (item[0] === name)
                    return item;
                const found = this.findNode(item, name);
                if (found)
                    return found;
            }
        }
        return undefined;
    }
    getPropertyFieldValue(list, fieldName) {
        for (const item of list) {
            if (Array.isArray(item) &&
                item[0] === 'property' &&
                String(item[1]) === fieldName) {
                return String(item[2] ?? '');
            }
        }
        // Also try fp_text (older KiCad format)
        for (const item of list) {
            if (Array.isArray(item) &&
                item[0] === 'fp_text' &&
                String(item[1]) === fieldName.toLowerCase()) {
                return String(item[2] ?? '');
            }
        }
        return undefined;
    }
}
//# sourceMappingURL=kicad-project-parser.js.map