import { Vector2D, BBox } from '@opencad/core';

// ── Interfaces ──────────────────────────────────────────────────────

export interface Pickable {
  id: string;
  getBounds(): BBox;
  hitTest(point: Vector2D, tolerance: number): boolean;
}

export interface PickResult {
  id: string;
  distance: number;
}

// ── HitTester ───────────────────────────────────────────────────────

export class HitTester {
  private items: Map<string, Pickable> = new Map();

  register(item: Pickable): void {
    this.items.set(item.id, item);
  }

  unregister(id: string): void {
    this.items.delete(id);
  }

  clear(): void {
    this.items.clear();
  }

  /**
   * Return the closest item under `point` within `tolerance`, or null.
   */
  pickAt(point: Vector2D, tolerance: number): PickResult | null {
    const results = this.pickAll(point, tolerance);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Return all items under `point` within `tolerance`, sorted by
   * distance (ascending).
   */
  pickAll(point: Vector2D, tolerance: number): PickResult[] {
    const results: PickResult[] = [];

    for (const item of this.items.values()) {
      // Quick AABB rejection — expand bounds by tolerance.
      const b = item.getBounds();
      if (
        point.x < b.minX - tolerance ||
        point.x > b.maxX + tolerance ||
        point.y < b.minY - tolerance ||
        point.y > b.maxY + tolerance
      ) {
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
  pickInRect(rect: BBox): string[] {
    const ids: string[] = [];

    for (const item of this.items.values()) {
      const b = item.getBounds();
      // AABB intersection test.
      if (
        b.maxX >= rect.minX &&
        b.minX <= rect.maxX &&
        b.maxY >= rect.minY &&
        b.minY <= rect.maxY
      ) {
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
export function hitTestLine(
  point: Vector2D,
  start: Vector2D,
  end: Vector2D,
  width: number,
  tolerance: number,
): boolean {
  const dist = pointToSegmentDistance(point, start, end);
  return dist <= width / 2 + tolerance;
}

/**
 * Test whether `point` is within `tolerance` of a circle (outline).
 * Hits if the point is close to the circumference.
 */
export function hitTestCircle(
  point: Vector2D,
  center: Vector2D,
  radius: number,
  tolerance: number,
): boolean {
  const dist = Math.hypot(point.x - center.x, point.y - center.y);
  return Math.abs(dist - radius) <= tolerance;
}

/**
 * Test whether `point` is within `tolerance` of an axis-aligned
 * rectangle (filled).
 */
export function hitTestRect(
  point: Vector2D,
  rect: BBox,
  tolerance: number,
): boolean {
  return (
    point.x >= rect.minX - tolerance &&
    point.x <= rect.maxX + tolerance &&
    point.y >= rect.minY - tolerance &&
    point.y <= rect.maxY + tolerance
  );
}

/**
 * Test whether `point` is within `tolerance` of an arc stroke.
 * Angles are in radians, measured counter-clockwise from the
 * positive x-axis.
 */
export function hitTestArc(
  point: Vector2D,
  center: Vector2D,
  radius: number,
  startAngle: number,
  endAngle: number,
  width: number,
  tolerance: number,
): boolean {
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

function pointToSegmentDistance(
  p: Vector2D,
  a: Vector2D,
  b: Vector2D,
): number {
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

function normaliseAngle(a: number): number {
  const TWO_PI = Math.PI * 2;
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}
