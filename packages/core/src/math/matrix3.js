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
export class Matrix3 {
    /** The 9 elements stored in row-major order. */
    elements;
    constructor(elements) {
        this.elements = new Float64Array(9);
        if (elements) {
            for (let i = 0; i < 9; i++) {
                this.elements[i] = elements[i];
            }
        }
    }
    // ─── Static factories ──────────────────────────────────────
    static identity() {
        return new Matrix3([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }
    static translation(tx, ty) {
        return new Matrix3([1, 0, tx, 0, 1, ty, 0, 0, 1]);
    }
    static rotation(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Matrix3([c, -s, 0, s, c, 0, 0, 0, 1]);
    }
    static scaling(sx, sy) {
        return new Matrix3([sx, 0, 0, 0, sy, 0, 0, 0, 1]);
    }
    // ─── Instance methods ──────────────────────────────────────
    /** Return `this × other`. */
    multiply(other) {
        const a = this.elements;
        const b = other.elements;
        const out = new Float64Array(9);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                out[row * 3 + col] =
                    a[row * 3 + 0] * b[0 * 3 + col] +
                        a[row * 3 + 1] * b[1 * 3 + col] +
                        a[row * 3 + 2] * b[2 * 3 + col];
            }
        }
        return new Matrix3(out);
    }
    /** Apply the transform to a single point (treats it as [x, y, 1]). */
    transformPoint(p) {
        const e = this.elements;
        const x = e[0] * p.x + e[1] * p.y + e[2];
        const y = e[3] * p.x + e[4] * p.y + e[5];
        return new Vector2D(x, y);
    }
    transformPoints(points) {
        return points.map((p) => this.transformPoint(p));
    }
    determinant() {
        const e = this.elements;
        return (e[0] * (e[4] * e[8] - e[5] * e[7]) -
            e[1] * (e[3] * e[8] - e[5] * e[6]) +
            e[2] * (e[3] * e[7] - e[4] * e[6]));
    }
    /** Return the inverse matrix, or throw if singular. */
    inverse() {
        const det = this.determinant();
        if (Math.abs(det) < 1e-15) {
            throw new Error('Matrix3 is singular and cannot be inverted');
        }
        const e = this.elements;
        const invDet = 1 / det;
        const out = new Float64Array(9);
        out[0] = (e[4] * e[8] - e[5] * e[7]) * invDet;
        out[1] = (e[2] * e[7] - e[1] * e[8]) * invDet;
        out[2] = (e[1] * e[5] - e[2] * e[4]) * invDet;
        out[3] = (e[5] * e[6] - e[3] * e[8]) * invDet;
        out[4] = (e[0] * e[8] - e[2] * e[6]) * invDet;
        out[5] = (e[2] * e[3] - e[0] * e[5]) * invDet;
        out[6] = (e[3] * e[7] - e[4] * e[6]) * invDet;
        out[7] = (e[1] * e[6] - e[0] * e[7]) * invDet;
        out[8] = (e[0] * e[4] - e[1] * e[3]) * invDet;
        return new Matrix3(out);
    }
}
//# sourceMappingURL=matrix3.js.map