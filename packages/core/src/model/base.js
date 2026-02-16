/**
 * Generate a v4 UUID.
 * Uses `crypto.randomUUID` when available, otherwise falls back to a
 * Math.random-based generator.
 */
export function generateId() {
    if (typeof globalThis !== 'undefined' &&
        globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    // Fallback: RFC 4122 version 4 UUID via Math.random
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
//# sourceMappingURL=base.js.map