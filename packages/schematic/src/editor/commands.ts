import {
  Command,
  SchematicComponent,
  Wire,
  NetLabel,
  Sheet,
  Vector2D,
  generateId,
} from '@opencad/core';

export class PlaceComponentCommand implements Command {
  public readonly description: string;
  private component: SchematicComponent;
  private sheet: Sheet;

  constructor(sheet: Sheet, component: SchematicComponent) {
    this.sheet = sheet;
    this.component = component;
    this.description = `Place component ${component.reference}`;
  }

  execute(): void {
    if (!this.sheet.components) {
      this.sheet.components = [];
    }
    this.sheet.components.push(this.component);
  }

  undo(): void {
    const idx = this.sheet.components.indexOf(this.component);
    if (idx !== -1) {
      this.sheet.components.splice(idx, 1);
    }
  }
}

export class MoveComponentCommand implements Command {
  public readonly description: string;
  private sheet: Sheet;
  private componentIds: string[];
  private delta: Vector2D;

  constructor(sheet: Sheet, componentIds: string[], delta: Vector2D) {
    this.sheet = sheet;
    this.componentIds = componentIds;
    this.delta = delta;
    this.description = `Move ${componentIds.length} component(s)`;
  }

  execute(): void {
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
        wire.points = wire.points.map((p: Vector2D) => ({
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

  undo(): void {
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
        wire.points = wire.points.map((p: Vector2D) => ({
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

  private findComponent(id: string): SchematicComponent | undefined {
    return this.sheet.components?.find((c: SchematicComponent) => c.id === id);
  }

  private findWire(id: string): Wire | undefined {
    return this.sheet.wires?.find((w: Wire) => w.id === id);
  }

  private findNetLabel(id: string): NetLabel | undefined {
    return this.sheet.netLabels?.find((l: NetLabel) => l.id === id);
  }
}

export class DeleteComponentCommand implements Command {
  public readonly description: string;
  private sheet: Sheet;
  private components: SchematicComponent[];
  private indices: number[];

  constructor(sheet: Sheet, componentIds: string[]) {
    this.sheet = sheet;
    this.components = [];
    this.indices = [];
    const allComponents = this.sheet.components ?? [];
    for (const id of componentIds) {
      const idx = allComponents.findIndex((c: SchematicComponent) => c.id === id);
      if (idx !== -1) {
        this.indices.push(idx);
        this.components.push(allComponents[idx]);
      }
    }
    this.description = `Delete ${this.components.length} component(s)`;
  }

  execute(): void {
    const ids = new Set(this.components.map((c) => c.id));
    this.sheet.components = (this.sheet.components ?? []).filter(
      (c: SchematicComponent) => !ids.has(c.id)
    );
  }

  undo(): void {
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

export class DrawWireCommand implements Command {
  public readonly description: string;
  private sheet: Sheet;
  private wire: Wire;

  constructor(sheet: Sheet, wire: Wire) {
    this.sheet = sheet;
    this.wire = wire;
    this.description = `Draw wire (${wire.points.length} points)`;
  }

  execute(): void {
    if (!this.sheet.wires) {
      this.sheet.wires = [];
    }
    this.sheet.wires.push(this.wire);
  }

  undo(): void {
    const idx = (this.sheet.wires ?? []).indexOf(this.wire);
    if (idx !== -1) {
      this.sheet.wires!.splice(idx, 1);
    }
  }
}

export class DeleteWireCommand implements Command {
  public readonly description: string;
  private sheet: Sheet;
  private wires: Wire[];
  private indices: number[];

  constructor(sheet: Sheet, wireIds: string[]) {
    this.sheet = sheet;
    this.wires = [];
    this.indices = [];
    const allWires = this.sheet.wires ?? [];
    for (const id of wireIds) {
      const idx = allWires.findIndex((w: Wire) => w.id === id);
      if (idx !== -1) {
        this.indices.push(idx);
        this.wires.push(allWires[idx]);
      }
    }
    this.description = `Delete ${this.wires.length} wire(s)`;
  }

  execute(): void {
    const ids = new Set(this.wires.map((w) => w.id));
    this.sheet.wires = (this.sheet.wires ?? []).filter(
      (w: Wire) => !ids.has(w.id)
    );
  }

  undo(): void {
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

export class PlaceNetLabelCommand implements Command {
  public readonly description: string;
  private sheet: Sheet;
  private label: NetLabel;

  constructor(sheet: Sheet, label: NetLabel) {
    this.sheet = sheet;
    this.label = label;
    this.description = `Place net label "${label.name}"`;
  }

  execute(): void {
    if (!this.sheet.netLabels) {
      this.sheet.netLabels = [];
    }
    this.sheet.netLabels.push(this.label);
  }

  undo(): void {
    const idx = (this.sheet.netLabels ?? []).indexOf(this.label);
    if (idx !== -1) {
      this.sheet.netLabels!.splice(idx, 1);
    }
  }
}

export class RotateComponentCommand implements Command {
  public readonly description: string;
  private sheet: Sheet;
  private componentId: string;
  private angleDeg: number;

  constructor(sheet: Sheet, componentId: string, angleDeg: number = 90) {
    this.sheet = sheet;
    this.componentId = componentId;
    this.angleDeg = angleDeg;
    this.description = `Rotate component ${componentId} by ${angleDeg}°`;
  }

  execute(): void {
    const comp = (this.sheet.components ?? []).find(
      (c: SchematicComponent) => c.id === this.componentId
    );
    if (comp) {
      comp.rotation = ((comp.rotation ?? 0) + this.angleDeg) % 360;
    }
  }

  undo(): void {
    const comp = (this.sheet.components ?? []).find(
      (c: SchematicComponent) => c.id === this.componentId
    );
    if (comp) {
      comp.rotation = ((comp.rotation ?? 0) - this.angleDeg + 360) % 360;
    }
  }
}
