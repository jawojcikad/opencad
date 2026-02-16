export class PlaceComponentCommand {
    description;
    component;
    sheet;
    constructor(sheet, component) {
        this.sheet = sheet;
        this.component = component;
        this.description = `Place component ${component.reference}`;
    }
    execute() {
        if (!this.sheet.components) {
            this.sheet.components = [];
        }
        this.sheet.components.push(this.component);
    }
    undo() {
        const idx = this.sheet.components.indexOf(this.component);
        if (idx !== -1) {
            this.sheet.components.splice(idx, 1);
        }
    }
}
export class MoveComponentCommand {
    description;
    sheet;
    componentIds;
    delta;
    constructor(sheet, componentIds, delta) {
        this.sheet = sheet;
        this.componentIds = componentIds;
        this.delta = delta;
        this.description = `Move ${componentIds.length} component(s)`;
    }
    execute() {
        for (const id of this.componentIds) {
            const comp = this.findComponent(id);
            if (comp) {
                comp.position = {
                    x: comp.position.x + this.delta.x,
                    y: comp.position.y + this.delta.y,
                };
            }
            const wire = this.findWire(id);
            if (wire) {
                wire.points = wire.points.map((p) => ({
                    x: p.x + this.delta.x,
                    y: p.y + this.delta.y,
                }));
            }
            const label = this.findNetLabel(id);
            if (label) {
                label.position = {
                    x: label.position.x + this.delta.x,
                    y: label.position.y + this.delta.y,
                };
            }
        }
    }
    undo() {
        for (const id of this.componentIds) {
            const comp = this.findComponent(id);
            if (comp) {
                comp.position = {
                    x: comp.position.x - this.delta.x,
                    y: comp.position.y - this.delta.y,
                };
            }
            const wire = this.findWire(id);
            if (wire) {
                wire.points = wire.points.map((p) => ({
                    x: p.x - this.delta.x,
                    y: p.y - this.delta.y,
                }));
            }
            const label = this.findNetLabel(id);
            if (label) {
                label.position = {
                    x: label.position.x - this.delta.x,
                    y: label.position.y - this.delta.y,
                };
            }
        }
    }
    findComponent(id) {
        return this.sheet.components?.find((c) => c.id === id);
    }
    findWire(id) {
        return this.sheet.wires?.find((w) => w.id === id);
    }
    findNetLabel(id) {
        return this.sheet.netLabels?.find((l) => l.id === id);
    }
}
export class DeleteComponentCommand {
    description;
    sheet;
    components;
    indices;
    constructor(sheet, componentIds) {
        this.sheet = sheet;
        this.components = [];
        this.indices = [];
        const allComponents = this.sheet.components ?? [];
        for (const id of componentIds) {
            const idx = allComponents.findIndex((c) => c.id === id);
            if (idx !== -1) {
                this.indices.push(idx);
                this.components.push(allComponents[idx]);
            }
        }
        this.description = `Delete ${this.components.length} component(s)`;
    }
    execute() {
        const ids = new Set(this.components.map((c) => c.id));
        this.sheet.components = (this.sheet.components ?? []).filter((c) => !ids.has(c.id));
    }
    undo() {
        if (!this.sheet.components) {
            this.sheet.components = [];
        }
        // Re-insert at original indices in reverse order to preserve positions
        const pairs = this.indices
            .map((idx, i) => ({ idx, comp: this.components[i] }))
            .sort((a, b) => a.idx - b.idx);
        for (const { idx, comp } of pairs) {
            const insertAt = Math.min(idx, this.sheet.components.length);
            this.sheet.components.splice(insertAt, 0, comp);
        }
    }
}
export class DrawWireCommand {
    description;
    sheet;
    wire;
    constructor(sheet, wire) {
        this.sheet = sheet;
        this.wire = wire;
        this.description = `Draw wire (${wire.points.length} points)`;
    }
    execute() {
        if (!this.sheet.wires) {
            this.sheet.wires = [];
        }
        this.sheet.wires.push(this.wire);
    }
    undo() {
        const idx = (this.sheet.wires ?? []).indexOf(this.wire);
        if (idx !== -1) {
            this.sheet.wires.splice(idx, 1);
        }
    }
}
export class DeleteWireCommand {
    description;
    sheet;
    wires;
    indices;
    constructor(sheet, wireIds) {
        this.sheet = sheet;
        this.wires = [];
        this.indices = [];
        const allWires = this.sheet.wires ?? [];
        for (const id of wireIds) {
            const idx = allWires.findIndex((w) => w.id === id);
            if (idx !== -1) {
                this.indices.push(idx);
                this.wires.push(allWires[idx]);
            }
        }
        this.description = `Delete ${this.wires.length} wire(s)`;
    }
    execute() {
        const ids = new Set(this.wires.map((w) => w.id));
        this.sheet.wires = (this.sheet.wires ?? []).filter((w) => !ids.has(w.id));
    }
    undo() {
        if (!this.sheet.wires) {
            this.sheet.wires = [];
        }
        const pairs = this.indices
            .map((idx, i) => ({ idx, wire: this.wires[i] }))
            .sort((a, b) => a.idx - b.idx);
        for (const { idx, wire } of pairs) {
            const insertAt = Math.min(idx, this.sheet.wires.length);
            this.sheet.wires.splice(insertAt, 0, wire);
        }
    }
}
export class PlaceNetLabelCommand {
    description;
    sheet;
    label;
    constructor(sheet, label) {
        this.sheet = sheet;
        this.label = label;
        this.description = `Place net label "${label.name}"`;
    }
    execute() {
        if (!this.sheet.netLabels) {
            this.sheet.netLabels = [];
        }
        this.sheet.netLabels.push(this.label);
    }
    undo() {
        const idx = (this.sheet.netLabels ?? []).indexOf(this.label);
        if (idx !== -1) {
            this.sheet.netLabels.splice(idx, 1);
        }
    }
}
export class RotateComponentCommand {
    description;
    sheet;
    componentId;
    angleDeg;
    constructor(sheet, componentId, angleDeg = 90) {
        this.sheet = sheet;
        this.componentId = componentId;
        this.angleDeg = angleDeg;
        this.description = `Rotate component ${componentId} by ${angleDeg}°`;
    }
    execute() {
        const comp = (this.sheet.components ?? []).find((c) => c.id === this.componentId);
        if (comp) {
            comp.rotation = ((comp.rotation ?? 0) + this.angleDeg) % 360;
        }
    }
    undo() {
        const comp = (this.sheet.components ?? []).find((c) => c.id === this.componentId);
        if (comp) {
            comp.rotation = ((comp.rotation ?? 0) - this.angleDeg + 360) % 360;
        }
    }
}
//# sourceMappingURL=commands.js.map