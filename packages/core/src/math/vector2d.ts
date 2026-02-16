export class Vector2D {
  constructor(public x: number, public y: number) {}

  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  scale(s: number): Vector2D {
    return new Vector2D(this.x * s, this.y * s);
  }

  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  /** 2D cross product — returns the scalar z-component. */
  cross(v: Vector2D): number {
    return this.x * v.y - this.y * v.x;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector2D {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / len, this.y / len);
  }

  /** Rotate by `angle` radians counter-clockwise. */
  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  distanceTo(v: Vector2D): number {
    return this.sub(v).length();
  }

  /** Signed angle from this vector to `v`, in radians (−π, π]. */
  angleTo(v: Vector2D): number {
    return Math.atan2(this.cross(v), this.dot(v));
  }

  /** Linear interpolation between this and `v` by factor `t`. */
  lerp(v: Vector2D, t: number): Vector2D {
    return new Vector2D(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
    );
  }

  equals(v: Vector2D, epsilon: number = 1e-10): boolean {
    return (
      Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon
    );
  }

  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  /** Create a unit vector from an angle (radians), optionally scaled. */
  static fromAngle(angle: number, length: number = 1): Vector2D {
    return new Vector2D(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  static zero(): Vector2D {
    return new Vector2D(0, 0);
  }
}
