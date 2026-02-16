// ---------------------------------------------------------------------------
// OpenCAD — Autorouter Worker
// ---------------------------------------------------------------------------
// Runs auto-routing in a background Web Worker.
// Uses a grid-based Lee / wave-expansion algorithm.
// Posts progress updates and final routed tracks.
// ---------------------------------------------------------------------------
function buildConnectionList(footprints) {
    // Group pads by net
    const netPads = new Map();
    for (const fp of footprints) {
        for (const pad of fp.pads) {
            if (!pad.net || pad.net === '')
                continue;
            const absPos = {
                x: fp.position.x + pad.position.x,
                y: fp.position.y + pad.position.y,
            };
            let list = netPads.get(pad.net);
            if (!list) {
                list = [];
                netPads.set(pad.net, list);
            }
            list.push(absPos);
        }
    }
    const connections = [];
    for (const [net, pads] of netPads) {
        // Simple: connect pads sequentially (star topology would be better)
        for (let i = 0; i < pads.length - 1; i++) {
            connections.push({ net, start: pads[i], end: pads[i + 1] });
        }
    }
    return connections;
}
function worldToGrid(pos, origin, res) {
    return {
        c: Math.round((pos.x - origin.x) / res),
        r: Math.round((pos.y - origin.y) / res),
    };
}
function gridToWorld(r, c, origin, res) {
    return { x: origin.x + c * res, y: origin.y + r * res };
}
function leeRoute(grid, rows, cols, startR, startC, endR, endC) {
    // Reset visited / cost
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            grid[r][c].visited = false;
            grid[r][c].cost = Infinity;
            grid[r][c].parent = null;
        }
    }
    if (startR < 0 || startR >= rows || startC < 0 || startC >= cols ||
        endR < 0 || endR >= rows || endC < 0 || endC >= cols) {
        return null;
    }
    // BFS wave expansion
    const queue = [];
    grid[startR][startC].cost = 0;
    grid[startR][startC].visited = true;
    queue.push({ r: startR, c: startC });
    const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
    ];
    let found = false;
    while (queue.length > 0) {
        const cur = queue.shift();
        if (cur.r === endR && cur.c === endC) {
            found = true;
            break;
        }
        for (const d of dirs) {
            const nr = cur.r + d.dr;
            const nc = cur.c + d.dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols)
                continue;
            const cell = grid[nr][nc];
            if (cell.visited || cell.blocked)
                continue;
            cell.visited = true;
            cell.cost = grid[cur.r][cur.c].cost + 1;
            cell.parent = { r: cur.r, c: cur.c };
            queue.push({ r: nr, c: nc });
        }
    }
    if (!found)
        return null;
    // Back-trace path
    const pathCells = [];
    let cur = { r: endR, c: endC };
    while (cur) {
        pathCells.push(cur);
        cur = grid[cur.r][cur.c].parent;
    }
    pathCells.reverse();
    // Simplify: collapse colinear segments
    const simplified = [pathCells[0]];
    for (let i = 1; i < pathCells.length - 1; i++) {
        const prev = pathCells[i - 1];
        const next = pathCells[i + 1];
        const cur = pathCells[i];
        const dr1 = cur.r - prev.r;
        const dc1 = cur.c - prev.c;
        const dr2 = next.r - cur.r;
        const dc2 = next.c - cur.c;
        if (dr1 !== dr2 || dc1 !== dc2) {
            simplified.push(cur);
        }
    }
    simplified.push(pathCells[pathCells.length - 1]);
    return simplified.map((p) => ({ x: p.c, y: p.r })); // grid coords, converted later
}
function markTrackOnGrid(grid, rows, cols, path, clearanceCells) {
    for (const pt of path) {
        const r = pt.y;
        const c = pt.x;
        for (let dr = -clearanceCells; dr <= clearanceCells; dr++) {
            for (let dc = -clearanceCells; dc <= clearanceCells; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    grid[nr][nc].blocked = true;
                }
            }
        }
    }
}
self.onmessage = (e) => {
    const { document: pcbDoc, rules, config } = e.data;
    const res = config.gridResolution || 0.5; // mm per cell
    console.log('[Autorouter Worker] Starting auto-route…');
    // Determine board bounds
    const outline = pcbDoc.boardOutline.points;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of outline) {
        if (p.x < minX)
            minX = p.x;
        if (p.y < minY)
            minY = p.y;
        if (p.x > maxX)
            maxX = p.x;
        if (p.y > maxY)
            maxY = p.y;
    }
    const origin = { x: minX, y: minY };
    const cols = Math.ceil((maxX - minX) / res) + 1;
    const rows = Math.ceil((maxY - minY) / res) + 1;
    // Build grid
    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({ blocked: false, cost: Infinity, visited: false, parent: null });
        }
        grid.push(row);
    }
    // Block existing pads (with clearance) — they are obstacles for other nets
    const clearanceCells = Math.ceil(rules.clearance / res);
    // Build ratsnest connections
    const connections = buildConnectionList(pcbDoc.footprints);
    const totalConnections = connections.length;
    const newTracks = [];
    let routed = 0;
    let failed = 0;
    for (let i = 0; i < connections.length; i++) {
        const conn = connections[i];
        const sg = worldToGrid(conn.start, origin, res);
        const eg = worldToGrid(conn.end, origin, res);
        // Temporarily unblock start and end
        const startBlocked = grid[sg.r]?.[sg.c]?.blocked ?? false;
        const endBlocked = grid[eg.r]?.[eg.c]?.blocked ?? false;
        if (grid[sg.r]?.[sg.c])
            grid[sg.r][sg.c].blocked = false;
        if (grid[eg.r]?.[eg.c])
            grid[eg.r][eg.c].blocked = false;
        const pathGrid = leeRoute(grid, rows, cols, sg.r, sg.c, eg.r, eg.c);
        if (pathGrid) {
            const worldPath = pathGrid.map((p) => gridToWorld(p.y, p.x, origin, res));
            newTracks.push({
                id: `autotrack-${i}`,
                net: conn.net,
                layer: config.preferredLayer || 'F.Cu',
                width: rules.trackWidth,
                points: worldPath,
            });
            markTrackOnGrid(grid, rows, cols, pathGrid, clearanceCells);
            routed++;
        }
        else {
            failed++;
        }
        // Restore blocked state
        if (grid[sg.r]?.[sg.c])
            grid[sg.r][sg.c].blocked = startBlocked;
        if (grid[eg.r]?.[eg.c])
            grid[eg.r][eg.c].blocked = endBlocked;
        // Report progress
        const progress = (i + 1) / totalConnections;
        self.postMessage({ type: 'progress', progress, routed, failed });
    }
    console.log(`[Autorouter Worker] Complete — ${routed} routed, ${failed} failed.`);
    self.postMessage({
        type: 'complete',
        result: {
            tracks: newTracks,
            routed,
            failed,
            total: totalConnections,
        },
    });
};
export {};
//# sourceMappingURL=autorouter-worker.js.map