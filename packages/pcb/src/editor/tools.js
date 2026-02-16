import { generateId, } from '@opencad/core';
import { snapToGrid } from '@opencad/renderer';
import { InteractiveRouter } from '../routing/interactive-router';
import { PlaceFootprintCommand, MoveFootprintCommand, RotateFootprintCommand, FlipFootprintCommand, RouteTrackCommand, PlaceViaCommand, } from './commands';
// ─── Select Tool ─────────────────────────────────────────────────
export class SelectTool {
    name = 'select';
    cursor = 'default';
    editor = null;
    isDragging = false;
    isBoxSelecting = false;
    dragStartWorld = { x: 0, y: 0 };
    dragCurrentWorld = { x: 0, y: 0 };
    draggedItemId = null;
    dragOffset = { x: 0, y: 0 };
    originalPosition = { x: 0, y: 0 };
    onActivate(editor) {
        this.editor = editor;
    }
    onDeactivate() {
        this.isDragging = false;
        this.isBoxSelecting = false;
        this.draggedItemId = null;
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        this.dragStartWorld = { ...snapped };
        this.dragCurrentWorld = { ...snapped };
        // Hit test to find what's under the cursor
        const hitId = this.editor.hitTest(worldPos);
        if (hitId) {
            // If clicking on an already-selected item, start dragging
            if (this.editor.getSelection().has(hitId)) {
                this.isDragging = true;
                this.draggedItemId = hitId;
                // Find the footprint position for offset calculation
                const doc = this.editor.getDocument();
                const fp = doc.footprints.find((f) => f.id === hitId);
                if (fp) {
                    this.originalPosition = { ...fp.position };
                    this.dragOffset = {
                        x: snapped.x - fp.position.x,
                        y: snapped.y - fp.position.y,
                    };
                }
            }
            else {
                // Select the clicked item
                if (!e.shiftKey) {
                    this.editor.clearSelection();
                }
                this.editor.select([hitId]);
                // Prepare for potential drag
                this.isDragging = true;
                this.draggedItemId = hitId;
                const doc = this.editor.getDocument();
                const fp = doc.footprints.find((f) => f.id === hitId);
                if (fp) {
                    this.originalPosition = { ...fp.position };
                    this.dragOffset = {
                        x: snapped.x - fp.position.x,
                        y: snapped.y - fp.position.y,
                    };
                }
            }
        }
        else {
            // Start box selection
            if (!e.shiftKey) {
                this.editor.clearSelection();
            }
            this.isBoxSelecting = true;
        }
    }
    onMouseMove(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        this.dragCurrentWorld = { ...snapped };
        if (this.isDragging && this.draggedItemId) {
            // Move the footprint in real time (preview)
            const doc = this.editor.getDocument();
            const fp = doc.footprints.find((f) => f.id === this.draggedItemId);
            if (fp) {
                fp.position = {
                    x: snapped.x - this.dragOffset.x,
                    y: snapped.y - this.dragOffset.y,
                };
            }
        }
    }
    onMouseUp(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        if (this.isDragging && this.draggedItemId) {
            const doc = this.editor.getDocument();
            const fp = doc.footprints.find((f) => f.id === this.draggedItemId);
            if (fp) {
                const newPos = {
                    x: snapped.x - this.dragOffset.x,
                    y: snapped.y - this.dragOffset.y,
                };
                // Only create a command if the position actually changed
                const dx = newPos.x - this.originalPosition.x;
                const dy = newPos.y - this.originalPosition.y;
                if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
                    // Restore original position first (command will apply the new one)
                    fp.position = { ...this.originalPosition };
                    const cmd = new MoveFootprintCommand(doc, this.draggedItemId, this.originalPosition, newPos);
                    this.editor.executeCommand(cmd);
                }
            }
        }
        else if (this.isBoxSelecting) {
            // Select all items within the box
            const minX = Math.min(this.dragStartWorld.x, snapped.x);
            const minY = Math.min(this.dragStartWorld.y, snapped.y);
            const maxX = Math.max(this.dragStartWorld.x, snapped.x);
            const maxY = Math.max(this.dragStartWorld.y, snapped.y);
            const ids = this.editor.hitTestBox({ minX, minY, maxX, maxY });
            if (ids.length > 0) {
                this.editor.select(ids);
            }
        }
        this.isDragging = false;
        this.isBoxSelecting = false;
        this.draggedItemId = null;
    }
    onKeyDown(e) {
        if (!this.editor)
            return;
        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                this.editor.deleteSelection();
                break;
            case 'r':
            case 'R':
                this.rotateSelection();
                break;
            case 'f':
            case 'F':
                this.flipSelection();
                break;
            case 'Escape':
                this.editor.clearSelection();
                break;
        }
    }
    renderPreview(renderer) {
        if (this.isBoxSelecting) {
            const minX = Math.min(this.dragStartWorld.x, this.dragCurrentWorld.x);
            const minY = Math.min(this.dragStartWorld.y, this.dragCurrentWorld.y);
            const maxX = Math.max(this.dragStartWorld.x, this.dragCurrentWorld.x);
            const maxY = Math.max(this.dragStartWorld.y, this.dragCurrentWorld.y);
            renderer.drawRect({ x: minX, y: minY }, { x: maxX, y: maxY }, { r: 0.2, g: 0.5, b: 1.0, a: 0.15 }, { r: 0.2, g: 0.5, b: 1.0, a: 0.6 }, 1);
        }
    }
    rotateSelection() {
        if (!this.editor)
            return;
        const doc = this.editor.getDocument();
        for (const id of this.editor.getSelection()) {
            const fp = doc.footprints.find((f) => f.id === id);
            if (fp) {
                const oldRot = fp.rotation;
                const newRot = oldRot + Math.PI / 2; // 90 degrees
                const cmd = new RotateFootprintCommand(doc, fp.id, oldRot, newRot);
                this.editor.executeCommand(cmd);
            }
        }
    }
    flipSelection() {
        if (!this.editor)
            return;
        const doc = this.editor.getDocument();
        for (const id of this.editor.getSelection()) {
            const fp = doc.footprints.find((f) => f.id === id);
            if (fp) {
                const cmd = new FlipFootprintCommand(doc, fp.id);
                this.editor.executeCommand(cmd);
            }
        }
    }
}
// ─── Route Tool ──────────────────────────────────────────────────
export class RouteTool {
    name = 'route';
    cursor = 'crosshair';
    editor = null;
    router = null;
    previewSegments = [];
    currentWidth = 0.25;
    onActivate(editor) {
        this.editor = editor;
        const doc = editor.getDocument();
        const rules = editor.getDesignRules();
        this.router = new InteractiveRouter(doc, rules);
        this.currentWidth = rules.minTrackWidth ?? 0.25;
    }
    onDeactivate() {
        if (this.router?.getIsRouting()) {
            this.router.cancelRoute();
        }
        this.router = null;
        this.previewSegments = [];
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor || !this.router)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        if (!this.router.getIsRouting()) {
            // Try to start routing from a pad
            const padInfo = this.editor.findPadAt(worldPos);
            if (padInfo) {
                const layer = this.editor.getActiveLayer();
                this.router.startRoute(snapped, layer, padInfo.netId, this.currentWidth);
            }
            else {
                // Start routing from arbitrary point on active layer
                this.router.startRoute(snapped, this.editor.getActiveLayer(), '', this.currentWidth);
            }
        }
        else {
            // Check if clicking on a target pad (to finish the route)
            const padInfo = this.editor.findPadAt(worldPos);
            if (padInfo &&
                padInfo.netId === this.router.getCurrentNetId() &&
                this.router.getLastPoint()) {
                // Finish routing — add final point and commit
                this.router.addRoutePoint(snapped);
                const tracks = this.router.commitRoute();
                if (tracks.length > 0) {
                    const doc = this.editor.getDocument();
                    const cmd = new RouteTrackCommand(doc, tracks);
                    this.editor.executeCommand(cmd);
                    this.editor.updateRatsnest();
                }
                this.previewSegments = [];
            }
            else {
                // Add a bend point
                this.router.addRoutePoint(snapped);
            }
        }
    }
    onMouseMove(worldPos, e) {
        if (!this.editor || !this.router || !this.router.getIsRouting())
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        this.previewSegments = this.router.updateRoute(snapped);
    }
    onMouseUp(_worldPos, _e) {
        // Route tool doesn't use mouse up — clicks are handled in onMouseDown
    }
    onKeyDown(e) {
        if (!this.editor || !this.router)
            return;
        switch (e.key) {
            case 'Escape':
                this.router.cancelRoute();
                this.previewSegments = [];
                break;
            case 'v':
            case 'V':
                // Place a via and switch layers
                if (this.router.getIsRouting()) {
                    const lastPt = this.router.getLastPoint();
                    if (lastPt) {
                        const rules = this.editor.getDesignRules();
                        const via = {
                            id: generateId(),
                            position: { ...lastPt },
                            diameter: rules.minViaDiameter ?? 0.6,
                            drill: rules.minViaDrill ?? 0.3,
                            netId: this.router.getCurrentNetId(),
                            layers: ['F.Cu', 'B.Cu'],
                        };
                        const doc = this.editor.getDocument();
                        const cmd = new PlaceViaCommand(doc, via);
                        this.editor.executeCommand(cmd);
                        // Switch layers
                        const currentLayer = this.router.getCurrentLayer();
                        const newLayer = currentLayer === 'F.Cu' ? 'B.Cu' : 'F.Cu';
                        this.router.switchLayer(newLayer);
                        this.editor.setActiveLayer(newLayer);
                    }
                }
                break;
            case '/':
                // Toggle between 45-degree and 90-degree routing
                if (this.router.getIsRouting()) {
                    // Toggle routing mode
                    this.router.setRoutingMode('90deg');
                }
                break;
        }
    }
    renderPreview(renderer) {
        // Draw preview track segments
        for (const seg of this.previewSegments) {
            const color = this.getLayerColor(seg.layer);
            renderer.drawLine(seg.start, seg.end, seg.width, {
                r: color.r,
                g: color.g,
                b: color.b,
                a: 0.6,
            });
        }
    }
    getLayerColor(layer) {
        switch (layer) {
            case 'F.Cu':
                return { r: 0.8, g: 0.0, b: 0.0 };
            case 'B.Cu':
                return { r: 0.0, g: 0.0, b: 0.8 };
            case 'In1.Cu':
                return { r: 0.8, g: 0.8, b: 0.0 };
            case 'In2.Cu':
                return { r: 0.0, g: 0.8, b: 0.0 };
            default:
                return { r: 0.5, g: 0.5, b: 0.5 };
        }
    }
}
// ─── Place Footprint Tool ────────────────────────────────────────
export class PlaceFootprintTool {
    name = 'place-footprint';
    cursor = 'copy';
    editor = null;
    footprintTemplate = null;
    ghostPosition = { x: 0, y: 0 };
    ghostRotation = 0;
    /**
     * Set the footprint template to place.
     */
    setFootprint(footprint) {
        this.footprintTemplate = { ...footprint };
        this.footprintTemplate.id = generateId();
        this.ghostRotation = 0;
    }
    onActivate(editor) {
        this.editor = editor;
    }
    onDeactivate() {
        this.footprintTemplate = null;
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor || !this.footprintTemplate)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        // Create a copy of the footprint at the clicked position
        const newFootprint = {
            ...this.footprintTemplate,
            id: generateId(),
            position: { ...snapped },
            rotation: this.ghostRotation,
            pads: this.footprintTemplate.pads.map((p) => ({ ...p, id: generateId() })),
        };
        const doc = this.editor.getDocument();
        const cmd = new PlaceFootprintCommand(doc, newFootprint);
        this.editor.executeCommand(cmd);
        this.editor.updateRatsnest();
    }
    onMouseMove(worldPos, _e) {
        if (!this.editor)
            return;
        this.ghostPosition = snapToGrid(worldPos, this.editor.getGridSettings());
    }
    onMouseUp(_worldPos, _e) { }
    onKeyDown(e) {
        switch (e.key) {
            case 'r':
            case 'R':
                this.ghostRotation += Math.PI / 2;
                break;
            case 'Escape':
                this.footprintTemplate = null;
                break;
        }
    }
    renderPreview(renderer) {
        if (!this.footprintTemplate)
            return;
        // Draw ghost footprint at cursor position
        const fp = this.footprintTemplate;
        const cos = Math.cos(this.ghostRotation);
        const sin = Math.sin(this.ghostRotation);
        for (const pad of fp.pads) {
            const worldX = this.ghostPosition.x + pad.position.x * cos - pad.position.y * sin;
            const worldY = this.ghostPosition.y + pad.position.x * sin + pad.position.y * cos;
            const size = Math.max(pad.width ?? 1, pad.height ?? 1);
            renderer.drawCircle({ x: worldX, y: worldY }, size / 2, { r: 0.5, g: 0.8, b: 0.5, a: 0.5 });
        }
        // Draw reference text
        renderer.drawText(fp.reference ?? 'REF', this.ghostPosition, { r: 1, g: 1, b: 1, a: 0.5 }, 1.0);
    }
}
// ─── Draw Board Outline Tool ─────────────────────────────────────
export class DrawBoardOutlineTool {
    name = 'board-outline';
    cursor = 'crosshair';
    editor = null;
    points = [];
    currentPoint = { x: 0, y: 0 };
    onActivate(editor) {
        this.editor = editor;
        this.points = [];
    }
    onDeactivate() {
        this.points = [];
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        // Check if clicking near the first point to close the outline
        if (this.points.length >= 3) {
            const dx = snapped.x - this.points[0].x;
            const dy = snapped.y - this.points[0].y;
            if (Math.sqrt(dx * dx + dy * dy) < 1.0) {
                // Close the outline
                this.finishOutline();
                return;
            }
        }
        this.points.push({ ...snapped });
    }
    onMouseMove(worldPos, _e) {
        if (!this.editor)
            return;
        this.currentPoint = snapToGrid(worldPos, this.editor.getGridSettings());
    }
    onMouseUp(_worldPos, _e) { }
    onKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.points = [];
                break;
            case 'Enter':
                if (this.points.length >= 3) {
                    this.finishOutline();
                }
                break;
        }
    }
    renderPreview(renderer) {
        if (this.points.length === 0)
            return;
        const color = { r: 1.0, g: 1.0, b: 0.0, a: 0.8 };
        const lineWidth = 0.15;
        // Draw committed outline edges
        for (let i = 0; i < this.points.length - 1; i++) {
            renderer.drawLine(this.points[i], this.points[i + 1], lineWidth, color);
        }
        // Draw line from last point to cursor
        const lastPoint = this.points[this.points.length - 1];
        renderer.drawLine(lastPoint, this.currentPoint, lineWidth, {
            ...color,
            a: 0.4,
        });
        // Draw vertices
        for (const pt of this.points) {
            renderer.drawCircle(pt, 0.2, color);
        }
        // Highlight the first point if we can close
        if (this.points.length >= 3) {
            renderer.drawCircle(this.points[0], 0.3, {
                r: 0.0,
                g: 1.0,
                b: 0.0,
                a: 0.8,
            });
        }
    }
    finishOutline() {
        if (!this.editor || this.points.length < 3)
            return;
        const doc = this.editor.getDocument();
        doc.boardOutline = {
            points: this.points.map((p) => ({ ...p })),
        };
        this.editor.getEventBus().emit('pcb:board-outline-changed', {
            points: doc.boardOutline.points,
        });
        this.points = [];
    }
}
// ─── Place Via Tool ──────────────────────────────────────────────
export class PlaceViaTool {
    name = 'place-via';
    cursor = 'crosshair';
    editor = null;
    previewPosition = { x: 0, y: 0 };
    netId = '';
    onActivate(editor) {
        this.editor = editor;
    }
    onDeactivate() {
        this.editor = null;
    }
    onMouseDown(worldPos, e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        const rules = this.editor.getDesignRules();
        // Detect the net at this location from nearby tracks/pads
        const padInfo = this.editor.findPadAt(worldPos);
        const netId = padInfo?.netId ?? this.netId;
        const via = {
            id: generateId(),
            position: { ...snapped },
            diameter: rules.minViaDiameter ?? 0.6,
            drill: rules.minViaDrill ?? 0.3,
            netId,
            layers: ['F.Cu', 'B.Cu'],
        };
        const doc = this.editor.getDocument();
        const cmd = new PlaceViaCommand(doc, via);
        this.editor.executeCommand(cmd);
    }
    onMouseMove(worldPos, _e) {
        if (!this.editor)
            return;
        this.previewPosition = snapToGrid(worldPos, this.editor.getGridSettings());
    }
    onMouseUp(_worldPos, _e) { }
    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.editor = null;
        }
    }
    renderPreview(renderer) {
        if (!this.editor)
            return;
        const rules = this.editor.getDesignRules();
        const diameter = rules.minViaDiameter ?? 0.6;
        const drill = rules.minViaDrill ?? 0.3;
        // Draw via preview (outer ring)
        renderer.drawCircle(this.previewPosition, diameter / 2, {
            r: 0.7,
            g: 0.7,
            b: 0.7,
            a: 0.5,
        });
        // Draw drill hole
        renderer.drawCircle(this.previewPosition, drill / 2, {
            r: 0.1,
            g: 0.1,
            b: 0.1,
            a: 0.8,
        });
    }
}
// ─── Measure Tool ────────────────────────────────────────────────
export class MeasureTool {
    name = 'measure';
    cursor = 'crosshair';
    editor = null;
    startPoint = null;
    endPoint = { x: 0, y: 0 };
    measurements = [];
    onActivate(editor) {
        this.editor = editor;
        this.measurements = [];
    }
    onDeactivate() {
        this.startPoint = null;
        this.measurements = [];
        this.editor = null;
    }
    onMouseDown(worldPos, _e) {
        if (!this.editor)
            return;
        const snapped = snapToGrid(worldPos, this.editor.getGridSettings());
        if (!this.startPoint) {
            this.startPoint = { ...snapped };
        }
        else {
            const dx = snapped.x - this.startPoint.x;
            const dy = snapped.y - this.startPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.measurements.push({
                start: { ...this.startPoint },
                end: { ...snapped },
                distance,
            });
            this.startPoint = null;
        }
    }
    onMouseMove(worldPos, _e) {
        if (!this.editor)
            return;
        this.endPoint = snapToGrid(worldPos, this.editor.getGridSettings());
    }
    onMouseUp(_worldPos, _e) { }
    onKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.startPoint = null;
                break;
            case 'c':
            case 'C':
                this.measurements = [];
                break;
        }
    }
    renderPreview(renderer) {
        const measureColor = { r: 0.0, g: 1.0, b: 1.0, a: 0.8 };
        const textColor = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
        // Draw active measurement line
        if (this.startPoint) {
            renderer.drawLine(this.startPoint, this.endPoint, 0.1, measureColor);
            // Draw dimension text
            const dx = this.endPoint.x - this.startPoint.x;
            const dy = this.endPoint.y - this.startPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const midPoint = {
                x: (this.startPoint.x + this.endPoint.x) / 2,
                y: (this.startPoint.y + this.endPoint.y) / 2 - 1.0,
            };
            renderer.drawText(`${distance.toFixed(3)} mm`, midPoint, textColor, 1.2);
            // Draw delta X and delta Y
            const dxText = `dx: ${Math.abs(dx).toFixed(3)} mm`;
            const dyText = `dy: ${Math.abs(dy).toFixed(3)} mm`;
            renderer.drawText(dxText, { x: midPoint.x, y: midPoint.y - 1.5 }, textColor, 0.8);
            renderer.drawText(dyText, { x: midPoint.x, y: midPoint.y - 2.5 }, textColor, 0.8);
            // Draw endpoints
            renderer.drawCircle(this.startPoint, 0.15, measureColor);
            renderer.drawCircle(this.endPoint, 0.15, measureColor);
        }
        // Draw saved measurements
        for (const m of this.measurements) {
            renderer.drawLine(m.start, m.end, 0.08, { ...measureColor, a: 0.5 });
            const mid = {
                x: (m.start.x + m.end.x) / 2,
                y: (m.start.y + m.end.y) / 2 - 0.8,
            };
            renderer.drawText(`${m.distance.toFixed(3)} mm`, mid, { ...textColor, a: 0.7 }, 0.9);
        }
    }
}
//# sourceMappingURL=tools.js.map