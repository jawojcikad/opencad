// ─── Types ───────────────────────────────────────────────────────────────────
export var ERCViolationType;
(function (ERCViolationType) {
    ERCViolationType["UnconnectedPin"] = "UnconnectedPin";
    ERCViolationType["ConflictingPinTypes"] = "ConflictingPinTypes";
    ERCViolationType["MissingPowerFlag"] = "MissingPowerFlag";
    ERCViolationType["DuplicateReference"] = "DuplicateReference";
    ERCViolationType["UnconnectedWire"] = "UnconnectedWire";
    ERCViolationType["MissingNetLabel"] = "MissingNetLabel";
})(ERCViolationType || (ERCViolationType = {}));
// ─── Pin compatibility matrix ────────────────────────────────────────────────
/**
 * Returns true when connecting two pin types causes a conflict.
 * Key conflicts: two outputs, two power-outputs, output + power-output.
 */
function arePinTypesConflicting(a, b) {
    const driverTypes = ['output', 'power_output'];
    return driverTypes.includes(a) && driverTypes.includes(b);
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
function pinWorldPosition(comp, pin) {
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
    static CONNECTION_TOLERANCE = 2;
    /**
     * Run all electrical rule checks on the document.
     */
    check(document) {
        const violations = [];
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
    checkUnconnectedPins(sheet) {
        const violations = [];
        const wireEndpoints = this.collectWireEndpoints(sheet);
        for (const comp of sheet.components ?? []) {
            for (const pin of comp.symbol?.pins ?? []) {
                const worldPos = pinWorldPosition(comp, pin);
                const connected = wireEndpoints.some((wp) => dist(wp, worldPos) < ERCChecker.CONNECTION_TOLERANCE);
                // Also check connections to other component pins at the same position
                const connectedToPin = (sheet.components ?? []).some((other) => other.id !== comp.id &&
                    (other.symbol?.pins ?? []).some((op) => {
                        const otherPos = pinWorldPosition(other, op);
                        return dist(otherPos, worldPos) < ERCChecker.CONNECTION_TOLERANCE;
                    }));
                if (!connected && !connectedToPin) {
                    const pinType = pin.type ?? 'passive';
                    // Passive unconnected pins are warnings; others are errors
                    const severity = pinType === 'passive' ? 'warning' : 'error';
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
    checkPinConflicts(sheet, nets) {
        const violations = [];
        for (const [netKey, pins] of nets) {
            // Check every pair
            for (let i = 0; i < pins.length; i++) {
                for (let j = i + 1; j < pins.length; j++) {
                    const a = pins[i];
                    const b = pins[j];
                    const typeA = a.type ?? 'passive';
                    const typeB = b.type ?? 'passive';
                    if (arePinTypesConflicting(typeA, typeB)) {
                        // Parse net key to recover location
                        const [xStr, yStr] = netKey.split(',');
                        const location = {
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
    checkDuplicateReferences(document) {
        const violations = [];
        const refMap = new Map();
        for (const sheet of document.sheets) {
            for (const comp of sheet.components ?? []) {
                if (!comp.reference)
                    continue;
                const existing = refMap.get(comp.reference);
                if (existing) {
                    existing.push(comp);
                }
                else {
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
    checkPowerFlags(sheet) {
        const violations = [];
        const powerPorts = sheet.powerPorts ?? [];
        // Find all power pins
        for (const comp of sheet.components ?? []) {
            for (const pin of comp.symbol?.pins ?? []) {
                const pinType = pin.type ?? 'passive';
                if (pinType === 'power_input') {
                    const worldPos = pinWorldPosition(comp, pin);
                    // Check that a power source (power port or power_output pin) exists on this net
                    const hasPowerSource = powerPorts.some((pp) => dist(pp.position, worldPos) < ERCChecker.CONNECTION_TOLERANCE);
                    const hasDriverPin = (sheet.components ?? []).some((other) => (other.symbol?.pins ?? []).some((op) => {
                        if (op.type !== 'power_output')
                            return false;
                        const otherPos = pinWorldPosition(other, op);
                        return dist(otherPos, worldPos) < ERCChecker.CONNECTION_TOLERANCE;
                    }));
                    // Also check if connected via wire to a power port
                    const wireConnected = this.isPinConnectedToPowerViaWire(sheet, worldPos);
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
    checkUnconnectedWires(sheet) {
        const violations = [];
        const wires = sheet.wires ?? [];
        const allEndpoints = this.collectAllConnectionPoints(sheet);
        for (const wire of wires) {
            if (wire.points.length < 2)
                continue;
            // Check wire start and end
            const start = wire.points[0];
            const end = wire.points[wire.points.length - 1];
            for (const endpoint of [start, end]) {
                // Count how many other things connect at this endpoint
                const connections = allEndpoints.filter((p) => dist(p.pos, endpoint) < ERCChecker.CONNECTION_TOLERANCE &&
                    p.id !== wire.id);
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
    checkMissingNetLabels(sheet) {
        const violations = [];
        const wires = sheet.wires ?? [];
        const labels = sheet.netLabels ?? [];
        // Find wire networks (groups of connected wires)
        const networks = this.buildWireNetworks(wires);
        for (const network of networks) {
            // Check if any wire in this network has a net label attached
            const hasLabel = labels.some((label) => network.some((wire) => wire.points.some((p) => dist(p, label.position) < ERCChecker.CONNECTION_TOLERANCE)));
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
                        objectIds: network.map((w) => w.id),
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
    buildNets(sheet) {
        const nets = new Map();
        const wireEndpoints = this.collectWireEndpoints(sheet);
        for (const comp of sheet.components ?? []) {
            for (const pin of comp.symbol?.pins ?? []) {
                const worldPos = pinWorldPosition(comp, pin);
                // Find the wire endpoint (or other pin) this connects to
                const connected = wireEndpoints.find((wp) => dist(wp, worldPos) < ERCChecker.CONNECTION_TOLERANCE);
                if (connected) {
                    const key = `${connected.x},${connected.y}`;
                    const existing = nets.get(key);
                    if (existing) {
                        existing.push(pin);
                    }
                    else {
                        nets.set(key, [pin]);
                    }
                }
            }
        }
        return nets;
    }
    collectWireEndpoints(sheet) {
        const points = [];
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
    collectAllConnectionPoints(sheet) {
        const points = [];
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
    buildWireNetworks(wires) {
        if (wires.length === 0)
            return [];
        const parent = new Map();
        const find = (i) => {
            while (parent.get(i) !== i) {
                parent.set(i, parent.get(parent.get(i)));
                i = parent.get(i);
            }
            return i;
        };
        const union = (a, b) => {
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
        const groups = new Map();
        for (let i = 0; i < wires.length; i++) {
            const root = find(i);
            const group = groups.get(root);
            if (group) {
                group.push(wires[i]);
            }
            else {
                groups.set(root, [wires[i]]);
            }
        }
        return Array.from(groups.values());
    }
    wiresConnect(a, b) {
        for (const pa of a.points) {
            for (const pb of b.points) {
                if (dist(pa, pb) < ERCChecker.CONNECTION_TOLERANCE) {
                    return true;
                }
            }
        }
        return false;
    }
    countPinsOnNetwork(sheet, network) {
        let count = 0;
        for (const comp of sheet.components ?? []) {
            for (const pin of comp.symbol?.pins ?? []) {
                const worldPos = pinWorldPosition(comp, pin);
                const connected = network.some((wire) => wire.points.some((p) => dist(p, worldPos) < ERCChecker.CONNECTION_TOLERANCE));
                if (connected)
                    count++;
            }
        }
        return count;
    }
    isPinConnectedToPowerViaWire(sheet, pinPos) {
        const wires = sheet.wires ?? [];
        const powerPorts = sheet.powerPorts ?? [];
        // Find wires touching this pin
        const touchingWires = wires.filter((w) => w.points.some((p) => dist(p, pinPos) < ERCChecker.CONNECTION_TOLERANCE));
        if (touchingWires.length === 0)
            return false;
        // Build connected wire network from the touching wires
        const network = new Set(touchingWires);
        let changed = true;
        while (changed) {
            changed = false;
            for (const wire of wires) {
                if (network.has(wire))
                    continue;
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
        return powerPorts.some((pp) => {
            for (const wire of network) {
                if (wire.points.some((p) => dist(p, pp.position) < ERCChecker.CONNECTION_TOLERANCE)) {
                    return true;
                }
            }
            return false;
        });
    }
}
//# sourceMappingURL=erc.js.map