import { BBox } from '../math/bbox';
import { Vector2D } from '../math/vector2d';
/**
 * Every item stored in the R-tree must expose at least an `id` and a
 * bounding box.
 */
export interface SpatialItem {
    id: string;
    bbox: BBox;
}
/**
 * A basic R-tree for efficient 2-D spatial indexing.
 *
 * Supports insert, remove, bounding-box search, and nearest-neighbour
 * queries. The implementation uses a simple quadratic split strategy.
 */
export declare class RTree<T extends SpatialItem> {
    private root;
    private _size;
    private itemMap;
    constructor();
    get size(): number;
    insert(item: T): void;
    /**
     * Insert `item` into `node`. Returns `null` if no split occurred, or a
     * 2-element tuple of the two new nodes if `node` was split.
     */
    private insertInto;
    private splitLeaf;
    private splitBranch;
    private pickSeeds;
    remove(id: string): boolean;
    private removeFromNode;
    private collectItems;
    /** Return all items whose bounding box intersects `bbox`. */
    search(bbox: BBox): T[];
    private searchNode;
    /**
     * Return items whose bbox center is within `maxDistance` of `point`,
     * sorted by ascending distance.
     */
    nearest(point: Vector2D, maxDistance: number): T[];
    clear(): void;
}
//# sourceMappingURL=rtree.d.ts.map