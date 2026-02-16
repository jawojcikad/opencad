import { generateId, } from '@opencad/core';
import { snapToGrid } from '@opencad/renderer';
import { PlaceComponentCommand, MoveComponentCommand, DrawWireCommand, PlaceNetLabelCommand, } from './commands';
// ─── SelectTool ──────────────────────────────────────────────────────────────
export class SelectTool {
    name = 'select';
    cursor = 'default';
    editor = null;
    isDragging = false;
    isBoxSelecting = false;
    isMoving = false;
    dragStart = { x: 0, y: 0 };
    dragCurrent = { x: 0, y: 0 };
    moveStart = { x: 0, y: 0 };
    clickedOnSelected = false;
    onActivate(editor) {
        this.editor = editor;
    }
    onDeactivate() {
        this.isDragging = false;
        this.isBoxSelecting = false;
        this.isMoving = false;
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, 10);
        this.dragStart = snapped;
        this.dragCurrent = snapped;
        this.isDragging = true;
        const hitId = this.editor.hitTest(worldPos);
        if (hitId) {
            const selection = this.editor.getSelection();
            if (e.shiftKey) {
                if (selection.has(hitId)) {
                    this.editor.deselect([hitId]);
                }
                else {
                    this.editor.select([hitId]);
                }
                this.clickedOnSelected = false;
            }
            else {
                if (!selection.has(hitId)) {
                    this.editor.clearSelection();
                    this.editor.select([hitId]);
                }
                this.clickedOnSelected = true;
                this.moveStart = snapped;
                this.isMoving = true;
            }
        }
        else {
            if (!e.shiftKey) {
                this.editor.clearSelection();
            }
            this.isBoxSelecting = true;
        }
    }
    onMouseMove(worldPos, _e) {
        if (!this.editor || !this.isDragging)
            return;
        const snapped = snapToGrid(worldPos, 10);
        this.dragCurrent = snapped;
    }
    onMouseUp(worldPos, _e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, 10);
        if (this.isMoving) {
            const dx = snapped.x - this.moveStart.x;
            const dy = snapped.y - this.moveStart.y;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                const ids = Array.from(this.editor.getSelection());
                if (ids.length > 0) {
                    const cmd = new MoveComponentCommand(this.editor.getActiveSheet(), ids, { x: dx, y: dy });
                    this.editor.executeCommand(cmd);
                }
            }
        }
        if (this.isBoxSelecting) {
            const minX = Math.min(this.dragStart.x, snapped.x);
            const minY = Math.min(this.dragStart.y, snapped.y);
            const maxX = Math.max(this.dragStart.x, snapped.x);
            const maxY = Math.max(this.dragStart.y, snapped.y);
            if (maxX - minX > 1 || maxY - minY > 1) {
                const sheet = this.editor.getActiveSheet();
                const ids = [];
                for (const comp of sheet.components ?? []) {
                    if (comp.position.x >= minX &&
                        comp.position.x <= maxX &&
                        comp.position.y >= minY &&
                        comp.position.y <= maxY) {
                        ids.push(comp.id);
                    }
                }
                for (const wire of sheet.wires ?? []) {
                    const allInside = wire.points.every((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
                    if (allInside) {
                        ids.push(wire.id);
                    }
                }
                for (const label of sheet.netLabels ?? []) {
                    if (label.position.x >= minX &&
                        label.position.x <= maxX &&
                        label.position.y >= minY &&
                        label.position.y <= maxY) {
                        ids.push(label.id);
                    }
                }
                if (ids.length > 0) {
                    this.editor.select(ids);
                }
            }
        }
        this.isDragging = false;
        this.isBoxSelecting = false;
        this.isMoving = false;
        this.clickedOnSelected = false;
    }
    onKeyDown(e) {
        if (!this.editor)
            return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.editor.deleteSelection();
        }
        else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.editor.selectAll();
        }
        else if (e.key === 'Escape') {
            this.editor.clearSelection();
        }
    }
    renderPreview(renderer) {
        if (!this.isBoxSelecting || !this.isDragging)
            return;
        const ctx = renderer.getContext();
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 120, 255, 0.8)';
        ctx.fillStyle = 'rgba(0, 120, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const x = Math.min(this.dragStart.x, this.dragCurrent.x);
        const y = Math.min(this.dragStart.y, this.dragCurrent.y);
        const w = Math.abs(this.dragCurrent.x - this.dragStart.x);
        const h = Math.abs(this.dragCurrent.y - this.dragStart.y);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }
}
// ─── WireTool ────────────────────────────────────────────────────────────────
export class WireTool {
    name = 'wire';
    cursor = 'crosshair';
    editor = null;
    isDrawing = false;
    points = [];
    currentPos = { x: 0, y: 0 };
    routingMode = 'h-first';
    onActivate(editor) {
        this.editor = editor;
        this.reset();
    }
    onDeactivate() {
        this.reset();
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, 10);
        if (!this.isDrawing) {
            // Start new wire
            this.isDrawing = true;
            this.points = [snapped];
            this.currentPos = snapped;
        }
        else {
            // Check for double-click to finish
            if (e.detail >= 2) {
                this.finishWire(snapped);
                return;
            }
            // Add 90-degree routed bend points
            const lastPoint = this.points[this.points.length - 1];
            const bends = this.computeRoutedSegment(lastPoint, snapped);
            for (const bp of bends) {
                this.points.push(bp);
            }
            this.points.push(snapped);
        }
    }
    onMouseMove(worldPos, _e) {
        if (!this.editor)
            return;
        this.currentPos = snapToGrid(worldPos, 10);
    }
    onMouseUp(_worldPos, _e) {
        // Wire placement is click-based, not drag-based
    }
    onKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.isDrawing && this.points.length >= 2) {
                this.finishWire(this.points[this.points.length - 1]);
            }
            else {
                this.reset();
            }
        }
        else if (e.key === '/' || e.key === 'Tab') {
            // Toggle routing mode
            this.routingMode =
                this.routingMode === 'h-first' ? 'v-first' : 'h-first';
        }
    }
    renderPreview(renderer) {
        if (!this.isDrawing || this.points.length === 0)
            return;
        const ctx = renderer.getContext();
        ctx.save();
        ctx.strokeStyle = '#00cc44';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        // Draw committed segments
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        // Draw preview segment with 90-degree routing
        const lastPoint = this.points[this.points.length - 1];
        const bends = this.computeRoutedSegment(lastPoint, this.currentPos);
        for (const bp of bends) {
            ctx.lineTo(bp.x, bp.y);
        }
        ctx.lineTo(this.currentPos.x, this.currentPos.y);
        ctx.stroke();
        // Draw small circles at each point
        ctx.fillStyle = '#00cc44';
        for (const p of this.points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    computeRoutedSegment(from, to) {
        if (from.x === to.x || from.y === to.y) {
            return []; // Already aligned - straight line
        }
        if (this.routingMode === 'h-first') {
            return [{ x: to.x, y: from.y }];
        }
        else {
            return [{ x: from.x, y: to.y }];
        }
    }
    finishWire(lastPos) {
        if (!this.editor)
            return;
        // Add final routed segment if needed
        const lastPoint = this.points[this.points.length - 1];
        if (lastPoint.x !== lastPos.x || lastPoint.y !== lastPos.y) {
            const bends = this.computeRoutedSegment(lastPoint, lastPos);
            for (const bp of bends) {
                this.points.push(bp);
            }
            this.points.push(lastPos);
        }
        // Remove duplicate consecutive points
        const cleaned = [this.points[0]];
        for (let i = 1; i < this.points.length; i++) {
            const prev = cleaned[cleaned.length - 1];
            const cur = this.points[i];
            if (prev.x !== cur.x || prev.y !== cur.y) {
                cleaned.push(cur);
            }
        }
        if (cleaned.length >= 2) {
            const wire = {
                id: generateId(),
                points: cleaned,
                netName: '',
            };
            const cmd = new DrawWireCommand(this.editor.getActiveSheet(), wire);
            this.editor.executeCommand(cmd);
        }
        this.reset();
    }
    reset() {
        this.isDrawing = false;
        this.points = [];
        this.currentPos = { x: 0, y: 0 };
    }
}
// ─── PlaceComponentTool ──────────────────────────────────────────────────────
export class PlaceComponentTool {
    name = 'place-component';
    cursor = 'crosshair';
    editor = null;
    template = null;
    currentPos = { x: 0, y: 0 };
    rotation = 0;
    constructor(template) {
        this.template = template ?? null;
    }
    setTemplate(template) {
        this.template = template;
    }
    onActivate(editor) {
        this.editor = editor;
        this.rotation = 0;
    }
    onDeactivate() {
        this.editor = null;
        this.rotation = 0;
    }
    onMouseDown(worldPos, _e) {
        if (!this.editor || !this.template)
            return;
        const snapped = snapToGrid(worldPos, 10);
        const comp = {
            ...structuredClone(this.template),
            id: generateId(),
            position: { x: snapped.x, y: snapped.y },
            rotation: this.rotation,
        };
        const cmd = new PlaceComponentCommand(this.editor.getActiveSheet(), comp);
        this.editor.executeCommand(cmd);
    }
    onMouseMove(worldPos, _e) {
        this.currentPos = snapToGrid(worldPos, 10);
    }
    onMouseUp(_worldPos, _e) {
        // Placement happens on mouse-down
    }
    onKeyDown(e) {
        if (e.key === 'r' || e.key === 'R') {
            this.rotation = (this.rotation + 90) % 360;
        }
        else if (e.key === 'Escape') {
            if (this.editor) {
                this.editor.setTool(new SelectTool());
            }
        }
    }
    renderPreview(renderer) {
        if (!this.template)
            return;
        const ctx = renderer.getContext();
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.translate(this.currentPos.x, this.currentPos.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        // Draw ghost body outline
        const symbol = this.template.symbol;
        if (symbol && symbol.graphics) {
            ctx.strokeStyle = '#4488ff';
            ctx.lineWidth = 2;
            for (const graphic of symbol.graphics) {
                if (graphic.type === 'rect') {
                    ctx.strokeRect(graphic.x, graphic.y, graphic.width, graphic.height);
                }
                else if (graphic.type === 'circle') {
                    ctx.beginPath();
                    ctx.arc(graphic.cx, graphic.cy, graphic.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                else if (graphic.type === 'line') {
                    ctx.beginPath();
                    ctx.moveTo(graphic.points[0].x, graphic.points[0].y);
                    for (let i = 1; i < graphic.points.length; i++) {
                        ctx.lineTo(graphic.points[i].x, graphic.points[i].y);
                    }
                    ctx.stroke();
                }
            }
        }
        else {
            // Fallback: draw a generic rectangle
            ctx.strokeStyle = '#4488ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-30, -20, 60, 40);
        }
        // Draw pin markers
        if (symbol && symbol.pins) {
            ctx.fillStyle = '#ff4444';
            for (const pin of symbol.pins) {
                ctx.beginPath();
                ctx.arc(pin.position.x, pin.position.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}
// ─── PlaceNetLabelTool ───────────────────────────────────────────────────────
export class PlaceNetLabelTool {
    name = 'place-net-label';
    cursor = 'crosshair';
    editor = null;
    netName;
    currentPos = { x: 0, y: 0 };
    constructor(netName = 'NET') {
        this.netName = netName;
    }
    setNetName(name) {
        this.netName = name;
    }
    onActivate(editor) {
        this.editor = editor;
    }
    onDeactivate() {
        this.editor = null;
    }
    onMouseDown(worldPos, _e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, 10);
        const label = {
            id: generateId(),
            name: this.netName,
            position: { x: snapped.x, y: snapped.y },
            rotation: 0,
        };
        const cmd = new PlaceNetLabelCommand(this.editor.getActiveSheet(), label);
        this.editor.executeCommand(cmd);
    }
    onMouseMove(worldPos, _e) {
        this.currentPos = snapToGrid(worldPos, 10);
    }
    onMouseUp(_worldPos, _e) {
        // Placement happens on mouse-down
    }
    onKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.editor) {
                this.editor.setTool(new SelectTool());
            }
        }
    }
    renderPreview(renderer) {
        const ctx = renderer.getContext();
        ctx.save();
        ctx.globalAlpha = 0.5;
        // Draw net label ghost
        ctx.fillStyle = '#00aa88';
        ctx.font = '14px monospace';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.netName, this.currentPos.x, this.currentPos.y - 2);
        // Draw marker line
        ctx.strokeStyle = '#00aa88';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const textWidth = ctx.measureText(this.netName).width;
        ctx.moveTo(this.currentPos.x, this.currentPos.y);
        ctx.lineTo(this.currentPos.x + textWidth, this.currentPos.y);
        ctx.stroke();
        // Draw connection dot
        ctx.fillStyle = '#00aa88';
        ctx.beginPath();
        ctx.arc(this.currentPos.x, this.currentPos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
//# sourceMappingURL=tools.js.map