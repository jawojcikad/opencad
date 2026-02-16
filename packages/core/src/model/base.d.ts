import { Vector2D } from '../math/vector2d';
export type UUID = string;
/**
 * Generate a v4 UUID.
 * Uses `crypto.randomUUID` when available, otherwise falls back to a
 * Math.random-based generator.
 */
export declare function generateId(): UUID;
export interface Identifiable {
    id: UUID;
}
export interface Named {
    name: string;
}
export interface Positioned {
    position: Vector2D;
    /** Rotation in degrees. */
    rotation: number;
}
//# sourceMappingURL=base.d.ts.map