import { Vector2D, EventBus, CommandHistory, generateId, defaultDesignRules, } from '@opencad/core';
import { WebGLRenderer, LayerManager, HitTester, createPCBLayers, } from '@opencad/renderer';
import { DeleteItemCommand } from './commands';
import { RatsnestCalculator } from '../routing/ratsnest';
export class PCBEditor {
    document;
    renderer;
    camera;
    eventBus;
    commandHistory;
    hitTester;
    layerManager;
    activeTool = null;
    selection = new Set();
    activeLayer;
    designRules;
    canvas;
    animationFrameId = null;
    ratsnestLines = [];
    ratsnestCalculator;
    gridSettings;
    boundOnMouseDown;
    boundOnMouseMove;
    boundOnMouseUp;
    boundOnWheel;
    boundOnKeyDown;
    constructor(canvas) {
        this.canvas = canvas;
        // Initialize core systems
        this.renderer = new WebGLRenderer(canvas);
        this.camera = this.renderer.getCamera();
        this.eventBus = new EventBus();
        this.commandHistory = new CommandHistory();
        this.hitTester = new HitTester();
        this.layerManager = new LayerManager();
        this.ratsnestCalculator = new RatsnestCalculator();
        // Set up default layer stack
        this.layerManager = createPCBLayers();
        // Default settings
        this.activeLayer = 'F.Cu';
        this.designRules = { ...defaultDesignRules };
        this.gridSettings = {
            majorSpacing: 2.54, // 100mil
            minorSpacing: 1.27, // 50mil
            snapSize: 0.635, // 25mil
            visible: true,
        };
        // Initialize empty document
        this.document = {
            id: generateId(),
            name: 'Untitled PCB',
            footprints: [],
            tracks: [],
            vias: [],
            copperZones: [],
            boardOutline: { points: [] },
            nets: [],
        };
        // Bind event handlers
        this.boundOnMouseDown = this.onMouseDown.bind(this);
        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnMouseUp = this.onMouseUp.bind(this);
        this.boundOnWheel = this.onWheel.bind(this);
        this.boundOnKeyDown = this.onKeyDown.bind(this);
        // Attach event listeners
        canvas.addEventListener('mousedown', this.boundOnMouseDown);
        canvas.addEventListener('mousemove', this.boundOnMouseMove);
        canvas.addEventListener('mouseup', this.boundOnMouseUp);
        canvas.addEventListener('wheel', this.boundOnWheel, { passive: false });
        window.addEventListener('keydown', this.boundOnKeyDown);
    }
    resize(_width, _height) {
        this.renderer.resize();
    }
    // ─── Document Management ────────────────────────────────────
    newDocument() {
        this.document = {
            id: generateId(),
            name: 'Untitled PCB',
            footprints: [],
            tracks: [],
            vias: [],
            copperZones: [],
            boardOutline: { points: [] },
            nets: [],
        };
        this.selection.clear();
        this.commandHistory = new CommandHistory();
        this.ratsnestLines = [];
        this.eventBus.emit('pcb:document-changed', { document: this.document });
    }
    getDocument() {
        return this.document;
    }
    /**
     * Replace the current document with an externally-loaded one
     * (e.g. from a sample project or KiCad import).
     */
    loadDocument(doc) {
        if (!doc) {
            throw new Error('Cannot load a null or undefined document');
        }
        const toPoint = (p) => {
            if (p instanceof Vector2D)
                return p;
            return new Vector2D(Number(p?.x ?? 0), Number(p?.y ?? 0));
        };
        const normalizedFootprints = (doc.footprints ?? []).map((fp) => ({
            ...fp,
            position: toPoint(fp.position),
            rotation: Number(fp.rotation ?? 0),
            reference: fp.reference ?? fp.name ?? '',
            layer: fp.layer ?? fp.layers?.[0] ?? 'F.Cu',
            pads: (fp.pads ?? []).map((pad) => ({
                ...pad,
                position: toPoint(pad.position),
                width: Number(pad.width ?? pad.size?.x ?? 1),
                height: Number(pad.height ?? pad.size?.y ?? 1),
                layer: pad.layer ?? pad.layers?.[0] ?? fp.layer ?? 'F.Cu',
                shape: pad.shape ?? 'rect',
            })),
            silkscreen: fp.silkscreen ?? [],
        }));
        const normalizedTracks = (doc.tracks ?? []).map((track) => ({
            ...track,
            start: toPoint(track.start),
            end: toPoint(track.end),
            width: Number(track.width ?? 0.2),
        }));
        const normalizedVias = (doc.vias ?? []).map((via) => ({
            ...via,
            position: toPoint(via.position),
            diameter: Number(via.diameter ?? via.size ?? 0.8),
            drill: Number(via.drill ?? via.drillDiameter ?? 0.4),
        }));
        const normalizedOutlinePoints = (doc.boardOutline?.points ?? doc.boardOutline?.polygon ?? [])
            .map((p) => toPoint(p));
        const normalizedZones = (doc.copperZones ?? doc.zones ?? []).map((zone) => ({
            ...zone,
            polygon: (zone.polygon ?? []).map((p) => toPoint(p)),
        }));
        const normalizedNets = (doc.nets ?? []).map((net) => ({
            ...net,
            pins: net.pins ?? [],
        }));
        this.document = {
            ...doc,
            footprints: normalizedFootprints,
            tracks: normalizedTracks,
            vias: normalizedVias,
            copperZones: normalizedZones,
            boardOutline: { points: normalizedOutlinePoints },
            nets: normalizedNets,
        };
        // Reset editor state
        this.selection.clear();
        this.commandHistory = new CommandHistory();
        this.ratsnestLines = [];
        // Recalculate ratsnest if the document has nets
        if (this.document.nets.length > 0) {
            this.updateRatsnest();
        }
        this.eventBus.emit('pcb:document-changed', { document: this.document });
    }
    /**
     * Import a netlist from the schematic editor.
     * Creates footprint placeholders for each component and sets up net assignments.
     */
    importNetlist(netlist) {
        // Create a map of existing footprints by refDes
        const existingFP = new Map();
        for (const fp of this.document.footprints) {
            if (fp.reference) {
                existingFP.set(fp.reference, fp);
            }
        }
        // Create or update nets
        const netMap = new Map();
        for (const netDef of netlist.nets) {
            const netId = generateId();
            const net = {
                id: netId,
                name: netDef.name,
                pins: netDef.pins,
            };
            netMap.set(netDef.name, net);
        }
        this.document.nets = Array.from(netMap.values());
        // Place footprints for components not already on the board
        let placementX = 10;
        let placementY = 10;
        const spacingX = 15;
        const spacingY = 15;
        const perRow = 5;
        let count = 0;
        for (const comp of netlist.components) {
            if (existingFP.has(comp.refDes))
                continue;
            // Create a placeholder footprint
            const fp = {
                id: generateId(),
                reference: comp.refDes,
                value: comp.value,
                footprintId: comp.footprintId,
                position: {
                    x: placementX + (count % perRow) * spacingX,
                    y: placementY + Math.floor(count / perRow) * spacingY,
                },
                rotation: 0,
                layer: 'F.Cu',
                pads: [],
                silkscreen: [],
            };
            // Create pads based on net connections
            let padIndex = 0;
            for (const netDef of netlist.nets) {
                for (const pin of netDef.pins) {
                    if (pin.refDes === comp.refDes) {
                        const pad = {
                            id: generateId(),
                            number: pin.pin,
                            position: {
                                x: (padIndex % 2 === 0 ? -1.27 : 1.27),
                                y: Math.floor(padIndex / 2) * 2.54 - 2.54,
                            },
                            width: 1.6,
                            height: 1.6,
                            shape: 'round',
                            type: 'smd',
                            layer: 'F.Cu',
                            netId: netMap.get(netDef.name)?.id ?? '',
                            drill: 0,
                        };
                        fp.pads.push(pad);
                        padIndex++;
                    }
                }
            }
            this.document.footprints.push(fp);
            count++;
        }
        // Update net assignments on existing footprints
        for (const netDef of netlist.nets) {
            const net = netMap.get(netDef.name);
            if (!net)
                continue;
            for (const pin of netDef.pins) {
                const fp = existingFP.get(pin.refDes);
                if (!fp)
                    continue;
                const pad = fp.pads.find((p) => p.number === pin.pin);
                if (pad) {
                    pad.netId = net.id;
                }
            }
        }
        this.updateRatsnest();
        this.eventBus.emit('netlist:updated', { netlist });
    }
    // ─── Layer Management ───────────────────────────────────────
    setActiveLayer(layer) {
        this.activeLayer = layer;
        this.eventBus.emit('pcb:layer-changed', { layer });
    }
    getActiveLayer() {
        return this.activeLayer;
    }
    getLayerManager() {
        return this.layerManager;
    }
    // ─── Tool Management ───────────────────────────────────────
    setTool(tool) {
        if (this.activeTool) {
            this.activeTool.onDeactivate();
        }
        this.activeTool = tool;
        this.canvas.style.cursor = tool.cursor;
        tool.onActivate(this);
        this.eventBus.emit('pcb:tool-changed', { tool: tool.name });
    }
    // ─── Selection ─────────────────────────────────────────────
    getSelection() {
        return this.selection;
    }
    select(ids) {
        for (const id of ids) {
            this.selection.add(id);
        }
        this.eventBus.emit('pcb:selection-changed', {
            selection: Array.from(this.selection),
        });
    }
    clearSelection() {
        this.selection.clear();
        this.eventBus.emit('pcb:selection-changed', { selection: [] });
    }
    deleteSelection() {
        const doc = this.document;
        for (const id of this.selection) {
            const cmd = new DeleteItemCommand(doc, id);
            this.commandHistory.execute(cmd);
        }
        this.selection.clear();
        this.updateRatsnest();
        this.eventBus.emit('pcb:selection-changed', { selection: [] });
    }
    // ─── Command Execution ────────────────────────────────────
    executeCommand(cmd) {
        this.commandHistory.execute(cmd);
        this.eventBus.emit('pcb:document-modified', { command: cmd.description });
    }
    // ─── Undo/Redo ─────────────────────────────────────────────
    undo() {
        this.commandHistory.undo();
        this.updateRatsnest();
        this.eventBus.emit('pcb:undo', {});
    }
    redo() {
        this.commandHistory.redo();
        this.updateRatsnest();
        this.eventBus.emit('pcb:redo', {});
    }
    // ─── Design Rules ──────────────────────────────────────────
    getDesignRules() {
        return this.designRules;
    }
    setDesignRules(rules) {
        this.designRules = { ...rules };
    }
    // ─── Grid Settings ─────────────────────────────────────────
    getGridSettings() {
        return this.gridSettings;
    }
    // ─── Event Bus ─────────────────────────────────────────────
    getEventBus() {
        return this.eventBus;
    }
    // ─── Rendering ─────────────────────────────────────────────
    render() {
        this.renderer.clear();
        this.renderer.setCamera(this.camera);
        // Draw grid
        this.renderer.drawGrid(this.gridSettings, this.camera);
        // Draw board outline
        this.renderBoardOutline();
        // Draw copper zones
        this.renderCopperZones();
        // Draw tracks
        this.renderTracks();
        // Draw vias
        this.renderVias();
        // Draw footprints
        this.renderFootprints();
        // Draw ratsnest
        this.renderRatsnest();
        // Draw selection highlights
        this.renderSelection();
        // Draw tool preview
        if (this.activeTool) {
            this.activeTool.renderPreview(this.renderer);
        }
        this.renderer.flush();
    }
    startRenderLoop() {
        const loop = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }
    stopRenderLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    // ─── Ratsnest ──────────────────────────────────────────────
    updateRatsnest() {
        this.ratsnestLines = this.ratsnestCalculator.calculate(this.document);
        this.eventBus.emit('pcb:ratsnest-updated', {
            lineCount: this.ratsnestLines.length,
        });
    }
    // ─── Hit Testing ──────────────────────────────────────────
    hitTest(worldPos) {
        const tolerance = 1.0 / this.camera.getZoom();
        // Check footprints
        for (const fp of this.document.footprints) {
            // Check pads first (higher priority)
            const cos = Math.cos(fp.rotation);
            const sin = Math.sin(fp.rotation);
            for (const pad of fp.pads) {
                const padWorld = {
                    x: fp.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: fp.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const hw = (pad.width ?? 1) / 2 + tolerance;
                const hh = (pad.height ?? 1) / 2 + tolerance;
                if (worldPos.x >= padWorld.x - hw &&
                    worldPos.x <= padWorld.x + hw &&
                    worldPos.y >= padWorld.y - hh &&
                    worldPos.y <= padWorld.y + hh) {
                    return fp.id; // Return footprint ID for selection
                }
            }
            // Check overall footprint bounds
            const bbox = this.computeFootprintBBox(fp);
            if (worldPos.x >= bbox.minX - tolerance &&
                worldPos.x <= bbox.maxX + tolerance &&
                worldPos.y >= bbox.minY - tolerance &&
                worldPos.y <= bbox.maxY + tolerance) {
                return fp.id;
            }
        }
        // Check tracks
        for (const track of this.document.tracks) {
            const dist = pointToSegmentDistance(worldPos, track.start, track.end);
            if (dist <= track.width / 2 + tolerance) {
                return track.id;
            }
        }
        // Check vias
        for (const via of this.document.vias) {
            const dx = worldPos.x - via.position.x;
            const dy = worldPos.y - via.position.y;
            if (Math.sqrt(dx * dx + dy * dy) <= via.diameter / 2 + tolerance) {
                return via.id;
            }
        }
        return null;
    }
    hitTestBox(bbox) {
        const ids = [];
        // Footprints
        for (const fp of this.document.footprints) {
            const fpBBox = this.computeFootprintBBox(fp);
            if (bboxOverlap(bbox, fpBBox)) {
                ids.push(fp.id);
            }
        }
        // Tracks
        for (const track of this.document.tracks) {
            if (segmentIntersectsBox(track.start, track.end, bbox) ||
                pointInBox(track.start, bbox) ||
                pointInBox(track.end, bbox)) {
                ids.push(track.id);
            }
        }
        // Vias
        for (const via of this.document.vias) {
            if (pointInBox(via.position, bbox)) {
                ids.push(via.id);
            }
        }
        return ids;
    }
    /**
     * Find a pad at the given world position.
     */
    findPadAt(worldPos) {
        const tolerance = 1.0 / this.camera.getZoom();
        for (const fp of this.document.footprints) {
            const cos = Math.cos(fp.rotation);
            const sin = Math.sin(fp.rotation);
            for (const pad of fp.pads) {
                const padWorld = {
                    x: fp.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: fp.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const hw = (pad.width ?? 1) / 2 + tolerance;
                const hh = (pad.height ?? 1) / 2 + tolerance;
                if (worldPos.x >= padWorld.x - hw &&
                    worldPos.x <= padWorld.x + hw &&
                    worldPos.y >= padWorld.y - hh &&
                    worldPos.y <= padWorld.y + hh) {
                    return {
                        padId: pad.id,
                        netId: pad.netId ?? '',
                        footprintId: fp.id,
                    };
                }
            }
        }
        return null;
    }
    // ─── Mouse/Keyboard Events ────────────────────────────────
    onMouseDown(e) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        if (e.button === 1) {
            // Middle button — start panning
            this.camera.startPan(e.clientX, e.clientY);
            return;
        }
        if (this.activeTool) {
            this.activeTool.onMouseDown(worldPos, e);
        }
    }
    onMouseMove(e) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        if (this.camera.isPanning()) {
            this.camera.updatePan(e.clientX, e.clientY);
            return;
        }
        if (this.activeTool) {
            this.activeTool.onMouseMove(worldPos, e);
        }
    }
    onMouseUp(e) {
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        if (e.button === 1) {
            this.camera.endPan();
            return;
        }
        if (this.activeTool) {
            this.activeTool.onMouseUp(worldPos, e);
        }
    }
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.camera.zoomAt(x, y, zoomFactor);
    }
    onKeyDown(e) {
        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    if (e.shiftKey) {
                        this.redo();
                    }
                    else {
                        this.undo();
                    }
                    e.preventDefault();
                    return;
                case 'y':
                    this.redo();
                    e.preventDefault();
                    return;
                case 'a':
                    // Select all
                    const allIds = [];
                    for (const fp of this.document.footprints)
                        allIds.push(fp.id);
                    for (const t of this.document.tracks)
                        allIds.push(t.id);
                    for (const v of this.document.vias)
                        allIds.push(v.id);
                    this.select(allIds);
                    e.preventDefault();
                    return;
            }
        }
        if (this.activeTool) {
            this.activeTool.onKeyDown(e);
        }
    }
    // ─── Cleanup ───────────────────────────────────────────────
    destroy() {
        this.stopRenderLoop();
        this.canvas.removeEventListener('mousedown', this.boundOnMouseDown);
        this.canvas.removeEventListener('mousemove', this.boundOnMouseMove);
        this.canvas.removeEventListener('mouseup', this.boundOnMouseUp);
        this.canvas.removeEventListener('wheel', this.boundOnWheel);
        window.removeEventListener('keydown', this.boundOnKeyDown);
        if (this.activeTool) {
            this.activeTool.onDeactivate();
            this.activeTool = null;
        }
        this.renderer.destroy();
    }
    // ─── Private Rendering Methods ────────────────────────────
    renderBoardOutline() {
        if (!this.document.boardOutline?.points?.length)
            return;
        const pts = this.document.boardOutline.points;
        const color = { r: 1.0, g: 1.0, b: 0.0, a: 1.0 };
        const lineWidth = 0.15;
        for (let i = 0; i < pts.length; i++) {
            const next = pts[(i + 1) % pts.length];
            this.renderer.drawLine(pts[i], next, lineWidth, color);
        }
    }
    renderTracks() {
        for (const track of this.document.tracks) {
            if (!this.layerManager.isLayerVisible(track.layer))
                continue;
            const color = this.getLayerColor(track.layer);
            this.renderer.drawLine(track.start, track.end, track.width, color);
        }
    }
    renderVias() {
        for (const via of this.document.vias) {
            // Outer annular ring
            this.renderer.drawCircle(via.position, via.diameter / 2, {
                r: 0.7,
                g: 0.7,
                b: 0.7,
                a: 1.0,
            });
            // Drill hole
            this.renderer.drawCircle(via.position, via.drill / 2, {
                r: 0.1,
                g: 0.1,
                b: 0.1,
                a: 1.0,
            });
        }
    }
    renderFootprints() {
        for (const fp of this.document.footprints) {
            const cos = Math.cos(fp.rotation);
            const sin = Math.sin(fp.rotation);
            // Render pads
            for (const pad of fp.pads) {
                const padWorld = {
                    x: fp.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: fp.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const padLayer = pad.layer ?? fp.layer ?? 'F.Cu';
                if (!this.layerManager.isLayerVisible(padLayer))
                    continue;
                const color = this.getLayerColor(padLayer);
                const hw = (pad.width ?? 1) / 2;
                const hh = (pad.height ?? 1) / 2;
                if (pad.shape === 'round' || pad.shape === undefined) {
                    this.renderer.drawCircle(padWorld, Math.max(hw, hh), color);
                }
                else {
                    this.renderer.drawRect({ x: padWorld.x - hw, y: padWorld.y - hh }, { x: padWorld.x + hw, y: padWorld.y + hh }, color, color, 0);
                }
                // Draw pad number
                if (pad.number) {
                    this.renderer.drawText(pad.number, padWorld, { r: 1, g: 1, b: 1, a: 1 }, 0.5);
                }
            }
            // Render silkscreen
            if (fp.silkscreen) {
                for (const silk of fp.silkscreen) {
                    const silkLayer = silk.layer ?? 'F.SilkS';
                    if (!this.layerManager.isLayerVisible(silkLayer))
                        continue;
                    // Render silk screen items (simplified — draw text/lines)
                    if (silk.type === 'text' && silk.text) {
                        const pos = {
                            x: fp.position.x + (silk.position?.x ?? 0) * cos - (silk.position?.y ?? 0) * sin,
                            y: fp.position.y + (silk.position?.x ?? 0) * sin + (silk.position?.y ?? 0) * cos,
                        };
                        this.renderer.drawText(silk.text, pos, { r: 1, g: 1, b: 1, a: 0.9 }, silk.size ?? 1);
                    }
                }
            }
            // Draw reference designator
            if (fp.reference) {
                const refPos = {
                    x: fp.position.x,
                    y: fp.position.y - 2.0,
                };
                const silkColor = fp.layer === 'F.Cu'
                    ? { r: 1, g: 1, b: 0, a: 0.9 }
                    : { r: 0, g: 1, b: 1, a: 0.9 };
                this.renderer.drawText(fp.reference, refPos, silkColor, 1.0);
            }
        }
    }
    renderCopperZones() {
        for (const zone of this.document.copperZones) {
            if (!this.layerManager.isLayerVisible(zone.layer))
                continue;
            if (!zone.polygon || zone.polygon.length < 3)
                continue;
            const color = this.getLayerColor(zone.layer);
            const fillColor = { ...color, a: 0.3 };
            // Draw zone outline
            for (let i = 0; i < zone.polygon.length; i++) {
                const next = zone.polygon[(i + 1) % zone.polygon.length];
                this.renderer.drawLine(zone.polygon[i], next, 0.1, color);
            }
        }
    }
    renderRatsnest() {
        const color = { r: 0.3, g: 0.3, b: 1.0, a: 0.5 };
        for (const line of this.ratsnestLines) {
            this.renderer.drawLine(line.start, line.end, 0.05, color);
        }
    }
    renderSelection() {
        const highlightColor = { r: 1.0, g: 1.0, b: 1.0, a: 0.3 };
        const outlineColor = { r: 1.0, g: 1.0, b: 1.0, a: 0.8 };
        for (const id of this.selection) {
            // Find the item and highlight it
            const fp = this.document.footprints.find((f) => f.id === id);
            if (fp) {
                const bbox = this.computeFootprintBBox(fp);
                this.renderer.drawRect({ x: bbox.minX, y: bbox.minY }, { x: bbox.maxX, y: bbox.maxY }, highlightColor, outlineColor, 0.1);
                continue;
            }
            const track = this.document.tracks.find((t) => t.id === id);
            if (track) {
                this.renderer.drawLine(track.start, track.end, track.width + 0.2, outlineColor);
                continue;
            }
            const via = this.document.vias.find((v) => v.id === id);
            if (via) {
                this.renderer.drawCircle(via.position, via.diameter / 2 + 0.15, outlineColor);
                continue;
            }
        }
    }
    // ─── Utility Methods ──────────────────────────────────────
    screenToWorld(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        return this.camera.screenToWorld(screenX, screenY);
    }
    computeFootprintBBox(fp) {
        const cos = Math.cos(fp.rotation);
        const sin = Math.sin(fp.rotation);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        if (fp.pads.length === 0) {
            // No pads — use a default size
            return {
                minX: fp.position.x - 1,
                minY: fp.position.y - 1,
                maxX: fp.position.x + 1,
                maxY: fp.position.y + 1,
            };
        }
        for (const pad of fp.pads) {
            const wx = fp.position.x + pad.position.x * cos - pad.position.y * sin;
            const wy = fp.position.y + pad.position.x * sin + pad.position.y * cos;
            const hw = (pad.width ?? 1) / 2;
            const hh = (pad.height ?? 1) / 2;
            if (wx - hw < minX)
                minX = wx - hw;
            if (wy - hh < minY)
                minY = wy - hh;
            if (wx + hw > maxX)
                maxX = wx + hw;
            if (wy + hh > maxY)
                maxY = wy + hh;
        }
        return { minX, minY, maxX, maxY };
    }
    getLayerColor(layer) {
        switch (layer) {
            case 'F.Cu':
                return { r: 0.8, g: 0.0, b: 0.0, a: 0.85 };
            case 'B.Cu':
                return { r: 0.0, g: 0.0, b: 0.8, a: 0.85 };
            case 'In1.Cu':
                return { r: 0.8, g: 0.8, b: 0.0, a: 0.85 };
            case 'In2.Cu':
                return { r: 0.0, g: 0.8, b: 0.0, a: 0.85 };
            case 'F.SilkS':
                return { r: 1.0, g: 1.0, b: 1.0, a: 0.9 };
            case 'B.SilkS':
                return { r: 0.5, g: 0.0, b: 0.5, a: 0.9 };
            case 'F.Mask':
                return { r: 0.5, g: 0.0, b: 0.5, a: 0.4 };
            case 'B.Mask':
                return { r: 0.0, g: 0.5, b: 0.5, a: 0.4 };
            default:
                return { r: 0.5, g: 0.5, b: 0.5, a: 0.7 };
        }
    }
}
// ─── Geometry Utilities ─────────────────────────────────────────
function pointToSegmentDistance(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq < 1e-10) {
        const ddx = p.x - a.x;
        const ddy = p.y - a.y;
        return Math.sqrt(ddx * ddx + ddy * ddy);
    }
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * dx, y: a.y + t * dy };
    const ddx = p.x - proj.x;
    const ddy = p.y - proj.y;
    return Math.sqrt(ddx * ddx + ddy * ddy);
}
function bboxOverlap(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}
function pointInBox(p, box) {
    return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
}
function segmentIntersectsBox(a, b, box) {
    // Cohen-Sutherland line clipping test
    const INSIDE = 0;
    const LEFT = 1;
    const RIGHT = 2;
    const BOTTOM = 4;
    const TOP = 8;
    const computeCode = (p) => {
        let code = INSIDE;
        if (p.x < box.minX)
            code |= LEFT;
        else if (p.x > box.maxX)
            code |= RIGHT;
        if (p.y < box.minY)
            code |= BOTTOM;
        else if (p.y > box.maxY)
            code |= TOP;
        return code;
    };
    let codeA = computeCode(a);
    let codeB = computeCode(b);
    let x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
    for (let i = 0; i < 10; i++) {
        if (!(codeA | codeB))
            return true; // Both inside
        if (codeA & codeB)
            return false; // Both in same outside region
        const codeOut = codeA !== 0 ? codeA : codeB;
        let x = 0, y = 0;
        if (codeOut & TOP) {
            x = x1 + ((x2 - x1) * (box.maxY - y1)) / (y2 - y1);
            y = box.maxY;
        }
        else if (codeOut & BOTTOM) {
            x = x1 + ((x2 - x1) * (box.minY - y1)) / (y2 - y1);
            y = box.minY;
        }
        else if (codeOut & RIGHT) {
            y = y1 + ((y2 - y1) * (box.maxX - x1)) / (x2 - x1);
            x = box.maxX;
        }
        else if (codeOut & LEFT) {
            y = y1 + ((y2 - y1) * (box.minX - x1)) / (x2 - x1);
            x = box.minX;
        }
        if (codeOut === codeA) {
            x1 = x;
            y1 = y;
            codeA = computeCode({ x: x1, y: y1 });
        }
        else {
            x2 = x;
            y2 = y;
            codeB = computeCode({ x: x2, y: y2 });
        }
    }
    return false;
}
//# sourceMappingURL=pcb-editor.js.map