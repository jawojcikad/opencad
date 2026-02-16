import { Vector2D } from '../math/vector2d';

// ─── UUID helper ───────────────────────────────────────────

export type UUID = string;

/**
 * Generate a v4 UUID.
 * Uses `crypto.randomUUID` when available, otherwise falls back to a
 * Math.random-based generator.
 */
export function generateId(): UUID {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback: RFC 4122 version 4 UUID via Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Common interfaces ────────────────────────────────────

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
