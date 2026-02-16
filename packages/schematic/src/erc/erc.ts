import {
  Vector2D,
  SchematicDocument,
  Sheet,
  SchematicComponent,
  Wire,
  Pin,
  PinType,
  NetLabel,
  PowerPort,
  Junction,
} from '@opencad/core';

// ─── Types ───────────────────────────────────────────────────────────────────

export enum ERCViolationType {
  UnconnectedPin = 'UnconnectedPin',
  ConflictingPinTypes = 'ConflictingPinTypes',
  MissingPowerFlag = 'MissingPowerFlag',
  DuplicateReference = 'DuplicateReference',
  UnconnectedWire = 'UnconnectedWire',
  MissingNetLabel = 'MissingNetLabel',
}

export interface ERCViolation {
  type: ERCViolationType;
  message: string;
  severity: 'error' | 'warning';
  location: Vector2D;
  objectIds: string[];
}

// ─── Pin compatibility matrix ────────────────────────────────────────────────

/**
 * Returns true when connecting two pin types causes a conflict.
 * Key conflicts: two outputs, two power-outputs, output + power-output.
 */
function arePinTypesConflicting(a: PinType, b: PinType): boolean {
  const driverTypes: PinType[] = ['output', 'power_output'] as PinType[];
  return driverTypes.includes(a) && driverTypes.includes(b);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dist(a: Vector2D, b: Vector2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pinWorldPosition(comp: SchematicComponent, pin: Pin): Vector2D {
  const rot = ((comp.rotation ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return {
    x: comp.position.x + pin.position.x * cos - pin.position.y * sin,
    y: comp.position.y + pin.position.x * sin + pin.position.y * cos,
  };
}

// ─── ERC Checker ─────────────────────────────────────────────────────────────

export class ERCChecker {
  private static readonly CONNECTION_TOLERANCE = 2;

  /**
   * Run all electrical rule checks on the document.
   */
  check(document: SchematicDocument): ERCViolation[] {
    const violations: ERCViolation[] = [];

    for (const sheet of document.sheets) {
      const nets = this.buildNets(sheet);
      violations.push(...this.checkUnconnectedPins(sheet));
      violations.push(...this.checkPinConflicts(sheet, nets));
      violations.push(...this.checkPowerFlags(sheet));
      violations.push(...this.checkUnconnectedWires(sheet));
      violations.push(...this.checkMissingNetLabels(sheet));
    }

    violations.push(...this.checkDuplicateReferences(document));

    return violations;
  }

  // ── Unconnected Pins ───────────────────────────────────────────────────────

  private checkUnconnectedPins(sheet: Sheet): ERCViolation[] {
    const violations: ERCViolation[] = [];
    const wireEndpoints = this.collectWireEndpoints(sheet);

    for (const comp of sheet.components ?? []) {
      for (const pin of comp.symbol?.pins ?? []) {
        const worldPos = pinWorldPosition(comp, pin);
        const connected = wireEndpoints.some(
          (wp) => dist(wp, worldPos) < ERCChecker.CONNECTION_TOLERANCE
        );

        // Also check connections to other component pins at the same position
        const connectedToPin = (sheet.components ?? []).some(
          (other) =>
            other.id !== comp.id &&
            (other.symbol?.pins ?? []).some((op: Pin) => {
              const otherPos = pinWorldPosition(other, op);
              return dist(otherPos, worldPos) < ERCChecker.CONNECTION_TOLERANCE;
            })
        );

        if (!connected && !connectedToPin) {
          const pinType = pin.type ?? 'passive';
          // Passive unconnected pins are warnings; others are errors
          const severity: 'error' | 'warning' =
            pinType === 'passive' ? 'warning' : 'error';

          violations.push({
            type: ERCViolationType.UnconnectedPin,
            message: `Pin "${pin.name ?? pin.number}" of ${comp.reference ?? comp.id} is unconnected`,
            severity,
            location: worldPos,
            objectIds: [comp.id],
          });
        }
      }
    }

    return violations;
  }

  // ── Pin Conflicts ──────────────────────────────────────────────────────────

  private checkPinConflicts(
    sheet: Sheet,
    nets: Map<string, Pin[]>
  ): ERCViolation[] {
    const violations: ERCViolation[] = [];

    for (const [netKey, pins] of nets) {
      // Check every pair
      for (let i = 0; i < pins.length; i++) {
        for (let j = i + 1; j < pins.length; j++) {
          const a = pins[i];
          const b = pins[j];
          const typeA = a.type ?? ('passive' as PinType);
          const typeB = b.type ?? ('passive' as PinType);

          if (arePinTypesConflicting(typeA, typeB)) {
            // Parse net key to recover location
            const [xStr, yStr] = netKey.split(',');
            const location: Vector2D = {
              x: parseFloat(xStr),
              y: parseFloat(yStr),
            };

            violations.push({
              type: ERCViolationType.ConflictingPinTypes,
              message: `Conflicting pin types on net: ${typeA} and ${typeB} (${a.name ?? a.number} <-> ${b.name ?? b.number})`,
              severity: 'error',
              location,
              objectIds: [],
            });
          }
        }
      }
    }

    return violations;
  }

  // ── Duplicate References ────────────────────────────────────────────────────

  private checkDuplicateReferences(
    document: SchematicDocument
  ): ERCViolation[] {
    const violations: ERCViolation[] = [];
    const refMap = new Map<string, SchematicComponent[]>();

    for (const sheet of document.sheets) {
      for (const comp of sheet.components ?? []) {
        if (!comp.reference) continue;
        const existing = refMap.get(comp.reference);
        if (existing) {
          existing.push(comp);
        } else {
          refMap.set(comp.reference, [comp]);
        }
      }
    }

    for (const [ref, comps] of refMap) {
      if (comps.length > 1) {
        violations.push({
          type: ERCViolationType.DuplicateReference,
          message: `Duplicate reference designator "${ref}" used by ${comps.length} components`,
          severity: 'error',
          location: comps[0].position,
          objectIds: comps.map((c) => c.id),
        });
      }
    }

    return violations;
  }

  // ── Power Flags ────────────────────────────────────────────────────────────

  private checkPowerFlags(sheet: Sheet): ERCViolation[] {
    const violations: ERCViolation[] = [];
    const powerPorts = sheet.powerPorts ?? [];

    // Find all power pins
    for (const comp of sheet.components ?? []) {
      for (const pin of comp.symbol?.pins ?? []) {
        const pinType = pin.type ?? ('passive' as PinType);
        if (pinType === 'power_input') {
          const worldPos = pinWorldPosition(comp, pin);

          // Check that a power source (power port or power_output pin) exists on this net
          const hasPowerSource = powerPorts.some(
            (pp: PowerPort) =>
              dist(pp.position, worldPos) < ERCChecker.CONNECTION_TOLERANCE
          );

          const hasDriverPin = (sheet.components ?? []).some(
            (other) =>
              (other.symbol?.pins ?? []).some((op: Pin) => {
                if ((op.type as PinType) !== 'power_output') return false;
                const otherPos = pinWorldPosition(other, op);
                return dist(otherPos, worldPos) < ERCChecker.CONNECTION_TOLERANCE;
              })
          );

          // Also check if connected via wire to a power port
          const wireConnected = this.isPinConnectedToPowerViaWire(
            sheet,
            worldPos
          );

          if (!hasPowerSource && !hasDriverPin && !wireConnected) {
            violations.push({
              type: ERCViolationType.MissingPowerFlag,
              message: `Power input pin "${pin.name ?? pin.number}" of ${comp.reference ?? comp.id} has no power source`,
              severity: 'warning',
              location: worldPos,
              objectIds: [comp.id],
            });
          }
        }
      }
    }

    return violations;
  }

  // ── Unconnected Wires ──────────────────────────────────────────────────────

  private checkUnconnectedWires(sheet: Sheet): ERCViolation[] {
    const violations: ERCViolation[] = [];
    const wires = sheet.wires ?? [];
    const allEndpoints = this.collectAllConnectionPoints(sheet);

    for (const wire of wires) {
      if (wire.points.length < 2) continue;

      // Check wire start and end
      const start = wire.points[0];
      const end = wire.points[wire.points.length - 1];

      for (const endpoint of [start, end]) {
        // Count how many other things connect at this endpoint
        const connections = allEndpoints.filter(
          (p) =>
            dist(p.pos, endpoint) < ERCChecker.CONNECTION_TOLERANCE &&
            p.id !== wire.id
        );

        if (connections.length === 0) {
          violations.push({
            type: ERCViolationType.UnconnectedWire,
            message: `Wire endpoint has no connections`,
            severity: 'warning',
            location: endpoint,
            objectIds: [wire.id],
          });
        }
      }
    }

    return violations;
  }

  // ── Missing Net Labels ─────────────────────────────────────────────────────

  private checkMissingNetLabels(sheet: Sheet): ERCViolation[] {
    const violations: ERCViolation[] = [];
    const wires = sheet.wires ?? [];
    const labels = sheet.netLabels ?? [];

    // Find wire networks (groups of connected wires)
    const networks = this.buildWireNetworks(wires);

    for (const network of networks) {
      // Check if any wire in this network has a net label attached
      const hasLabel = labels.some((label: NetLabel) =>
        network.some((wire: Wire) =>
          wire.points.some(
            (p: Vector2D) =>
              dist(p, label.position) < ERCChecker.CONNECTION_TOLERANCE
          )
        )
      );

      // Only warn if the network connects two or more component pins
      if (!hasLabel && network.length > 0) {
        const pinCount = this.countPinsOnNetwork(sheet, network);
        if (pinCount >= 2) {
          const midWire = network[0];
          const midPoint = midWire.points[Math.floor(midWire.points.length / 2)];
          violations.push({
            type: ERCViolationType.MissingNetLabel,
            message: `Wire network connecting ${pinCount} pins has no net label`,
            severity: 'warning',
            location: midPoint,
            objectIds: network.map((w: Wire) => w.id),
          });
        }
      }
    }

    return violations;
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  /**
   * Build a map of connection-point → list of pins at that point.
   */
  private buildNets(sheet: Sheet): Map<string, Pin[]> {
    const nets = new Map<string, Pin[]>();
    const wireEndpoints = this.collectWireEndpoints(sheet);

    for (const comp of sheet.components ?? []) {
      for (const pin of comp.symbol?.pins ?? []) {
        const worldPos = pinWorldPosition(comp, pin);
        // Find the wire endpoint (or other pin) this connects to
        const connected = wireEndpoints.find(
          (wp) => dist(wp, worldPos) < ERCChecker.CONNECTION_TOLERANCE
        );

        if (connected) {
          const key = `${connected.x},${connected.y}`;
          const existing = nets.get(key);
          if (existing) {
            existing.push(pin);
          } else {
            nets.set(key, [pin]);
          }
        }
      }
    }

    return nets;
  }

  private collectWireEndpoints(sheet: Sheet): Vector2D[] {
    const points: Vector2D[] = [];
    for (const wire of sheet.wires ?? []) {
      for (const p of wire.points) {
        points.push(p);
      }
    }
    // Also include junction positions as connection points
    for (const j of sheet.junctions ?? []) {
      points.push(j.position);
    }
    return points;
  }

  private collectAllConnectionPoints(
    sheet: Sheet
  ): Array<{ pos: Vector2D; id: string }> {
    const points: Array<{ pos: Vector2D; id: string }> = [];

    // Wire endpoints
    for (const wire of sheet.wires ?? []) {
      for (const p of wire.points) {
        points.push({ pos: p, id: wire.id });
      }
    }
    // Component pins
    for (const comp of sheet.components ?? []) {
      for (const pin of comp.symbol?.pins ?? []) {
        points.push({ pos: pinWorldPosition(comp, pin), id: comp.id });
      }
    }
    // Net labels
    for (const label of sheet.netLabels ?? []) {
      points.push({ pos: label.position, id: label.id });
    }
    // Power ports
    for (const pp of sheet.powerPorts ?? []) {
      points.push({ pos: pp.position, id: pp.id });
    }
    // Junctions
    for (const j of sheet.junctions ?? []) {
      points.push({ pos: j.position, id: j.id });
    }

    return points;
  }

  /**
   * Group wires into networks of connected wires using a union-find approach.
   */
  private buildWireNetworks(wires: Wire[]): Wire[][] {
    if (wires.length === 0) return [];

    const parent = new Map<number, number>();

    const find = (i: number): number => {
      while (parent.get(i) !== i) {
        parent.set(i, parent.get(parent.get(i)!)!);
        i = parent.get(i)!;
      }
      return i;
    };

    const union = (a: number, b: number): void => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) {
        parent.set(ra, rb);
      }
    };

    // Initialize
    for (let i = 0; i < wires.length; i++) {
      parent.set(i, i);
    }

    // Union wires that share an endpoint
    for (let i = 0; i < wires.length; i++) {
      for (let j = i + 1; j < wires.length; j++) {
        if (this.wiresConnect(wires[i], wires[j])) {
          union(i, j);
        }
      }
    }

    // Group by root
    const groups = new Map<number, Wire[]>();
    for (let i = 0; i < wires.length; i++) {
      const root = find(i);
      const group = groups.get(root);
      if (group) {
        group.push(wires[i]);
      } else {
        groups.set(root, [wires[i]]);
      }
    }

    return Array.from(groups.values());
  }

  private wiresConnect(a: Wire, b: Wire): boolean {
    for (const pa of a.points) {
      for (const pb of b.points) {
        if (dist(pa, pb) < ERCChecker.CONNECTION_TOLERANCE) {
          return true;
        }
      }
    }
    return false;
  }

  private countPinsOnNetwork(sheet: Sheet, network: Wire[]): number {
    let count = 0;
    for (const comp of sheet.components ?? []) {
      for (const pin of comp.symbol?.pins ?? []) {
        const worldPos = pinWorldPosition(comp, pin);
        const connected = network.some((wire: Wire) =>
          wire.points.some(
            (p: Vector2D) =>
              dist(p, worldPos) < ERCChecker.CONNECTION_TOLERANCE
          )
        );
        if (connected) count++;
      }
    }
    return count;
  }

  private isPinConnectedToPowerViaWire(
    sheet: Sheet,
    pinPos: Vector2D
  ): boolean {
    const wires = sheet.wires ?? [];
    const powerPorts = sheet.powerPorts ?? [];

    // Find wires touching this pin
    const touchingWires = wires.filter((w: Wire) =>
      w.points.some(
        (p: Vector2D) => dist(p, pinPos) < ERCChecker.CONNECTION_TOLERANCE
      )
    );

    if (touchingWires.length === 0) return false;

    // Build connected wire network from the touching wires
    const network = new Set<Wire>(touchingWires);
    let changed = true;
    while (changed) {
      changed = false;
      for (const wire of wires) {
        if (network.has(wire)) continue;
        for (const nw of network) {
          if (this.wiresConnect(wire, nw)) {
            network.add(wire);
            changed = true;
            break;
          }
        }
      }
    }

    // Check if any power port connects to this network
    return powerPorts.some((pp: PowerPort) => {
      for (const wire of network) {
        if (
          wire.points.some(
            (p: Vector2D) =>
              dist(p, pp.position) < ERCChecker.CONNECTION_TOLERANCE
          )
        ) {
          return true;
        }
      }
      return false;
    });
  }
}
