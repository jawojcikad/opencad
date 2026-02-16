export var DRCViolationType;
(function (DRCViolationType) {
    DRCViolationType[DRCViolationType["ClearanceViolation"] = 0] = "ClearanceViolation";
    DRCViolationType[DRCViolationType["MinTrackWidth"] = 1] = "MinTrackWidth";
    DRCViolationType[DRCViolationType["MinViaDiameter"] = 2] = "MinViaDiameter";
    DRCViolationType[DRCViolationType["MinViaDrill"] = 3] = "MinViaDrill";
    DRCViolationType[DRCViolationType["MinHoleToHole"] = 4] = "MinHoleToHole";
    DRCViolationType[DRCViolationType["UnroutedNet"] = 5] = "UnroutedNet";
    DRCViolationType[DRCViolationType["TrackDangling"] = 6] = "TrackDangling";
    DRCViolationType[DRCViolationType["SilkOverPad"] = 7] = "SilkOverPad";
    DRCViolationType[DRCViolationType["CourtyardOverlap"] = 8] = "CourtyardOverlap";
})(DRCViolationType || (DRCViolationType = {}));
export class DRCChecker {
    rules;
    constructor(rules) {
        this.rules = rules;
    }
    /**
     * Run all DRC checks on the given PCB document.
     */
    check(document) {
        const violations = [];
        violations.push(...this.checkClearances(document));
        violations.push(...this.checkMinTrackWidth(document));
        violations.push(...this.checkMinViaDimensions(document));
        violations.push(...this.checkMinHoleToHole(document));
        violations.push(...this.checkUnroutedNets(document));
        violations.push(...this.checkSilkOverPad(document));
        violations.push(...this.checkCourtyardOverlap(document));
        return violations;
    }
    /**
     * Check clearance between all conductors on the same layer with different nets.
     * Uses a sweep-line approach for efficiency: sort objects by X, then check
     * only nearby objects.
     */
    checkClearances(document) {
        const violations = [];
        const minClearance = this.rules.clearance ?? 0.2;
        // Collect all conductive objects with their bounding boxes and metadata
        const objects = this.collectConductiveObjects(document);
        // Sort by minX for sweep-line
        objects.sort((a, b) => a.bbox.minX - b.bbox.minX);
        // Sweep-line check
        for (let i = 0; i < objects.length; i++) {
            const a = objects[i];
            for (let j = i + 1; j < objects.length; j++) {
                const b = objects[j];
                // If b's minX is past a's maxX + clearance, no more checks needed for a
                if (b.bbox.minX > a.bbox.maxX + minClearance) {
                    break;
                }
                // Skip same net
                if (a.netId === b.netId && a.netId !== '')
                    continue;
                // Skip different layers
                if (a.layer !== b.layer)
                    continue;
                // Check detailed clearance
                const dist = this.objectDistance(a, b);
                if (dist < minClearance) {
                    const location = {
                        x: (a.center.x + b.center.x) / 2,
                        y: (a.center.y + b.center.y) / 2,
                    };
                    violations.push({
                        type: DRCViolationType.ClearanceViolation,
                        message: `Clearance violation: ${dist.toFixed(3)}mm < ${minClearance}mm between ${a.type} and ${b.type}`,
                        severity: 'error',
                        location,
                        objectIds: [a.id, b.id],
                        layer: a.layer,
                    });
                }
            }
        }
        return violations;
    }
    /**
     * Check that all tracks meet minimum width requirement.
     */
    checkMinTrackWidth(document) {
        const violations = [];
        const minWidth = this.rules.minTrackWidth ?? 0.1;
        for (const track of document.tracks) {
            if (track.width < minWidth) {
                violations.push({
                    type: DRCViolationType.MinTrackWidth,
                    message: `Track width ${track.width.toFixed(3)}mm < minimum ${minWidth}mm`,
                    severity: 'error',
                    location: {
                        x: (track.start.x + track.end.x) / 2,
                        y: (track.start.y + track.end.y) / 2,
                    },
                    objectIds: [track.id],
                    layer: track.layer,
                });
            }
        }
        return violations;
    }
    /**
     * Check that all vias meet minimum diameter and drill size.
     */
    checkMinViaDimensions(document) {
        const violations = [];
        const minDiameter = this.rules.minViaDiameter ?? 0.6;
        const minDrill = this.rules.minViaDrill ?? 0.3;
        for (const via of document.vias) {
            if (via.diameter < minDiameter) {
                violations.push({
                    type: DRCViolationType.MinViaDiameter,
                    message: `Via diameter ${via.diameter.toFixed(3)}mm < minimum ${minDiameter}mm`,
                    severity: 'error',
                    location: via.position,
                    objectIds: [via.id],
                });
            }
            if (via.drill < minDrill) {
                violations.push({
                    type: DRCViolationType.MinViaDrill,
                    message: `Via drill ${via.drill.toFixed(3)}mm < minimum ${minDrill}mm`,
                    severity: 'error',
                    location: via.position,
                    objectIds: [via.id],
                });
            }
        }
        return violations;
    }
    /**
     * Check minimum hole-to-hole distance between all drilled holes.
     */
    checkMinHoleToHole(document) {
        const violations = [];
        const minHoleToHole = this.rules.minHoleToHole ?? 0.5;
        // Collect all holes (vias + through-hole pads)
        const holes = [];
        for (const via of document.vias) {
            holes.push({
                id: via.id,
                position: via.position,
                drill: via.drill,
            });
        }
        for (const footprint of document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                if (pad.type !== 'through_hole' || !pad.drill)
                    continue;
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                holes.push({
                    id: pad.id,
                    position: worldPos,
                    drill: pad.drill,
                });
            }
        }
        // Sort by x for sweep optimization
        holes.sort((a, b) => a.position.x - b.position.x);
        for (let i = 0; i < holes.length; i++) {
            for (let j = i + 1; j < holes.length; j++) {
                const dx = holes[j].position.x - holes[i].position.x;
                if (dx > minHoleToHole + holes[i].drill + holes[j].drill) {
                    break;
                }
                const dy = holes[j].position.y - holes[i].position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const edgeDist = dist - holes[i].drill / 2 - holes[j].drill / 2;
                if (edgeDist < minHoleToHole) {
                    violations.push({
                        type: DRCViolationType.MinHoleToHole,
                        message: `Hole-to-hole distance ${edgeDist.toFixed(3)}mm < minimum ${minHoleToHole}mm`,
                        severity: 'error',
                        location: {
                            x: (holes[i].position.x + holes[j].position.x) / 2,
                            y: (holes[i].position.y + holes[j].position.y) / 2,
                        },
                        objectIds: [holes[i].id, holes[j].id],
                    });
                }
            }
        }
        return violations;
    }
    /**
     * Check for unrouted nets — any net that has pads not connected by tracks.
     */
    checkUnroutedNets(document) {
        const violations = [];
        // Build map of net -> pad positions
        const netPads = new Map();
        for (const footprint of document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                if (!pad.netId)
                    continue;
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                if (!netPads.has(pad.netId)) {
                    netPads.set(pad.netId, []);
                }
                netPads.get(pad.netId).push({ id: pad.id, position: worldPos });
            }
        }
        // For each net with 2+ pads, check if all pads are connected via tracks
        const SNAP_TOL = 0.01;
        for (const [netId, pads] of netPads) {
            if (pads.length < 2)
                continue;
            // Build connectivity using union-find over track endpoints
            const pointMap = new Map();
            let nextIdx = 0;
            const getIdx = (pos) => {
                const key = `${Math.round(pos.x / SNAP_TOL)}:${Math.round(pos.y / SNAP_TOL)}`;
                if (!pointMap.has(key)) {
                    pointMap.set(key, nextIdx++);
                }
                return pointMap.get(key);
            };
            // Register all pad positions
            for (const pad of pads) {
                getIdx(pad.position);
            }
            // Register all track endpoints and create union-find
            const netTracks = document.tracks.filter((t) => t.netId === netId);
            for (const track of netTracks) {
                getIdx(track.start);
                getIdx(track.end);
            }
            // Also register via positions
            const netVias = document.vias.filter((v) => v.netId === netId);
            for (const via of netVias) {
                getIdx(via.position);
            }
            // Simple union-find
            const parent = new Array(nextIdx).fill(0).map((_, i) => i);
            const rank = new Array(nextIdx).fill(0);
            const find = (x) => {
                while (parent[x] !== x) {
                    parent[x] = parent[parent[x]];
                    x = parent[x];
                }
                return x;
            };
            const unite = (a, b) => {
                const ra = find(a);
                const rb = find(b);
                if (ra === rb)
                    return;
                if (rank[ra] < rank[rb]) {
                    parent[ra] = rb;
                }
                else if (rank[ra] > rank[rb]) {
                    parent[rb] = ra;
                }
                else {
                    parent[rb] = ra;
                    rank[ra]++;
                }
            };
            // Connect track endpoints
            for (const track of netTracks) {
                unite(getIdx(track.start), getIdx(track.end));
            }
            // Vias connect positions across layers (treated as same point)
            for (const via of netVias) {
                const viaIdx = getIdx(via.position);
                // Connect via to any track endpoint or pad at same position
                for (const track of netTracks) {
                    if (Math.abs(track.start.x - via.position.x) < SNAP_TOL &&
                        Math.abs(track.start.y - via.position.y) < SNAP_TOL) {
                        unite(viaIdx, getIdx(track.start));
                    }
                    if (Math.abs(track.end.x - via.position.x) < SNAP_TOL &&
                        Math.abs(track.end.y - via.position.y) < SNAP_TOL) {
                        unite(viaIdx, getIdx(track.end));
                    }
                }
            }
            // Check if all pads are in the same component
            const firstPadIdx = getIdx(pads[0].position);
            for (let i = 1; i < pads.length; i++) {
                const padIdx = getIdx(pads[i].position);
                if (find(firstPadIdx) !== find(padIdx)) {
                    violations.push({
                        type: DRCViolationType.UnroutedNet,
                        message: `Unrouted connection on net "${netId}"`,
                        severity: 'error',
                        location: pads[i].position,
                        objectIds: [pads[0].id, pads[i].id],
                    });
                }
            }
        }
        return violations;
    }
    /**
     * Check for silkscreen overlapping pads.
     */
    checkSilkOverPad(document) {
        const violations = [];
        // Collect all pad bounding boxes
        const padBoxes = [];
        for (const footprint of document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const hw = (pad.width ?? 1) / 2;
                const hh = (pad.height ?? 1) / 2;
                const padLayer = pad.layer ?? 'F.Cu';
                padBoxes.push({
                    id: pad.id,
                    bbox: {
                        minX: worldPos.x - hw,
                        minY: worldPos.y - hh,
                        maxX: worldPos.x + hw,
                        maxY: worldPos.y + hh,
                    },
                    layer: padLayer,
                });
            }
        }
        // Check silkscreen items against pad bounding boxes
        // Silkscreen items are part of footprint silkscreen data
        for (const footprint of document.footprints) {
            if (!footprint.silkscreen)
                continue;
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const silk of footprint.silkscreen) {
                const silkWorld = {
                    x: footprint.position.x + (silk.position?.x ?? 0) * cos - (silk.position?.y ?? 0) * sin,
                    y: footprint.position.y + (silk.position?.x ?? 0) * sin + (silk.position?.y ?? 0) * cos,
                };
                const silkLayer = silk.layer ?? 'F.SilkS';
                const matchLayer = silkLayer === 'F.SilkS' ? 'F.Cu' : 'B.Cu';
                const silkSize = silk.size ?? 1;
                const silkBBox = {
                    minX: silkWorld.x - silkSize / 2,
                    minY: silkWorld.y - silkSize / 2,
                    maxX: silkWorld.x + silkSize / 2,
                    maxY: silkWorld.y + silkSize / 2,
                };
                for (const pad of padBoxes) {
                    // Only check pads on the corresponding copper layer
                    if (pad.layer !== matchLayer && pad.layer !== '*')
                        continue;
                    if (bboxOverlap(silkBBox, pad.bbox)) {
                        violations.push({
                            type: DRCViolationType.SilkOverPad,
                            message: 'Silkscreen overlaps pad',
                            severity: 'warning',
                            location: silkWorld,
                            objectIds: [footprint.id, pad.id],
                            layer: silkLayer,
                        });
                    }
                }
            }
        }
        return violations;
    }
    /**
     * Check for overlapping component courtyards.
     */
    checkCourtyardOverlap(document) {
        const violations = [];
        // Compute courtyard bounding boxes for all footprints
        const courtyards = [];
        for (const footprint of document.footprints) {
            const bbox = this.computeFootprintCourtyard(footprint);
            if (bbox) {
                courtyards.push({
                    id: footprint.id,
                    bbox,
                    center: footprint.position,
                });
            }
        }
        // Sort by minX for sweep-line
        courtyards.sort((a, b) => a.bbox.minX - b.bbox.minX);
        for (let i = 0; i < courtyards.length; i++) {
            for (let j = i + 1; j < courtyards.length; j++) {
                if (courtyards[j].bbox.minX > courtyards[i].bbox.maxX) {
                    break;
                }
                if (bboxOverlap(courtyards[i].bbox, courtyards[j].bbox)) {
                    violations.push({
                        type: DRCViolationType.CourtyardOverlap,
                        message: `Courtyard overlap between footprints`,
                        severity: 'warning',
                        location: {
                            x: (courtyards[i].center.x + courtyards[j].center.x) / 2,
                            y: (courtyards[i].center.y + courtyards[j].center.y) / 2,
                        },
                        objectIds: [courtyards[i].id, courtyards[j].id],
                    });
                }
            }
        }
        return violations;
    }
    // ─── Helpers ───────────────────────────────────────────────
    computeFootprintCourtyard(footprint) {
        if (footprint.courtyard) {
            // If explicit courtyard polygon is defined
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of footprint.courtyard) {
                const wx = footprint.position.x + p.x * cos - p.y * sin;
                const wy = footprint.position.y + p.x * sin + p.y * cos;
                if (wx < minX)
                    minX = wx;
                if (wy < minY)
                    minY = wy;
                if (wx > maxX)
                    maxX = wx;
                if (wy > maxY)
                    maxY = wy;
            }
            return { minX, minY, maxX, maxY };
        }
        // Fall back to using pads to estimate courtyard
        if (!footprint.pads || footprint.pads.length === 0)
            return null;
        const cos = Math.cos(footprint.rotation);
        const sin = Math.sin(footprint.rotation);
        const margin = 0.25; // courtyard margin in mm
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const pad of footprint.pads) {
            const wx = footprint.position.x + pad.position.x * cos - pad.position.y * sin;
            const wy = footprint.position.y + pad.position.x * sin + pad.position.y * cos;
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
        return {
            minX: minX - margin,
            minY: minY - margin,
            maxX: maxX + margin,
            maxY: maxY + margin,
        };
    }
    collectConductiveObjects(document) {
        const objects = [];
        // Tracks
        for (const track of document.tracks) {
            const halfW = track.width / 2;
            objects.push({
                id: track.id,
                netId: track.netId ?? '',
                layer: track.layer,
                bbox: {
                    minX: Math.min(track.start.x, track.end.x) - halfW,
                    minY: Math.min(track.start.y, track.end.y) - halfW,
                    maxX: Math.max(track.start.x, track.end.x) + halfW,
                    maxY: Math.max(track.start.y, track.end.y) + halfW,
                },
                center: {
                    x: (track.start.x + track.end.x) / 2,
                    y: (track.start.y + track.end.y) / 2,
                },
                type: 'track',
                halfWidth: halfW,
                start: track.start,
                end: track.end,
            });
        }
        // Pads
        for (const footprint of document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const hw = (pad.width ?? 1) / 2;
                const hh = (pad.height ?? 1) / 2;
                const padLayer = pad.layer ?? 'F.Cu';
                // For through-hole pads, add to all copper layers
                const layers = pad.type === 'through_hole'
                    ? this.getAllCopperLayers(document)
                    : [padLayer];
                for (const layer of layers) {
                    objects.push({
                        id: pad.id,
                        netId: pad.netId ?? '',
                        layer,
                        bbox: {
                            minX: worldPos.x - hw,
                            minY: worldPos.y - hh,
                            maxX: worldPos.x + hw,
                            maxY: worldPos.y + hh,
                        },
                        center: worldPos,
                        type: 'pad',
                        radius: Math.max(hw, hh),
                    });
                }
            }
        }
        // Vias
        for (const via of document.vias) {
            const r = via.diameter / 2;
            const layers = this.getAllCopperLayers(document);
            for (const layer of layers) {
                objects.push({
                    id: via.id,
                    netId: via.netId ?? '',
                    layer,
                    bbox: {
                        minX: via.position.x - r,
                        minY: via.position.y - r,
                        maxX: via.position.x + r,
                        maxY: via.position.y + r,
                    },
                    center: via.position,
                    type: 'via',
                    radius: r,
                });
            }
        }
        return objects;
    }
    getAllCopperLayers(document) {
        const layers = new Set();
        layers.add('F.Cu');
        layers.add('B.Cu');
        for (const track of document.tracks) {
            layers.add(track.layer);
        }
        return Array.from(layers);
    }
    objectDistance(a, b) {
        // Track vs Track
        if (a.type === 'track' && b.type === 'track') {
            const segDist = segmentToSegmentDistance(a.start, a.end, b.start, b.end);
            return segDist - (a.halfWidth ?? 0) - (b.halfWidth ?? 0);
        }
        // Track vs Pad/Via
        if (a.type === 'track' && (b.type === 'pad' || b.type === 'via')) {
            const ptDist = pointToSegmentDistance(b.center, a.start, a.end);
            return ptDist - (a.halfWidth ?? 0) - (b.radius ?? 0);
        }
        if (b.type === 'track' && (a.type === 'pad' || a.type === 'via')) {
            const ptDist = pointToSegmentDistance(a.center, b.start, b.end);
            return ptDist - (b.halfWidth ?? 0) - (a.radius ?? 0);
        }
        // Point-like objects (pad, via) vs point-like
        const dx = a.center.x - b.center.x;
        const dy = a.center.y - b.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist - (a.radius ?? 0) - (b.radius ?? 0);
    }
}
// ─── Geometry Helpers ────────────────────────────────────────────
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
function segmentToSegmentDistance(a1, a2, b1, b2) {
    return Math.min(pointToSegmentDistance(a1, b1, b2), pointToSegmentDistance(a2, b1, b2), pointToSegmentDistance(b1, a1, a2), pointToSegmentDistance(b2, a1, a2));
}
function bboxOverlap(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}
//# sourceMappingURL=drc.js.map