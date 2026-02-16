import { Vector2D } from './vector2d';
/**
 * 3×3 transformation matrix for 2-D transforms.
 *
 * Layout (column-major conceptual, stored row-major in a flat array):
 *
 *   [ m[0]  m[1]  m[2] ]     [ a  b  tx ]
 *   [ m[3]  m[4]  m[5] ]  =  [ c  d  ty ]
 *   [ m[6]  m[7]  m[8] ]     [ 0  0   1 ]
 */
export declare class Matrix3 {
    /** The 9 elements stored in row-major order. */
    readonly elements: Float64Array;
    constructor(elements?: ArrayLike<number>);
    static identity(): Matrix3;
    static translation(tx: number, ty: number): Matrix3;
    static rotation(angle: number): Matrix3;
    static scaling(sx: number, sy: number): Matrix3;
    /** Return `this × other`. */
    multiply(other: Matrix3): Matrix3;
    /** Apply the transform to a single point (treats it as [x, y, 1]). */
    transformPoint(p: Vector2D): Vector2D;
    transformPoints(points: Vector2D[]): Vector2D[];
    determinant(): number;
    /** Return the inverse matrix, or throw if singular. */
    inverse(): Matrix3;
}
//# sourceMappingURL=matrix3.d.ts.map