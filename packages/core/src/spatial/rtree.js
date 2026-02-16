import { BBox } from '../math/bbox';
// ─── Tunables ─────────────────────────────────────────────
const MAX_CHILDREN = 9;
const MIN_CHILDREN = Math.ceil(MAX_CHILDREN * 0.4); // 4
// ─── Helpers ──────────────────────────────────────────────
function combinedBBox(boxes) {
    let result = BBox.empty();
    for (const b of boxes) {
        result = result.union(b.bbox);
    }
    return result;
}
function bboxArea(b) {
    return b.width * b.height;
}
function bboxEnlargement(base, addition) {
    return bboxArea(base.union(addition)) - bboxArea(base);
}
// ─── RTree ────────────────────────────────────────────────
/**
 * A basic R-tree for efficient 2-D spatial indexing.
 *
 * Supports insert, remove, bounding-box search, and nearest-neighbour
 * queries. The implementation uses a simple quadratic split strategy.
 */
export class RTree {
    root;
    _size = 0;
    itemMap = new Map();
    constructor() {
        this.root = { kind: 'leaf', bbox: BBox.empty(), children: [] };
    }
    get size() {
        return this._size;
    }
    // ── Insert ────────────────────────────────────────────
    insert(item) {
        this.itemMap.set(item.id, item);
        this._size++;
        const splitResult = this.insertInto(this.root, item);
        if (splitResult) {
            // Root was split — create a new root branch.
            this.root = {
                kind: 'branch',
                bbox: splitResult[0].bbox.union(splitResult[1].bbox),
                children: splitResult,
            };
        }
    }
    /**
     * Insert `item` into `node`. Returns `null` if no split occurred, or a
     * 2-element tuple of the two new nodes if `node` was split.
     */
    insertInto(node, item) {
        if (node.kind === 'leaf') {
            node.children.push(item);
            node.bbox = node.bbox.union(item.bbox);
            if (node.children.length > MAX_CHILDREN) {
                return this.splitLeaf(node);
            }
            return null;
        }
        // Branch — pick the child whose bbox needs the least enlargement.
        let bestIdx = 0;
        let bestEnlargement = Infinity;
        for (let i = 0; i < node.children.length; i++) {
            const enlargement = bboxEnlargement(node.children[i].bbox, item.bbox);
            if (enlargement < bestEnlargement ||
                (enlargement === bestEnlargement &&
                    bboxArea(node.children[i].bbox) <
                        bboxArea(node.children[bestIdx].bbox))) {
                bestEnlargement = enlargement;
                bestIdx = i;
            }
        }
        const child = node.children[bestIdx];
        const splitResult = this.insertInto(child, item);
        if (splitResult) {
            // Replace the old child with the two halves.
            node.children.splice(bestIdx, 1, splitResult[0], splitResult[1]);
            node.bbox = combinedBBox(node.children);
            if (node.children.length > MAX_CHILDREN) {
                return this.splitBranch(node);
            }
        }
        else {
            node.bbox = node.bbox.union(item.bbox);
        }
        return null;
    }
    // ── Quadratic split (leaf) ────────────────────────────
    splitLeaf(node) {
        const [seedA, seedB] = this.pickSeeds(node.children);
        const a = [node.children[seedA]];
        const b = [node.children[seedB]];
        let bboxA = node.children[seedA].bbox;
        let bboxB = node.children[seedB].bbox;
        const remaining = node.children.filter((_, i) => i !== seedA && i !== seedB);
        for (const item of remaining) {
            if (a.length + remaining.length - b.length <= MIN_CHILDREN) {
                a.push(item);
                bboxA = bboxA.union(item.bbox);
            }
            else if (b.length + remaining.length - a.length <= MIN_CHILDREN) {
                b.push(item);
                bboxB = bboxB.union(item.bbox);
            }
            else {
                const eA = bboxEnlargement(bboxA, item.bbox);
                const eB = bboxEnlargement(bboxB, item.bbox);
                if (eA < eB) {
                    a.push(item);
                    bboxA = bboxA.union(item.bbox);
                }
                else {
                    b.push(item);
                    bboxB = bboxB.union(item.bbox);
                }
            }
        }
        return [
            { kind: 'leaf', bbox: combinedBBox(a), children: a },
            { kind: 'leaf', bbox: combinedBBox(b), children: b },
        ];
    }
    // ── Quadratic split (branch) ──────────────────────────
    splitBranch(node) {
        const [seedA, seedB] = this.pickSeeds(node.children);
        const a = [node.children[seedA]];
        const b = [node.children[seedB]];
        let bboxA = node.children[seedA].bbox;
        let bboxB = node.children[seedB].bbox;
        const remaining = node.children.filter((_, i) => i !== seedA && i !== seedB);
        for (const child of remaining) {
            if (a.length + remaining.length - b.length <= MIN_CHILDREN) {
                a.push(child);
                bboxA = bboxA.union(child.bbox);
            }
            else if (b.length + remaining.length - a.length <= MIN_CHILDREN) {
                b.push(child);
                bboxB = bboxB.union(child.bbox);
            }
            else {
                const eA = bboxEnlargement(bboxA, child.bbox);
                const eB = bboxEnlargement(bboxB, child.bbox);
                if (eA < eB) {
                    a.push(child);
                    bboxA = bboxA.union(child.bbox);
                }
                else {
                    b.push(child);
                    bboxB = bboxB.union(child.bbox);
                }
            }
        }
        return [
            { kind: 'branch', bbox: combinedBBox(a), children: a },
            { kind: 'branch', bbox: combinedBBox(b), children: b },
        ];
    }
    // ── Pick seeds (quadratic) ────────────────────────────
    pickSeeds(items) {
        let worstWaste = -Infinity;
        let seedA = 0;
        let seedB = 1;
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const combined = items[i].bbox.union(items[j].bbox);
                const waste = bboxArea(combined) - bboxArea(items[i].bbox) - bboxArea(items[j].bbox);
                if (waste > worstWaste) {
                    worstWaste = waste;
                    seedA = i;
                    seedB = j;
                }
            }
        }
        return [seedA, seedB];
    }
    // ── Remove ────────────────────────────────────────────
    remove(id) {
        const removed = this.removeFromNode(this.root, id);
        if (removed) {
            this._size--;
            this.itemMap.delete(id);
            // Condense root: if root is a branch with a single child, collapse.
            if (this.root.kind === 'branch' &&
                this.root.children.length === 1) {
                this.root = this.root.children[0];
            }
        }
        return removed;
    }
    removeFromNode(node, id) {
        if (node.kind === 'leaf') {
            const idx = node.children.findIndex((c) => c.id === id);
            if (idx === -1)
                return false;
            node.children.splice(idx, 1);
            node.bbox =
                node.children.length > 0 ? combinedBBox(node.children) : BBox.empty();
            return true;
        }
        for (const child of node.children) {
            if (this.removeFromNode(child, id)) {
                // Re-compute parent bbox.
                node.bbox = combinedBBox(node.children);
                // If the child is now under-full, orphan its entries and re-insert.
                if ((child.kind === 'leaf' && child.children.length < MIN_CHILDREN && child.children.length > 0) ||
                    (child.kind === 'branch' && child.children.length < MIN_CHILDREN && child.children.length > 0)) {
                    // Collect all items from the under-full subtree.
                    const orphans = this.collectItems(child);
                    // Remove the under-full child.
                    const idx = node.children.indexOf(child);
                    node.children.splice(idx, 1);
                    node.bbox =
                        node.children.length > 0
                            ? combinedBBox(node.children)
                            : BBox.empty();
                    // Re-insert orphans from the top.
                    for (const orphan of orphans) {
                        this._size--; // offset the increment in insert()
                        this.itemMap.delete(orphan.id);
                        this.insert(orphan);
                    }
                }
                return true;
            }
        }
        // Also handle empty children — prune them.
        node.children = node.children.filter((c) => {
            if (c.kind === 'leaf')
                return c.children.length > 0;
            if (c.kind === 'branch')
                return c.children.length > 0;
            return true;
        });
        if (node.children.length > 0) {
            node.bbox = combinedBBox(node.children);
        }
        else {
            node.bbox = BBox.empty();
        }
        return false;
    }
    collectItems(node) {
        if (node.kind === 'leaf')
            return [...node.children];
        const items = [];
        for (const child of node.children) {
            items.push(...this.collectItems(child));
        }
        return items;
    }
    // ── Search ────────────────────────────────────────────
    /** Return all items whose bounding box intersects `bbox`. */
    search(bbox) {
        const results = [];
        this.searchNode(this.root, bbox, results);
        return results;
    }
    searchNode(node, bbox, results) {
        if (!node.bbox.intersects(bbox))
            return;
        if (node.kind === 'leaf') {
            for (const item of node.children) {
                if (item.bbox.intersects(bbox)) {
                    results.push(item);
                }
            }
        }
        else {
            for (const child of node.children) {
                this.searchNode(child, bbox, results);
            }
        }
    }
    // ── Nearest ───────────────────────────────────────────
    /**
     * Return items whose bbox center is within `maxDistance` of `point`,
     * sorted by ascending distance.
     */
    nearest(point, maxDistance) {
        const searchBox = new BBox(point.x - maxDistance, point.y - maxDistance, point.x + maxDistance, point.y + maxDistance);
        const candidates = this.search(searchBox);
        const maxDist2 = maxDistance * maxDistance;
        return candidates
            .map((item) => ({
            item,
            dist2: item.bbox.center().sub(point).lengthSquared(),
        }))
            .filter((c) => c.dist2 <= maxDist2)
            .sort((a, b) => a.dist2 - b.dist2)
            .map((c) => c.item);
    }
    // ── Clear ─────────────────────────────────────────────
    clear() {
        this.root = { kind: 'leaf', bbox: BBox.empty(), children: [] };
        this._size = 0;
        this.itemMap.clear();
    }
}
//# sourceMappingURL=rtree.js.map