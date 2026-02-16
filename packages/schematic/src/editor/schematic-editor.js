import { Vector2D, EventBus, CommandHistory, generateId, } from '@opencad/core';
import { Canvas2DRenderer, HitTester, } from '@opencad/renderer';
import { SelectTool } from './tools';
import { SchematicRenderer } from '../rendering/schematic-renderer';
import { DeleteComponentCommand, DeleteWireCommand, } from './commands';
export class SchematicEditor {
    document;
    activeSheet;
    renderer;
    camera;
    eventBus;
    commandHistory;
    hitTester;
    activeTool;
    selection;
    schematicRenderer;
    animFrameId = null;
    canvas;
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Canvas2DRenderer(canvas);
        this.camera = this.renderer.getCamera();
        this.eventBus = new EventBus();
        this.commandHistory = new CommandHistory();
        this.hitTester = new HitTester();
        this.selection = new Set();
        this.schematicRenderer = new SchematicRenderer();
        this.activeTool = null;
        // Initialise with a blank document
        this.document = {
            id: generateId(),
            title: 'Untitled',
            sheets: [],
        };
        this.addSheet('Sheet1');
        this.activeSheet = this.document.sheets[0];
        // Attach DOM event listeners
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        // Default tool
        this.setTool(new SelectTool());
    }
    resize(_width, _height) {
        this.camera.setViewport(this.canvas.width, this.canvas.height);
    }
    // ── Document management ──────────────────────────────────────────────────
    newDocument() {
        this.commandHistory = new CommandHistory();
        this.selection.clear();
        this.document = {
            id: generateId(),
            title: 'Untitled',
            sheets: [],
        };
        this.addSheet('Sheet1');
        this.activeSheet = this.document.sheets[0];
        this.eventBus.emit('document:new', this.document);
    }
    getDocument() {
        return this.document;
    }
    getActiveSheet() {
        return this.activeSheet;
    }
    /**
     * Replace the current document with an externally-loaded one
     * (e.g. from a sample project or KiCad import).
     */
    loadDocument(doc) {
        if (!doc) {
            throw new Error('Cannot load a null or undefined document');
        }
        this.document = {
            ...doc,
            sheets: doc.sheets ?? [],
        };
        // Reset editor state
        this.selection.clear();
        this.commandHistory = new CommandHistory();
        // Activate the first sheet, or create a blank one if the doc has none
        if (this.document.sheets.length === 0) {
            this.addSheet('Sheet1');
        }
        this.activeSheet = this.document.sheets[0];
        this.eventBus.emit('document:loaded', this.document);
        // Kick off rendering so the loaded content is visible immediately
        this.render();
    }
    setActiveSheet(sheetIndex) {
        if (sheetIndex < 0 || sheetIndex >= this.document.sheets.length) {
            throw new RangeError(`Sheet index ${sheetIndex} out of range`);
        }
        this.activeSheet = this.document.sheets[sheetIndex];
        this.selection.clear();
        this.eventBus.emit('sheet:changed', this.activeSheet);
    }
    addSheet(name) {
        const sheet = {
            id: generateId(),
            name: name ?? `Sheet${this.document.sheets.length + 1}`,
            components: [],
            wires: [],
            netLabels: [],
            powerPorts: [],
            junctions: [],
        };
        this.document.sheets.push(sheet);
        this.eventBus.emit('sheet:added', sheet);
        return sheet;
    }
    removeSheet(index) {
        if (this.document.sheets.length <= 1) {
            throw new Error('Cannot remove the last sheet');
        }
        if (index < 0 || index >= this.document.sheets.length) {
            throw new RangeError(`Sheet index ${index} out of range`);
        }
        const removed = this.document.sheets.splice(index, 1)[0];
        if (this.activeSheet === removed) {
            this.activeSheet =
                this.document.sheets[Math.min(index, this.document.sheets.length - 1)];
        }
        this.selection.clear();
        this.eventBus.emit('sheet:removed', removed);
    }
    // ── Tool management ──────────────────────────────────────────────────────
    setTool(tool) {
        if (this.activeTool) {
            this.activeTool.onDeactivate();
        }
        this.activeTool = tool;
        this.activeTool.onActivate(this);
        this.canvas.style.cursor = tool.cursor;
        this.eventBus.emit('tool:changed', tool.name);
    }
    getActiveTool() {
        return this.activeTool;
    }
    // ── Selection ────────────────────────────────────────────────────────────
    getSelection() {
        return this.selection;
    }
    select(ids) {
        for (const id of ids) {
            this.selection.add(id);
        }
        this.eventBus.emit('selection:changed', this.selection);
    }
    deselect(ids) {
        for (const id of ids) {
            this.selection.delete(id);
        }
        this.eventBus.emit('selection:changed', this.selection);
    }
    clearSelection() {
        this.selection.clear();
        this.eventBus.emit('selection:changed', this.selection);
    }
    selectAll() {
        for (const comp of this.activeSheet.components ?? []) {
            this.selection.add(comp.id);
        }
        for (const wire of this.activeSheet.wires ?? []) {
            this.selection.add(wire.id);
        }
        for (const label of this.activeSheet.netLabels ?? []) {
            this.selection.add(label.id);
        }
        this.eventBus.emit('selection:changed', this.selection);
    }
    deleteSelection() {
        if (this.selection.size === 0)
            return;
        const ids = Array.from(this.selection);
        // Separate IDs by type
        const compIds = [];
        const wireIds = [];
        const labelIds = [];
        const sheet = this.activeSheet;
        const compIdSet = new Set((sheet.components ?? []).map((c) => c.id));
        const wireIdSet = new Set((sheet.wires ?? []).map((w) => w.id));
        const labelIdSet = new Set((sheet.netLabels ?? []).map((l) => l.id));
        for (const id of ids) {
            if (compIdSet.has(id))
                compIds.push(id);
            else if (wireIdSet.has(id))
                wireIds.push(id);
            else if (labelIdSet.has(id))
                labelIds.push(id);
        }
        // Execute delete commands
        if (compIds.length > 0) {
            this.executeCommand(new DeleteComponentCommand(sheet, compIds));
        }
        if (wireIds.length > 0) {
            this.executeCommand(new DeleteWireCommand(sheet, wireIds));
        }
        // Net labels deleted same way as components (they're stored in netLabels array)
        if (labelIds.length > 0) {
            // Remove net labels inline – they don't have a dedicated delete command
            const removed = (sheet.netLabels ?? []).filter((l) => labelIds.includes(l.id));
            sheet.netLabels = (sheet.netLabels ?? []).filter((l) => !labelIds.includes(l.id));
            // We won't push a separate command here; the caller can extend if needed.
        }
        this.clearSelection();
    }
    // ── Command execution ────────────────────────────────────────────────────
    executeCommand(cmd) {
        this.commandHistory.execute(cmd);
        this.eventBus.emit('command:executed', cmd);
    }
    undo() {
        this.commandHistory.undo();
        this.eventBus.emit('command:undo', null);
    }
    redo() {
        this.commandHistory.redo();
        this.eventBus.emit('command:redo', null);
    }
    // ── Hit testing ──────────────────────────────────────────────────────────
    hitTest(worldPos) {
        const sheet = this.activeSheet;
        const hitRadius = 8 / this.camera.zoom;
        // Test components
        for (const comp of sheet.components ?? []) {
            const dx = worldPos.x - comp.position.x;
            const dy = worldPos.y - comp.position.y;
            // Simple bounding-box hit test (assume ~40x30 symbol)
            const halfW = 35;
            const halfH = 25;
            if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) {
                return comp.id;
            }
        }
        // Test wires
        for (const wire of sheet.wires ?? []) {
            for (let i = 0; i < wire.points.length - 1; i++) {
                const a = wire.points[i];
                const b = wire.points[i + 1];
                const dist = this.pointToSegmentDist(worldPos, a, b);
                if (dist <= hitRadius) {
                    return wire.id;
                }
            }
        }
        // Test net labels
        for (const label of sheet.netLabels ?? []) {
            const dx = worldPos.x - label.position.x;
            const dy = worldPos.y - label.position.y;
            if (dx >= -2 && dx <= 60 && Math.abs(dy) <= 12) {
                return label.id;
            }
        }
        return null;
    }
    pointToSegmentDist(p, a, b) {
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const apx = p.x - a.x;
        const apy = p.y - a.y;
        const abLenSq = abx * abx + aby * aby;
        if (abLenSq === 0) {
            return Math.hypot(apx, apy);
        }
        let t = (apx * abx + apy * aby) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = a.x + t * abx;
        const projY = a.y + t * aby;
        return Math.hypot(p.x - projX, p.y - projY);
    }
    // ── Rendering ────────────────────────────────────────────────────────────
    render() {
        this.renderer.beginFrame();
        // Render the active sheet
        this.schematicRenderer.renderSheet(this.renderer, this.activeSheet, this.selection);
        // Render active tool preview
        if (this.activeTool) {
            this.activeTool.renderPreview(this.renderer);
        }
        this.renderer.endFrame();
    }
    startRenderLoop() {
        const loop = () => {
            this.render();
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }
    stopRenderLoop() {
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }
    // ── Mouse/keyboard events ────────────────────────────────────────────────
    onMouseDown(e) {
        const worldPos = this.screenToWorld(new Vector2D(e.offsetX, e.offsetY));
        if (this.activeTool) {
            this.activeTool.onMouseDown(worldPos, e);
        }
    }
    onMouseMove(e) {
        const worldPos = this.screenToWorld(new Vector2D(e.offsetX, e.offsetY));
        if (this.activeTool) {
            this.activeTool.onMouseMove(worldPos, e);
        }
    }
    onMouseUp(e) {
        const worldPos = this.screenToWorld(new Vector2D(e.offsetX, e.offsetY));
        if (this.activeTool) {
            this.activeTool.onMouseUp(worldPos, e);
        }
    }
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const screenPos = new Vector2D(e.offsetX, e.offsetY);
        this.camera.zoomAt(screenPos, zoomFactor);
    }
    onKeyDown(e) {
        // Global shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.redo();
            }
            else {
                this.undo();
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            this.redo();
            return;
        }
        if (this.activeTool) {
            this.activeTool.onKeyDown(e);
        }
    }
    // ── Coordinate conversion ────────────────────────────────────────────────
    screenToWorld(screenPoint) {
        return this.camera.screenToWorld(screenPoint);
    }
    // ── Cleanup ──────────────────────────────────────────────────────────────
    destroy() {
        this.stopRenderLoop();
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('keydown', this.onKeyDown);
        if (this.activeTool) {
            this.activeTool.onDeactivate();
            this.activeTool = null;
        }
        this.selection.clear();
        this.eventBus.emit('editor:destroyed', null);
    }
}
//# sourceMappingURL=schematic-editor.js.map