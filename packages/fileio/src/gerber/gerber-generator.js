import { Vector2D, } from '@opencad/core';
/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/** Rotate a point around the origin by `angleDeg` degrees. */
function rotatePoint(p, origin, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    return new Vector2D(origin.x + dx * cos - dy * sin, origin.y + dx * sin + dy * cos);
}
/* ------------------------------------------------------------------ */
/*  GerberGenerator                                                    */
/* ------------------------------------------------------------------ */
/**
 * Generates Gerber RS‑274X files from a `PCBDocument`.
 *
 * Co‑ordinate format: **2.6** (mm, 6 decimal places, leading‑zero
 * suppression, absolute co‑ordinates).
 *
 * Aperture codes start at D10 as per the spec.
 */
export class GerberGenerator {
    apertures = [];
    commands = [];
    apertureIndex = 10; // D10 is the first user aperture
    constructor() {
        this.reset();
    }
    /* ================================================================ */
    /*  Public API                                                       */
    /* ================================================================ */
    /**
     * Generate *all* standard Gerber fabrication files for the given PCB.
     *
     * Returns a `Map<string, string>` where the key is the suggested
     * filename and the value is the full Gerber file content.
     */
    generateAll(document) {
        const files = new Map();
        const layers = document.layers ?? [];
        for (const layer of layers) {
            const name = layer.name ?? '';
            const lowerName = name.toLowerCase();
            if (lowerName.includes('cu') || lowerName.includes('copper')) {
                files.set(`${this.sanitiseFilename(name)}.gtl`, this.generateCopperLayer(document, layer));
            }
            else if (lowerName.includes('silk')) {
                files.set(`${this.sanitiseFilename(name)}.gto`, this.generateSilkscreen(document, layer));
            }
            else if (lowerName.includes('mask')) {
                files.set(`${this.sanitiseFilename(name)}.gts`, this.generateSolderMask(document, layer));
            }
            else if (lowerName.includes('paste')) {
                files.set(`${this.sanitiseFilename(name)}.gtp`, this.generatePasteMask(document, layer));
            }
        }
        files.set('board_outline.gm1', this.generateBoardOutline(document));
        return files;
    }
    /* -------- Layer generators -------------------------------------- */
    generateCopperLayer(document, layer) {
        this.reset();
        const layerName = layer.name ?? 'Copper';
        const layerId = layer.id ?? layerName;
        this.commands.push(this.header(layerName, 'positive'));
        // Tracks
        const tracks = document.tracks ?? [];
        for (const track of tracks) {
            const tLayer = track.layer ?? '';
            if (tLayer === layerId || tLayer === layerName) {
                this.renderTrack(track);
            }
        }
        // Vias (appear on all copper layers)
        const vias = document.vias ?? [];
        for (const via of vias) {
            const viaLayers = via.layers ?? [];
            if (viaLayers.length === 0 ||
                viaLayers.includes(layerId) ||
                viaLayers.includes(layerName)) {
                this.renderVia(via);
            }
        }
        // Footprint pads on this layer
        const footprints = document.footprints ?? [];
        for (const fp of footprints) {
            const pads = fp.pads ?? [];
            const fpPos = fp.position ?? { x: 0, y: 0 };
            const fpRot = fp.rotation ?? 0;
            for (const pad of pads) {
                const padLayers = pad.layers ?? [];
                if (padLayers.length === 0 ||
                    padLayers.includes(layerId) ||
                    padLayers.includes(layerName)) {
                    this.renderPad(pad, fpPos, fpRot);
                }
            }
        }
        // Copper zones
        const zones = document.zones ?? [];
        for (const zone of zones) {
            const zLayer = zone.layer ?? '';
            if (zLayer === layerId || zLayer === layerName) {
                this.renderZone(zone);
            }
        }
        this.commands.push(this.footer());
        return this.commands.join('\n');
    }
    generateSilkscreen(document, layer) {
        this.reset();
        const layerName = layer.name ?? 'Silkscreen';
        this.commands.push(this.header(layerName, 'positive'));
        // Render footprint outlines / silkscreen lines
        const footprints = document.footprints ?? [];
        const lineAp = this.addAperture({ code: 0, type: 'circle', parameters: [0.15] });
        for (const fp of footprints) {
            const fpLayer = fp.layer ?? '';
            const fpLayerName = layer.name ?? '';
            // Match front silk to front footprints, back to back
            const isFront = fpLayerName.toLowerCase().includes('front') || fpLayerName.toLowerCase().includes('f.');
            const fpIsFront = fpLayer.toLowerCase().includes('front') || fpLayer.toLowerCase().includes('f.') || fpLayer.toLowerCase().includes('top');
            if (isFront !== fpIsFront && fpLayer !== '')
                continue;
            const fpPos = fp.position ?? { x: 0, y: 0 };
            const fpRot = fp.rotation ?? 0;
            const silkLines = fp.silkscreenLines ?? [];
            this.commands.push(this.selectAperture(lineAp));
            for (const line of silkLines) {
                const start = rotatePoint(new Vector2D(line.start.x + fpPos.x, line.start.y + fpPos.y), fpPos, fpRot);
                const end = rotatePoint(new Vector2D(line.end.x + fpPos.x, line.end.y + fpPos.y), fpPos, fpRot);
                this.commands.push(this.moveTo(start.x, start.y));
                this.commands.push(this.lineTo(end.x, end.y));
            }
            // Reference designator as text (simplified: flash at centre)
            const ref = fp.reference ?? '';
            if (ref) {
                this.commands.push(this.flash(fpPos.x, fpPos.y));
            }
        }
        this.commands.push(this.footer());
        return this.commands.join('\n');
    }
    generateSolderMask(document, layer) {
        this.reset();
        const layerName = layer.name ?? 'SolderMask';
        // Solder mask is *negative*: openings where pads are
        this.commands.push(this.header(layerName, 'negative'));
        const footprints = document.footprints ?? [];
        const layerId = layer.id ?? layerName;
        for (const fp of footprints) {
            const fpPos = fp.position ?? { x: 0, y: 0 };
            const fpRot = fp.rotation ?? 0;
            const pads = fp.pads ?? [];
            for (const pad of pads) {
                const padLayers = pad.layers ?? [];
                if (padLayers.length === 0 ||
                    padLayers.includes(layerId) ||
                    padLayers.includes(layerName) ||
                    padLayers.some((l) => l.toLowerCase().includes('mask'))) {
                    // Expand pad slightly for mask opening
                    this.renderPad(pad, fpPos, fpRot, 0.1);
                }
            }
        }
        // Via mask openings
        const vias = document.vias ?? [];
        for (const via of vias) {
            this.renderVia(via, 0.1);
        }
        this.commands.push(this.footer());
        return this.commands.join('\n');
    }
    generatePasteMask(document, layer) {
        this.reset();
        const layerName = layer.name ?? 'PasteMask';
        this.commands.push(this.header(layerName, 'positive'));
        const footprints = document.footprints ?? [];
        const layerId = layer.id ?? layerName;
        for (const fp of footprints) {
            const fpPos = fp.position ?? { x: 0, y: 0 };
            const fpRot = fp.rotation ?? 0;
            const pads = fp.pads ?? [];
            for (const pad of pads) {
                // Only SMD pads get paste
                const padDrill = pad.drill;
                if (padDrill && padDrill > 0)
                    continue;
                const padLayers = pad.layers ?? [];
                if (padLayers.length === 0 ||
                    padLayers.includes(layerId) ||
                    padLayers.includes(layerName) ||
                    padLayers.some((l) => l.toLowerCase().includes('paste'))) {
                    this.renderPad(pad, fpPos, fpRot, -0.05); // slight inset for paste
                }
            }
        }
        this.commands.push(this.footer());
        return this.commands.join('\n');
    }
    generateBoardOutline(document) {
        this.reset();
        this.commands.push(this.header('BoardOutline', 'positive'));
        const outline = document.boardOutline;
        if (outline) {
            this.renderOutline(outline);
        }
        this.commands.push(this.footer());
        return this.commands.join('\n');
    }
    /* ================================================================ */
    /*  RS‑274X Primitives                                               */
    /* ================================================================ */
    header(layerName, polarity) {
        const lp = polarity === 'positive' ? '%LPD*%' : '%LPC*%';
        return [
            'G04 Generated by OpenCAD*',
            `G04 Layer: ${layerName}*`,
            '%MOMM*%', // metric (mm)
            '%FSLAX26Y26*%', // format: leading‑zero suppression, absolute, 2.6
            '%TF.GenerationSoftware,OpenCAD,1.0.0*%',
            `%TF.FileFunction,${layerName}*%`,
            lp,
        ].join('\n');
    }
    footer() {
        return 'M02*';
    }
    defineAperture(aperture) {
        const code = `D${aperture.code}`;
        switch (aperture.type) {
            case 'circle': {
                const d = aperture.parameters[0];
                return `%ADD${aperture.code}C,${d.toFixed(6)}*%`;
            }
            case 'rectangle': {
                const w = aperture.parameters[0];
                const h = aperture.parameters[1] ?? w;
                return `%ADD${aperture.code}R,${w.toFixed(6)}X${h.toFixed(6)}*%`;
            }
            case 'obround': {
                const w = aperture.parameters[0];
                const h = aperture.parameters[1] ?? w;
                return `%ADD${aperture.code}O,${w.toFixed(6)}X${h.toFixed(6)}*%`;
            }
            case 'polygon': {
                const od = aperture.parameters[0]; // outer diameter
                const n = aperture.parameters[1] ?? 4; // num vertices
                const rot = aperture.parameters[2] ?? 0;
                return `%ADD${aperture.code}P,${od.toFixed(6)}X${n}X${rot.toFixed(6)}*%`;
            }
            default:
                return `%ADD${aperture.code}C,0.100000*%`;
        }
    }
    selectAperture(code) {
        return `D${code}*`;
    }
    /** Move without drawing (D02). */
    moveTo(x, y) {
        return `X${this.formatCoord(x)}Y${this.formatCoord(y)}D02*`;
    }
    /** Draw line to (D01). */
    lineTo(x, y) {
        return `X${this.formatCoord(x)}Y${this.formatCoord(y)}D01*`;
    }
    /** Flash aperture at position (D03). */
    flash(x, y) {
        return `X${this.formatCoord(x)}Y${this.formatCoord(y)}D03*`;
    }
    /** Layer polarity. */
    setPolarity(dark) {
        return dark ? '%LPD*%' : '%LPC*%';
    }
    /** Start region fill (G36). */
    regionStart() {
        return 'G36*';
    }
    /** End region fill (G37). */
    regionEnd() {
        return 'G37*';
    }
    /**
     * Format a co‑ordinate value (mm) into Gerber 2.6 integer format.
     *
     * The 2.6 format means 2 integer digits and 6 fractional digits with
     * *leading‑zero suppression*.  The value is in mm so we multiply by
     * 10^6 to get the integer representation.
     */
    formatCoord(value) {
        const intVal = Math.round(value * 1_000_000);
        // Leading-zero suppression: just output the integer, negative sign preserved
        return intVal.toString();
    }
    /* ================================================================ */
    /*  Render helpers                                                   */
    /* ================================================================ */
    renderTrack(track) {
        const width = track.width ?? 0.25;
        const start = track.start ?? { x: 0, y: 0 };
        const end = track.end ?? { x: 0, y: 0 };
        const apCode = this.addAperture({
            code: 0,
            type: 'circle',
            parameters: [width],
        });
        this.commands.push(this.selectAperture(apCode));
        this.commands.push(this.moveTo(start.x, start.y));
        this.commands.push(this.lineTo(end.x, end.y));
    }
    renderPad(pad, footprintPos, footprintRot, expansion = 0) {
        const padPos = pad.position ?? { x: 0, y: 0 };
        const padSize = pad.size ?? { x: 1, y: 1 };
        const padShape = pad.shape ?? 'circle';
        // Absolute pad position (local + footprint origin, rotated)
        const local = new Vector2D(footprintPos.x + padPos.x, footprintPos.y + padPos.y);
        const abs = rotatePoint(local, footprintPos, footprintRot);
        const w = padSize.x + expansion * 2;
        const h = padSize.y + expansion * 2;
        let apType;
        let params;
        switch (padShape) {
            case 'rect':
            case 'rectangle':
                apType = 'rectangle';
                params = [w, h];
                break;
            case 'obround':
            case 'oval':
                apType = 'obround';
                params = [w, h];
                break;
            case 'polygon':
                apType = 'polygon';
                params = [Math.max(w, h), pad.polygonSides ?? 4, 0];
                break;
            case 'circle':
            default:
                apType = 'circle';
                params = [Math.max(w, h)];
                break;
        }
        const apCode = this.addAperture({
            code: 0,
            type: apType,
            parameters: params,
        });
        this.commands.push(this.selectAperture(apCode));
        this.commands.push(this.flash(abs.x, abs.y));
    }
    renderVia(via, expansion = 0) {
        const pos = via.position ?? { x: 0, y: 0 };
        const diameter = via.diameter ?? 0.6;
        const apCode = this.addAperture({
            code: 0,
            type: 'circle',
            parameters: [diameter + expansion * 2],
        });
        this.commands.push(this.selectAperture(apCode));
        this.commands.push(this.flash(pos.x, pos.y));
    }
    renderZone(zone) {
        const outline = zone.outline ?? [];
        if (outline.length < 3)
            return;
        // Use a minimal aperture for region fills
        const apCode = this.addAperture({
            code: 0,
            type: 'circle',
            parameters: [0.01],
        });
        this.commands.push(this.selectAperture(apCode));
        this.commands.push(this.setPolarity(true));
        this.commands.push(this.regionStart());
        this.commands.push(this.moveTo(outline[0].x, outline[0].y));
        for (let i = 1; i < outline.length; i++) {
            this.commands.push(this.lineTo(outline[i].x, outline[i].y));
        }
        // Close the polygon
        this.commands.push(this.lineTo(outline[0].x, outline[0].y));
        this.commands.push(this.regionEnd());
    }
    renderOutline(outline) {
        const vertices = outline.vertices ?? [];
        if (vertices.length < 2)
            return;
        // Board outline is typically drawn with a thin line
        const apCode = this.addAperture({
            code: 0,
            type: 'circle',
            parameters: [0.1],
        });
        this.commands.push(this.selectAperture(apCode));
        this.commands.push(this.moveTo(vertices[0].x, vertices[0].y));
        for (let i = 1; i < vertices.length; i++) {
            this.commands.push(this.lineTo(vertices[i].x, vertices[i].y));
        }
        // Close
        this.commands.push(this.lineTo(vertices[0].x, vertices[0].y));
    }
    /* ================================================================ */
    /*  Internal utilities                                               */
    /* ================================================================ */
    /**
     * Register an aperture (or return the code of an existing identical
     * one) and emit the `%ADD…%` definition into the command list.
     */
    addAperture(template) {
        // See if we already have an identical aperture
        for (const existing of this.apertures) {
            if (existing.type === template.type &&
                existing.parameters.length === template.parameters.length &&
                existing.parameters.every((v, i) => Math.abs(v - template.parameters[i]) < 1e-9)) {
                return existing.code;
            }
        }
        const code = this.apertureIndex++;
        const aperture = {
            code,
            type: template.type,
            parameters: [...template.parameters],
        };
        this.apertures.push(aperture);
        this.commands.push(this.defineAperture(aperture));
        return code;
    }
    reset() {
        this.apertures = [];
        this.commands = [];
        this.apertureIndex = 10;
    }
    sanitiseFilename(name) {
        return name
            .replace(/[^a-zA-Z0-9_\-.]/g, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
    }
}
//# sourceMappingURL=gerber-generator.js.map