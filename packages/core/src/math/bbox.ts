import { Vector2D } from './vector2d';

export class BBox {
  constructor(
    public readonly minX: number,
    public readonly minY: number,
    public readonly maxX: number,
    public readonly maxY: number,
  ) {}

  /** Build the smallest BBox that contains all given points. */
  static fromPoints(points: Vector2D[]): BBox {
    if (points.length === 0) return BBox.empty();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return new BBox(minX, minY, maxX, maxY);
  }

  /** An "empty" (inverted) bbox — useful as the identity element for union. */
  static empty(): BBox {
    return new BBox(Infinity, Infinity, -Infinity, -Infinity);
  }

  get width(): number {
    return this.maxX - this.minX;
  }

  get height(): number {
    return this.maxY - this.minY;
  }

  center(): Vector2D {
    return new Vector2D(
      (this.minX + this.maxX) / 2,
      (this.minY + this.maxY) / 2,
    );
  }

  contains(point: Vector2D): boolean {
    return (
      point.x >= this.minX &&
      point.x <= this.maxX &&
      point.y >= this.minY &&
      point.y <= this.maxY
    );
  }

  containsBBox(other: BBox): boolean {
    return (
      other.minX >= this.minX &&
      other.minY >= this.minY &&
      other.maxX <= this.maxX &&
      other.maxY <= this.maxY
    );
  }

  intersects(other: BBox): boolean {
    return (
      this.minX <= other.maxX &&
      this.maxX >= other.minX &&
      this.minY <= other.maxY &&
      this.maxY >= other.minY
    );
  }

  union(other: BBox): BBox {
    return new BBox(
      Math.min(this.minX, other.minX),
      Math.min(this.minY, other.minY),
      Math.max(this.maxX, other.maxX),
      Math.max(this.maxY, other.maxY),
    );
  }

  intersection(other: BBox): BBox | null {
    const minX = Math.max(this.minX, other.minX);
    const minY = Math.max(this.minY, other.minY);
    const maxX = Math.min(this.maxX, other.maxX);
    const maxY = Math.min(this.maxY, other.maxY);
    if (minX > maxX || minY > maxY) return null;
    return new BBox(minX, minY, maxX, maxY);
  }

  /** Return a new BBox expanded by `margin` on every side. */
  expand(margin: number): BBox {
    return new BBox(
      this.minX - margin,
      this.minY - margin,
      this.maxX + margin,
      this.maxY + margin,
    );
  }
}
