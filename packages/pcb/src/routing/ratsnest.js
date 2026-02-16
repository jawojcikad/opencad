class UnionFind {
    nodes;
    constructor(size) {
        this.nodes = Array.from({ length: size }, (_, i) => ({ parent: i, rank: 0 }));
    }
    find(x) {
        if (this.nodes[x].parent !== x) {
            this.nodes[x].parent = this.find(this.nodes[x].parent);
        }
        return this.nodes[x].parent;
    }
    union(a, b) {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra === rb)
            return false;
        if (this.nodes[ra].rank < this.nodes[rb].rank) {
            this.nodes[ra].parent = rb;
        }
        else if (this.nodes[ra].rank > this.nodes[rb].rank) {
            this.nodes[rb].parent = ra;
        }
        else {
            this.nodes[rb].parent = ra;
            this.nodes[ra].rank++;
        }
        return true;
    }
    connected(a, b) {
        return this.find(a) === this.find(b);
    }
}
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function getPadWorldPosition(footprint, pad) {
    const cos = Math.cos(footprint.rotation);
    const sin = Math.sin(footprint.rotation);
    return {
        x: footprint.position.x + pad.position.x * cos - pad.position.y * sin,
        y: footprint.position.y + pad.position.x * sin + pad.position.y * cos,
    };
}
export class RatsnestCalculator {
    /**
     * Calculate minimum spanning tree ratsnest for all unrouted connections.
     * Groups pads by net, determines which pads are already connected by tracks,
     * and computes MST for the remaining unconnected pads.
     */
    calculate(document) {
        const result = [];
        // Build a map of netId -> pads with world positions
        const netPads = new Map();
        for (const footprint of document.footprints) {
            for (const pad of footprint.pads) {
                if (!pad.netId)
                    continue;
                const worldPos = getPadWorldPosition(footprint, pad);
                if (!netPads.has(pad.netId)) {
                    netPads.set(pad.netId, []);
                }
                netPads.get(pad.netId).push({
                    position: worldPos,
                    id: pad.id,
                });
            }
        }
        // Build routed connections from tracks
        // A track connects two endpoints; if a pad is at an endpoint, it's connected
        const routedConnections = this.buildRoutedConnections(document);
        // For each net, compute MST of unrouted connections
        for (const [netId, pads] of netPads) {
            if (pads.length < 2)
                continue;
            const connections = routedConnections.get(netId) ?? new Set();
            const lines = this.calculateNetRatsnest(pads, connections, netId);
            result.push(...lines);
        }
        return result;
    }
    /**
     * Build a set of routed connections for each net.
     * A connection is represented as "padId1:padId2" (sorted).
     */
    buildRoutedConnections(document) {
        const connections = new Map();
        // Build a spatial lookup: position -> padId for each pad
        const positionToPad = new Map();
        const SNAP_TOLERANCE = 0.01; // nm tolerance
        for (const footprint of document.footprints) {
            for (const pad of footprint.pads) {
                if (!pad.netId)
                    continue;
                const worldPos = getPadWorldPosition(footprint, pad);
                const key = `${Math.round(worldPos.x / SNAP_TOLERANCE)}:${Math.round(worldPos.y / SNAP_TOLERANCE)}`;
                positionToPad.set(key, { padId: pad.id, netId: pad.netId });
            }
        }
        // For each track, find which pads it connects
        for (const track of document.tracks) {
            if (!track.netId)
                continue;
            const startKey = `${Math.round(track.start.x / SNAP_TOLERANCE)}:${Math.round(track.start.y / SNAP_TOLERANCE)}`;
            const endKey = `${Math.round(track.end.x / SNAP_TOLERANCE)}:${Math.round(track.end.y / SNAP_TOLERANCE)}`;
            const startPad = positionToPad.get(startKey);
            const endPad = positionToPad.get(endKey);
            if (startPad && endPad && startPad.netId === endPad.netId) {
                const netId = startPad.netId;
                if (!connections.has(netId)) {
                    connections.set(netId, new Set());
                }
                const connKey = startPad.padId < endPad.padId
                    ? `${startPad.padId}:${endPad.padId}`
                    : `${endPad.padId}:${startPad.padId}`;
                connections.get(netId).add(connKey);
            }
        }
        // Also discover connectivity through chains of tracks using union-find
        // Build a graph of track endpoints for each net
        const netTrackEndpoints = new Map();
        const netTrackUF = new Map();
        for (const track of document.tracks) {
            if (!track.netId)
                continue;
            if (!netTrackEndpoints.has(track.netId)) {
                netTrackEndpoints.set(track.netId, new Map());
                netTrackUF.set(track.netId, { uf: new UnionFind(1000), count: 0 });
            }
            const endpoints = netTrackEndpoints.get(track.netId);
            const ufData = netTrackUF.get(track.netId);
            const sk = `${Math.round(track.start.x / SNAP_TOLERANCE)}:${Math.round(track.start.y / SNAP_TOLERANCE)}`;
            const ek = `${Math.round(track.end.x / SNAP_TOLERANCE)}:${Math.round(track.end.y / SNAP_TOLERANCE)}`;
            if (!endpoints.has(sk)) {
                endpoints.set(sk, ufData.count++);
            }
            if (!endpoints.has(ek)) {
                endpoints.set(ek, ufData.count++);
            }
            ufData.uf.union(endpoints.get(sk), endpoints.get(ek));
        }
        // Now check which pads are in the same connected component
        for (const [netId, endpoints] of netTrackEndpoints) {
            const ufData = netTrackUF.get(netId);
            const padsOnNet = [];
            for (const footprint of document.footprints) {
                for (const pad of footprint.pads) {
                    if (pad.netId !== netId)
                        continue;
                    const worldPos = getPadWorldPosition(footprint, pad);
                    const key = `${Math.round(worldPos.x / SNAP_TOLERANCE)}:${Math.round(worldPos.y / SNAP_TOLERANCE)}`;
                    const idx = endpoints.get(key);
                    if (idx !== undefined) {
                        padsOnNet.push({ padId: pad.id, ufIdx: idx });
                    }
                }
            }
            if (!connections.has(netId)) {
                connections.set(netId, new Set());
            }
            const connSet = connections.get(netId);
            for (let i = 0; i < padsOnNet.length; i++) {
                for (let j = i + 1; j < padsOnNet.length; j++) {
                    if (ufData.uf.connected(padsOnNet[i].ufIdx, padsOnNet[j].ufIdx)) {
                        const connKey = padsOnNet[i].padId < padsOnNet[j].padId
                            ? `${padsOnNet[i].padId}:${padsOnNet[j].padId}`
                            : `${padsOnNet[j].padId}:${padsOnNet[i].padId}`;
                        connSet.add(connKey);
                    }
                }
            }
        }
        return connections;
    }
    /**
     * Kruskal's MST for a single net.
     * Uses the set of already-routed connections to pre-connect nodes.
     */
    calculateNetRatsnest(pads, routedConnections, netId) {
        const n = pads.length;
        if (n < 2)
            return [];
        // Build index from padId to index
        const idToIndex = new Map();
        for (let i = 0; i < n; i++) {
            idToIndex.set(pads[i].id, i);
        }
        // Initialize union-find, pre-merge routed connections
        const uf = new UnionFind(n);
        for (const conn of routedConnections) {
            const [a, b] = conn.split(':');
            const ai = idToIndex.get(a);
            const bi = idToIndex.get(b);
            if (ai !== undefined && bi !== undefined) {
                uf.union(ai, bi);
            }
        }
        // Build all edges sorted by distance
        const edges = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                edges.push({
                    i,
                    j,
                    dist: distance(pads[i].position, pads[j].position),
                });
            }
        }
        edges.sort((a, b) => a.dist - b.dist);
        // Kruskal's algorithm — only add edges that connect separate components
        const ratsnest = [];
        for (const edge of edges) {
            if (uf.union(edge.i, edge.j)) {
                ratsnest.push({
                    start: pads[edge.i].position,
                    end: pads[edge.j].position,
                    netId,
                });
            }
        }
        return ratsnest;
    }
}
//# sourceMappingURL=ratsnest.js.map