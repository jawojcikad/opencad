import { generateId, } from '@opencad/core';
const DEFAULT_CONFIG = {
    gridResolution: 0.1, // 0.1mm grid
    maxIterations: 100000,
    costFactors: {
        viaCount: 50,
        length: 1,
        layerChange: 30,
        bend: 5,
    },
};
export class Autorouter {
    document;
    rules;
    config;
    obstacleGrid = new Map(); // "x,y,layer" -> blocked
    gridMinX = 0;
    gridMinY = 0;
    gridMaxX = 100;
    gridMaxY = 100;
    copperLayers = ['F.Cu', 'B.Cu'];
    constructor(document, rules, config) {
        this.document = document;
        this.rules = rules;
        this.config = { ...DEFAULT_CONFIG, ...config };
        if (config?.costFactors) {
            this.config.costFactors = { ...DEFAULT_CONFIG.costFactors, ...config.costFactors };
        }
        this.initializeBounds();
    }
    /**
     * Route all unrouted nets, ordered by shortest Manhattan distance first.
     */
    routeAll(onProgress) {
        const result = {
            routedNets: 0,
            failedNets: [],
            tracks: [],
            vias: [],
        };
        // Build initial obstacle grid
        this.buildObstacleGrid();
        // Collect all nets that need routing
        const netsToRoute = this.collectUnroutedNets();
        // Sort nets by shortest connection first (easier nets first)
        netsToRoute.sort((a, b) => a.manhattanDist - b.manhattanDist);
        const totalNets = netsToRoute.length;
        let completed = 0;
        for (const net of netsToRoute) {
            const tracks = this.routeNet(net.netId);
            if (tracks.length > 0) {
                result.routedNets++;
                result.tracks.push(...tracks);
                // Add new tracks to obstacle grid so subsequent routes avoid them
                for (const track of tracks) {
                    this.addTrackToObstacleGrid(track);
                }
            }
            else {
                result.failedNets.push(net.netId);
            }
            completed++;
            if (onProgress) {
                onProgress(completed / totalNets);
            }
        }
        return result;
    }
    /**
     * Route a single net by connecting all its pads in sequence.
     * Uses minimum spanning tree ordering to determine pad connection order.
     */
    routeNet(netId) {
        const pads = this.collectNetPads(netId);
        if (pads.length < 2)
            return [];
        // Use MST to determine optimal connection order
        const connections = this.computeMST(pads);
        const allTracks = [];
        for (const conn of connections) {
            const startPad = pads[conn.from];
            const endPad = pads[conn.to];
            const startLayer = this.getLayerIndex(startPad.layer);
            const endLayer = this.getLayerIndex(endPad.layer);
            // Try routing on the start pad's layer first
            let path = this.findPath(startPad.position, endPad.position, startLayer, endLayer);
            if (!path) {
                // Try on the other layer
                const altLayer = startLayer === 0 ? 1 : 0;
                path = this.findPath(startPad.position, endPad.position, altLayer, altLayer);
            }
            if (path) {
                const tracks = this.pathToTracks(path, netId);
                allTracks.push(...tracks);
                // Block the routed path
                for (const track of tracks) {
                    this.addTrackToObstacleGrid(track);
                }
            }
        }
        return allTracks;
    }
    /**
     * A* pathfinding on a multi-layer routing grid.
     * Supports via transitions between layers.
     */
    findPath(start, end, startLayer, endLayer) {
        const res = this.config.gridResolution;
        const maxIter = this.config.maxIterations;
        const costs = this.config.costFactors;
        // Snap to grid
        const sx = Math.round(start.x / res) * res;
        const sy = Math.round(start.y / res) * res;
        const ex = Math.round(end.x / res) * res;
        const ey = Math.round(end.y / res) * res;
        const startNode = {
            x: sx,
            y: sy,
            layer: startLayer,
            g: 0,
            h: this.heuristic(sx, sy, startLayer, ex, ey, endLayer),
            f: 0,
            parent: null,
            fromVia: false,
        };
        startNode.f = startNode.g + startNode.h;
        // Priority queue implemented as a binary heap
        const openSet = new MinHeap((a, b) => a.f - b.f);
        openSet.push(startNode);
        const closedSet = new Set();
        const gScores = new Map();
        const nodeKey = (x, y, layer) => `${x.toFixed(4)},${y.toFixed(4)},${layer}`;
        gScores.set(nodeKey(sx, sy, startLayer), 0);
        // 8-directional neighbors on same layer + layer change via via
        const directions = [
            { dx: res, dy: 0, cost: res * costs.length },
            { dx: -res, dy: 0, cost: res * costs.length },
            { dx: 0, dy: res, cost: res * costs.length },
            { dx: 0, dy: -res, cost: res * costs.length },
            { dx: res, dy: res, cost: res * Math.SQRT2 * costs.length },
            { dx: res, dy: -res, cost: res * Math.SQRT2 * costs.length },
            { dx: -res, dy: res, cost: res * Math.SQRT2 * costs.length },
            { dx: -res, dy: -res, cost: res * Math.SQRT2 * costs.length },
        ];
        let iterations = 0;
        while (openSet.size() > 0 && iterations < maxIter) {
            iterations++;
            const current = openSet.pop();
            const currentKey = nodeKey(current.x, current.y, current.layer);
            // Check if we reached the goal
            if (Math.abs(current.x - ex) < res / 2 &&
                Math.abs(current.y - ey) < res / 2 &&
                (current.layer === endLayer || endLayer === -1)) {
                return this.reconstructPath(current);
            }
            if (closedSet.has(currentKey))
                continue;
            closedSet.add(currentKey);
            // Explore neighbors on the same layer
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const nKey = nodeKey(nx, ny, current.layer);
                if (closedSet.has(nKey))
                    continue;
                if (nx < this.gridMinX || nx > this.gridMaxX)
                    continue;
                if (ny < this.gridMinY || ny > this.gridMaxY)
                    continue;
                if (this.isBlocked(nx, ny, current.layer))
                    continue;
                // Bend cost
                let bendCost = 0;
                if (current.parent) {
                    const prevDx = current.x - current.parent.x;
                    const prevDy = current.y - current.parent.y;
                    if (Math.abs(prevDx - dir.dx) > res / 2 ||
                        Math.abs(prevDy - dir.dy) > res / 2) {
                        bendCost = costs.bend;
                    }
                }
                const tentativeG = current.g + dir.cost + bendCost;
                const existingG = gScores.get(nKey);
                if (existingG === undefined || tentativeG < existingG) {
                    const h = this.heuristic(nx, ny, current.layer, ex, ey, endLayer);
                    const neighbor = {
                        x: nx,
                        y: ny,
                        layer: current.layer,
                        g: tentativeG,
                        h,
                        f: tentativeG + h,
                        parent: current,
                        fromVia: false,
                    };
                    gScores.set(nKey, tentativeG);
                    openSet.push(neighbor);
                }
            }
            // Explore via transition (layer change at current position)
            if (this.copperLayers.length > 1) {
                for (let layerIdx = 0; layerIdx < this.copperLayers.length; layerIdx++) {
                    if (layerIdx === current.layer)
                        continue;
                    const nKey = nodeKey(current.x, current.y, layerIdx);
                    if (closedSet.has(nKey))
                        continue;
                    if (this.isBlocked(current.x, current.y, layerIdx))
                        continue;
                    const tentativeG = current.g + costs.viaCount + costs.layerChange;
                    const existingG = gScores.get(nKey);
                    if (existingG === undefined || tentativeG < existingG) {
                        const h = this.heuristic(current.x, current.y, layerIdx, ex, ey, endLayer);
                        const neighbor = {
                            x: current.x,
                            y: current.y,
                            layer: layerIdx,
                            g: tentativeG,
                            h,
                            f: tentativeG + h,
                            parent: current,
                            fromVia: true,
                        };
                        gScores.set(nKey, tentativeG);
                        openSet.push(neighbor);
                    }
                }
            }
        }
        // Path not found
        return null;
    }
    /**
     * Heuristic: Manhattan distance + layer change cost.
     */
    heuristic(x, y, layer, ex, ey, endLayer) {
        const manhattan = (Math.abs(x - ex) + Math.abs(y - ey)) * this.config.costFactors.length;
        const layerCost = layer !== endLayer && endLayer !== -1
            ? this.config.costFactors.layerChange + this.config.costFactors.viaCount
            : 0;
        return manhattan + layerCost;
    }
    /**
     * Reconstruct path from A* result.
     */
    reconstructPath(endNode) {
        const path = [];
        let current = endNode;
        while (current) {
            path.unshift(current);
            current = current.parent;
        }
        return path;
    }
    /**
     * Convert A* path to Track objects, simplifying collinear segments.
     */
    pathToTracks(path, netId) {
        const tracks = [];
        if (path.length < 2)
            return tracks;
        const width = this.rules.minTrackWidth ?? 0.25;
        // Merge collinear segments on the same layer
        let segStart = path[0];
        let prevDx = 0;
        let prevDy = 0;
        for (let i = 1; i < path.length; i++) {
            const current = path[i];
            if (current.fromVia || current.layer !== segStart.layer) {
                // Layer change — end current segment
                if (segStart !== path[i - 1]) {
                    tracks.push({
                        id: generateId(),
                        start: { x: segStart.x, y: segStart.y },
                        end: { x: path[i - 1].x, y: path[i - 1].y },
                        width,
                        layer: this.copperLayers[segStart.layer],
                        netId,
                    });
                }
                segStart = current;
                prevDx = 0;
                prevDy = 0;
                continue;
            }
            const dx = current.x - path[i - 1].x;
            const dy = current.y - path[i - 1].y;
            // If direction changed, emit a track for the previous segment
            if (i > 1 && (Math.abs(dx - prevDx) > 1e-6 || Math.abs(dy - prevDy) > 1e-6)) {
                tracks.push({
                    id: generateId(),
                    start: { x: segStart.x, y: segStart.y },
                    end: { x: path[i - 1].x, y: path[i - 1].y },
                    width,
                    layer: this.copperLayers[segStart.layer],
                    netId,
                });
                segStart = path[i - 1];
            }
            prevDx = dx;
            prevDy = dy;
        }
        // Emit final segment
        const lastPath = path[path.length - 1];
        if (Math.abs(segStart.x - lastPath.x) > 1e-6 ||
            Math.abs(segStart.y - lastPath.y) > 1e-6) {
            tracks.push({
                id: generateId(),
                start: { x: segStart.x, y: segStart.y },
                end: { x: lastPath.x, y: lastPath.y },
                width,
                layer: this.copperLayers[segStart.layer],
                netId,
            });
        }
        return tracks;
    }
    /**
     * Build obstacle grid from existing tracks, pads, vias, and board outline.
     */
    buildObstacleGrid() {
        this.obstacleGrid.clear();
        const res = this.config.gridResolution;
        const clearance = this.rules.clearance ?? 0.2;
        // Block areas occupied by tracks
        for (const track of this.document.tracks) {
            this.addTrackToObstacleGrid(track);
        }
        // Block areas occupied by pads
        for (const footprint of this.document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                const hw = ((pad.width ?? 1) / 2) + clearance;
                const hh = ((pad.height ?? 1) / 2) + clearance;
                for (let gx = worldPos.x - hw; gx <= worldPos.x + hw; gx += res) {
                    for (let gy = worldPos.y - hh; gy <= worldPos.y + hh; gy += res) {
                        const snappedX = Math.round(gx / res) * res;
                        const snappedY = Math.round(gy / res) * res;
                        if (pad.type === 'through_hole') {
                            for (let l = 0; l < this.copperLayers.length; l++) {
                                this.obstacleGrid.set(`${snappedX.toFixed(4)},${snappedY.toFixed(4)},${l}`, true);
                            }
                        }
                        else {
                            const layerIdx = this.getLayerIndex(pad.layer ?? 'F.Cu');
                            this.obstacleGrid.set(`${snappedX.toFixed(4)},${snappedY.toFixed(4)},${layerIdx}`, true);
                        }
                    }
                }
            }
        }
        // Block areas occupied by vias
        for (const via of this.document.vias) {
            const r = via.diameter / 2 + clearance;
            for (let gx = via.position.x - r; gx <= via.position.x + r; gx += res) {
                for (let gy = via.position.y - r; gy <= via.position.y + r; gy += res) {
                    const snappedX = Math.round(gx / res) * res;
                    const snappedY = Math.round(gy / res) * res;
                    const dx = snappedX - via.position.x;
                    const dy = snappedY - via.position.y;
                    if (dx * dx + dy * dy <= r * r) {
                        for (let l = 0; l < this.copperLayers.length; l++) {
                            this.obstacleGrid.set(`${snappedX.toFixed(4)},${snappedY.toFixed(4)},${l}`, true);
                        }
                    }
                }
            }
        }
    }
    addTrackToObstacleGrid(track) {
        const res = this.config.gridResolution;
        const clearance = this.rules.clearance ?? 0.2;
        const halfW = track.width / 2 + clearance;
        const layerIdx = this.getLayerIndex(track.layer);
        const dx = track.end.x - track.start.x;
        const dy = track.end.y - track.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 1e-10)
            return;
        const steps = Math.ceil(length / res) + 1;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = track.start.x + dx * t;
            const py = track.start.y + dy * t;
            // Block cells around the track center
            for (let ox = -halfW; ox <= halfW; ox += res) {
                for (let oy = -halfW; oy <= halfW; oy += res) {
                    const snappedX = Math.round((px + ox) / res) * res;
                    const snappedY = Math.round((py + oy) / res) * res;
                    this.obstacleGrid.set(`${snappedX.toFixed(4)},${snappedY.toFixed(4)},${layerIdx}`, true);
                }
            }
        }
    }
    isBlocked(x, y, layer) {
        return this.obstacleGrid.has(`${x.toFixed(4)},${y.toFixed(4)},${layer}`);
    }
    initializeBounds() {
        // Determine bounds from board outline or footprints
        if (this.document.boardOutline && this.document.boardOutline.points.length > 0) {
            const pts = this.document.boardOutline.points;
            this.gridMinX = Math.min(...pts.map((p) => p.x));
            this.gridMinY = Math.min(...pts.map((p) => p.y));
            this.gridMaxX = Math.max(...pts.map((p) => p.x));
            this.gridMaxY = Math.max(...pts.map((p) => p.y));
        }
        else {
            // Use footprints to estimate bounds
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const fp of this.document.footprints) {
                if (fp.position.x < minX)
                    minX = fp.position.x;
                if (fp.position.y < minY)
                    minY = fp.position.y;
                if (fp.position.x > maxX)
                    maxX = fp.position.x;
                if (fp.position.y > maxY)
                    maxY = fp.position.y;
            }
            if (minX === Infinity) {
                minX = 0;
                minY = 0;
                maxX = 100;
                maxY = 100;
            }
            const margin = 10;
            this.gridMinX = minX - margin;
            this.gridMinY = minY - margin;
            this.gridMaxX = maxX + margin;
            this.gridMaxY = maxY + margin;
        }
        // Determine copper layers
        const layerSet = new Set();
        layerSet.add('F.Cu');
        layerSet.add('B.Cu');
        for (const track of this.document.tracks) {
            layerSet.add(track.layer);
        }
        this.copperLayers = Array.from(layerSet);
    }
    getLayerIndex(layer) {
        const idx = this.copperLayers.indexOf(layer);
        return idx === -1 ? 0 : idx;
    }
    /**
     * Collect all pads belonging to the given net.
     */
    collectNetPads(netId) {
        const pads = [];
        for (const footprint of this.document.footprints) {
            const cos = Math.cos(footprint.rotation);
            const sin = Math.sin(footprint.rotation);
            for (const pad of footprint.pads) {
                if (pad.netId !== netId)
                    continue;
                const worldPos = {
                    x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
                    y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
                };
                pads.push({
                    position: worldPos,
                    id: pad.id,
                    layer: pad.layer ?? 'F.Cu',
                });
            }
        }
        return pads;
    }
    /**
     * Collect unrouted nets with their estimated routing difficulty.
     */
    collectUnroutedNets() {
        const netPads = new Map();
        for (const footprint of this.document.footprints) {
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
                netPads.get(pad.netId).push(worldPos);
            }
        }
        // Filter to nets with 2+ pads that have no tracks yet
        const routedNets = new Set(this.document.tracks.map((t) => t.netId));
        const result = [];
        for (const [netId, pads] of netPads) {
            if (pads.length < 2)
                continue;
            // Only include nets that aren't fully routed
            // (We include partially routed nets too)
            let totalDist = 0;
            for (let i = 1; i < pads.length; i++) {
                totalDist += Math.abs(pads[i].x - pads[0].x) + Math.abs(pads[i].y - pads[0].y);
            }
            result.push({ netId, manhattanDist: totalDist });
        }
        return result;
    }
    /**
     * Compute minimum spanning tree of pads using Prim's algorithm.
     * Returns a list of connections (edges) between pad indices.
     */
    computeMST(pads) {
        const n = pads.length;
        if (n < 2)
            return [];
        const inMST = new Array(n).fill(false);
        const minEdge = new Array(n).fill(Infinity);
        const bestFrom = new Array(n).fill(-1);
        const connections = [];
        minEdge[0] = 0;
        for (let iter = 0; iter < n; iter++) {
            // Find the unvisited node with minimum edge cost
            let u = -1;
            for (let i = 0; i < n; i++) {
                if (!inMST[i] && (u === -1 || minEdge[i] < minEdge[u])) {
                    u = i;
                }
            }
            if (u === -1)
                break;
            inMST[u] = true;
            if (bestFrom[u] !== -1) {
                connections.push({ from: bestFrom[u], to: u });
            }
            // Update minimum edges
            for (let v = 0; v < n; v++) {
                if (inMST[v])
                    continue;
                const dx = pads[u].position.x - pads[v].position.x;
                const dy = pads[u].position.y - pads[v].position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minEdge[v]) {
                    minEdge[v] = dist;
                    bestFrom[v] = u;
                }
            }
        }
        return connections;
    }
}
// ─── Binary Min-Heap ─────────────────────────────────────────────
class MinHeap {
    data = [];
    compare;
    constructor(compare) {
        this.compare = compare;
    }
    size() {
        return this.data.length;
    }
    push(item) {
        this.data.push(item);
        this.bubbleUp(this.data.length - 1);
    }
    pop() {
        if (this.data.length === 0)
            return undefined;
        const result = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this.bubbleDown(0);
        }
        return result;
    }
    bubbleUp(idx) {
        while (idx > 0) {
            const parent = Math.floor((idx - 1) / 2);
            if (this.compare(this.data[idx], this.data[parent]) < 0) {
                [this.data[idx], this.data[parent]] = [this.data[parent], this.data[idx]];
                idx = parent;
            }
            else {
                break;
            }
        }
    }
    bubbleDown(idx) {
        const n = this.data.length;
        while (true) {
            let smallest = idx;
            const left = 2 * idx + 1;
            const right = 2 * idx + 2;
            if (left < n && this.compare(this.data[left], this.data[smallest]) < 0) {
                smallest = left;
            }
            if (right < n && this.compare(this.data[right], this.data[smallest]) < 0) {
                smallest = right;
            }
            if (smallest !== idx) {
                [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
                idx = smallest;
            }
            else {
                break;
            }
        }
    }
}
//# sourceMappingURL=autorouter.js.map