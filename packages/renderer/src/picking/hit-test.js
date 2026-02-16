// ── HitTester ───────────────────────────────────────────────────────
export class HitTester {
    items = new Map();
    register(item) {
        this.items.set(item.id, item);
    }
    unregister(id) {
        this.items.delete(id);
    }
    clear() {
        this.items.clear();
    }
    /**
     * Return the closest item under `point` within `tolerance`, or null.
     */
    pickAt(point, tolerance) {
        const results = this.pickAll(point, tolerance);
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Return all items under `point` within `tolerance`, sorted by
     * distance (ascending).
     */
    pickAll(point, tolerance) {
        const results = [];
        for (const item of this.items.values()) {
            // Quick AABB rejection — expand bounds by tolerance.
            const b = item.getBounds();
            if (point.x < b.minX - tolerance ||
                point.x > b.maxX + tolerance ||
                point.y < b.minY - tolerance ||
                point.y > b.maxY + tolerance) {
                continue;
            }
            if (item.hitTest(point, tolerance)) {
                // Approximate distance as distance-to-bounds-centre.
                const cx = (b.minX + b.maxX) / 2;
                const cy = (b.minY + b.maxY) / 2;
                const dist = Math.hypot(point.x - cx, point.y - cy);
                results.push({ id: item.id, distance: dist });
            }
        }
        results.sort((a, b) => a.distance - b.distance);
        return results;
    }
    /**
     * Return ids of all items whose bounds intersect `rect`.
     */
    pickInRect(rect) {
        const ids = [];
        for (const item of this.items.values()) {
            const b = item.getBounds();
            // AABB intersection test.
            if (b.maxX >= rect.minX &&
                b.minX <= rect.maxX &&
                b.maxY >= rect.minY &&
                b.minY <= rect.maxY) {
                ids.push(item.id);
            }
        }
        return ids;
    }
}
// ── Hit-test helpers for common shapes ──────────────────────────────
/**
 * Test whether `point` is within `tolerance` of a line segment with
 * the given `width`.
 */
export function hitTestLine(point, start, end, width, tolerance) {
    const dist = pointToSegmentDistance(point, start, end);
    return dist <= width / 2 + tolerance;
}
/**
 * Test whether `point` is within `tolerance` of a circle (outline).
 * Hits if the point is close to the circumference.
 */
export function hitTestCircle(point, center, radius, tolerance) {
    const dist = Math.hypot(point.x - center.x, point.y - center.y);
    return Math.abs(dist - radius) <= tolerance;
}
/**
 * Test whether `point` is within `tolerance` of an axis-aligned
 * rectangle (filled).
 */
export function hitTestRect(point, rect, tolerance) {
    return (point.x >= rect.minX - tolerance &&
        point.x <= rect.maxX + tolerance &&
        point.y >= rect.minY - tolerance &&
        point.y <= rect.maxY + tolerance);
}
/**
 * Test whether `point` is within `tolerance` of an arc stroke.
 * Angles are in radians, measured counter-clockwise from the
 * positive x-axis.
 */
export function hitTestArc(point, center, radius, startAngle, endAngle, width, tolerance) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const dist = Math.hypot(dx, dy);
    // Check radial distance to the arc stroke.
    if (Math.abs(dist - radius) > width / 2 + tolerance) {
        return false;
    }
    // Check angular containment.
    let angle = Math.atan2(dy, dx);
    // Normalise all angles to [0, 2π).
    angle = normaliseAngle(angle);
    const start = normaliseAngle(startAngle);
    const end = normaliseAngle(endAngle);
    if (start <= end) {
        return angle >= start && angle <= end;
    }
    // Arc wraps past 2π.
    return angle >= start || angle <= end;
}
// ── Internal utilities ──────────────────────────────────────────────
function pointToSegmentDistance(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const lengthSq = abx * abx + aby * aby;
    if (lengthSq === 0) {
        // Degenerate segment (a == b).
        return Math.hypot(apx, apy);
    }
    let t = (apx * abx + apy * aby) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = a.x + t * abx;
    const closestY = a.y + t * aby;
    return Math.hypot(p.x - closestX, p.y - closestY);
}
function normaliseAngle(a) {
    const TWO_PI = Math.PI * 2;
    return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}
//# sourceMappingURL=hit-test.js.map