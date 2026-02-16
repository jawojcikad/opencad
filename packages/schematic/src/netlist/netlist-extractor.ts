import {
  Vector2D,
  SchematicDocument,
  Sheet,
  SchematicComponent,
  Wire,
  NetLabel,
  PowerPort,
  Junction,
  Pin,
  PinType,
} from '@opencad/core';

// ─── Public types ────────────────────────────────────────────────────────────

export interface NetlistEntry {
  netName: string;
  connections: Array<{
    componentRef: string;
    pinNumber: string;
    pinName: string;
  }>;
}

export interface Netlist {
  components: Array<{
    reference: string;
    value: string;
    footprint: string;
    properties: Record<string, string>;
  }>;
  nets: NetlistEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dist(a: Vector2D, b: Vector2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const CONNECTION_TOLERANCE = 2;

function pinWorldPosition(comp: SchematicComponent, pin: Pin): Vector2D {
  const rot = ((comp.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return {
    x: comp.position.x + pin.position.x * cos - pin.position.y * sin,
    y: comp.position.y + pin.position.x * sin + pin.position.y * cos,
  };
}

// ─── Union-Find ──────────────────────────────────────────────────────────────

class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  make(x: string): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }

  find(x: string): string {
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let current = x;
    while (current !== root) {
      const next = this.parent.get(current)!;
      this.parent.set(current, root);
      current = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;

    const rankA = this.rank.get(ra)!;
    const rankB = this.rank.get(rb)!;

    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }

  groups(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      const group = result.get(root);
      if (group) {
        group.push(key);
      } else {
        result.set(root, [key]);
      }
    }
    return result;
  }
}

// ─── Netlist Extractor ───────────────────────────────────────────────────────

export class NetlistExtractor {
  /**
   * Extract a full netlist from a schematic document.
   */
  extract(document: SchematicDocument): Netlist {
    const components = this.collectComponents(document);
    const allNets: NetlistEntry[] = [];
    let netCounter = 0;

    for (const sheet of document.sheets) {
      const connectivity = this.buildConnectivity(sheet);
      const netNames = this.resolveNetNames(connectivity, sheet);

      // Group pin IDs by their net root
      const groups = connectivity.groups();

      for (const [_root, members] of groups) {
        // Collect component-pin connections in this net
        const connections: NetlistEntry['connections'] = [];

        for (const memberId of members) {
          // memberId can be:
          //   "comp:<compId>:pin:<pinNumber>" — a component pin
          //   "wire:<wireId>:pt:<index>"      — a wire point
          //   "label:<labelId>"               — a net label
          //   "power:<portId>"                — a power port
          //   "junction:<jId>"                — a junction

          const compPinMatch = memberId.match(
            /^comp:(.+):pin:(.+):name:(.+)$/
          );
          if (compPinMatch) {
            const compId = compPinMatch[1];
            const pinNumber = compPinMatch[2];
            const pinName = compPinMatch[3];

            const comp = this.findComponent(document, compId);
            if (comp) {
              connections.push({
                componentRef: comp.reference ?? comp.id,
                pinNumber,
                pinName,
              });
            }
          }
        }

        if (connections.length === 0) continue;

        // Determine net name
        const rootId = connectivity.find(members[0]);
        let netName = netNames.get(rootId);
        if (!netName) {
          netName = `Net${netCounter++}`;
        }

        // Check if we already created this net entry (from merging)
        const existingNet = allNets.find((n) => n.netName === netName);
        if (existingNet) {
          // Merge connections
          for (const conn of connections) {
            const duplicate = existingNet.connections.some(
              (c) =>
                c.componentRef === conn.componentRef &&
                c.pinNumber === conn.pinNumber
            );
            if (!duplicate) {
              existingNet.connections.push(conn);
            }
          }
        } else {
          allNets.push({ netName, connections });
        }
      }
    }

    return { components, nets: allNets };
  }

  // ── Build connectivity using Union-Find ────────────────────────────────────

  buildConnectivity(sheet: Sheet): UnionFind {
    const uf = new UnionFind();
    const components = sheet.components ?? [];
    const wires = sheet.wires ?? [];
    const labels = sheet.netLabels ?? [];
    const ports = sheet.powerPorts ?? [];
    const junctions = sheet.junctions ?? [];

    // Spatial index: position -> list of UF node ids
    const posIndex = new Map<string, string[]>();

    const posKey = (p: Vector2D): string =>
      `${Math.round(p.x)},${Math.round(p.y)}`;

    const registerPos = (pos: Vector2D, nodeId: string): void => {
      uf.make(nodeId);
      const key = posKey(pos);
      const list = posIndex.get(key);
      if (list) {
        list.push(nodeId);
      } else {
        posIndex.set(key, [nodeId]);
      }
    };

    // Register all component pins
    for (const comp of components) {
      for (const pin of comp.symbol?.pins ?? []) {
        const worldPos = pinWorldPosition(comp, pin);
        const nodeId = `comp:${comp.id}:pin:${pin.number ?? '?'}:name:${pin.name ?? '~'}`;
        registerPos(worldPos, nodeId);
      }
    }

    // Register all wire points
    for (const wire of wires) {
      const wireNodeIds: string[] = [];
      for (let i = 0; i < wire.points.length; i++) {
        const nodeId = `wire:${wire.id}:pt:${i}`;
        registerPos(wire.points[i], nodeId);
        wireNodeIds.push(nodeId);
      }
      // Connect all points of the same wire together
      for (let i = 1; i < wireNodeIds.length; i++) {
        uf.union(wireNodeIds[0], wireNodeIds[i]);
      }
    }

    // Register net labels
    for (const label of labels) {
      const nodeId = `label:${label.id}:${label.name}`;
      registerPos(label.position, nodeId);
    }

    // Register power ports
    for (const port of ports) {
      const nodeId = `power:${port.id}:${port.name}`;
      registerPos(port.position, nodeId);
    }

    // Register junctions
    for (const junction of junctions) {
      const nodeId = `junction:${junction.id}`;
      registerPos(junction.position, nodeId);
    }

    // Union nodes that share a position (within tolerance)
    // For exact grid-snapped schematics, using the rounded posKey is sufficient.
    for (const nodes of posIndex.values()) {
      for (let i = 1; i < nodes.length; i++) {
        uf.union(nodes[0], nodes[i]);
      }
    }

    // Also union using tolerance-based matching for non-grid-snapped points
    const allPositions = Array.from(posIndex.entries());
    for (let i = 0; i < allPositions.length; i++) {
      const [keyI, nodesI] = allPositions[i];
      const [xI, yI] = keyI.split(',').map(Number);
      for (let j = i + 1; j < allPositions.length; j++) {
        const [keyJ, nodesJ] = allPositions[j];
        const [xJ, yJ] = keyJ.split(',').map(Number);
        if (
          Math.abs(xI - xJ) <= CONNECTION_TOLERANCE &&
          Math.abs(yI - yJ) <= CONNECTION_TOLERANCE
        ) {
          uf.union(nodesI[0], nodesJ[0]);
        }
      }
    }

    return uf;
  }

  // ── Resolve net names from labels and power ports ──────────────────────────

  resolveNetNames(
    connectivity: UnionFind,
    sheet: Sheet
  ): Map<string, string> {
    const names = new Map<string, string>();
    const labels = sheet.netLabels ?? [];
    const ports = sheet.powerPorts ?? [];

    // Net labels take priority
    for (const label of labels) {
      const nodeId = `label:${label.id}:${label.name}`;
      const root = connectivity.find(nodeId);
      // Don't overwrite if already named (first label wins)
      if (!names.has(root)) {
        names.set(root, label.name);
      }
    }

    // Power ports provide names if no label exists
    for (const port of ports) {
      const nodeId = `power:${port.id}:${port.name}`;
      const root = connectivity.find(nodeId);
      if (!names.has(root)) {
        names.set(root, port.name);
      }
    }

    // Also check wire netName field
    for (const wire of sheet.wires ?? []) {
      if (wire.netName) {
        const nodeId = `wire:${wire.id}:pt:0`;
        const root = connectivity.find(nodeId);
        if (!names.has(root)) {
          names.set(root, wire.netName);
        }
      }
    }

    return names;
  }

  // ── Collect components across all sheets ───────────────────────────────────

  collectComponents(document: SchematicDocument): Netlist['components'] {
    const result: Netlist['components'] = [];
    const seen = new Set<string>();

    for (const sheet of document.sheets) {
      for (const comp of sheet.components ?? []) {
        const ref = comp.reference ?? comp.id;
        if (seen.has(ref)) continue;
        seen.add(ref);

        result.push({
          reference: ref,
          value: comp.value ?? '',
          footprint: comp.footprint ?? '',
          properties: { ...(comp.properties ?? {}) },
        });
      }
    }

    return result;
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  private findComponent(
    document: SchematicDocument,
    compId: string
  ): SchematicComponent | undefined {
    for (const sheet of document.sheets) {
      const found = (sheet.components ?? []).find(
        (c: SchematicComponent) => c.id === compId
      );
      if (found) return found;
    }
    return undefined;
  }
}
