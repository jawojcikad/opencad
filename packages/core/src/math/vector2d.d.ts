export declare class Vector2D {
    x: number;
    y: number;
    constructor(x: number, y: number);
    add(v: Vector2D): Vector2D;
    sub(v: Vector2D): Vector2D;
    scale(s: number): Vector2D;
    dot(v: Vector2D): number;
    /** 2D cross product — returns the scalar z-component. */
    cross(v: Vector2D): number;
    length(): number;
    lengthSquared(): number;
    normalize(): Vector2D;
    /** Rotate by `angle` radians counter-clockwise. */
    rotate(angle: number): Vector2D;
    distanceTo(v: Vector2D): number;
    /** Signed angle from this vector to `v`, in radians (−π, π]. */
    angleTo(v: Vector2D): number;
    /** Linear interpolation between this and `v` by factor `t`. */
    lerp(v: Vector2D, t: number): Vector2D;
    equals(v: Vector2D, epsilon?: number): boolean;
    clone(): Vector2D;
    /** Create a unit vector from an angle (radians), optionally scaled. */
    static fromAngle(angle: number, length?: number): Vector2D;
    static zero(): Vector2D;
}
//# sourceMappingURL=vector2d.d.ts.map