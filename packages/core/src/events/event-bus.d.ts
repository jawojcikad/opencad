type EventHandler<T = unknown> = (data: T) => void;
/**
 * Simple typed event bus.
 *
 * Usage:
 * ```ts
 * const bus = new EventBus();
 * const unsub = bus.on<string>('greeting', (msg) => console.log(msg));
 * bus.emit<string>('greeting', 'hello');
 * unsub(); // stop listening
 * ```
 */
export declare class EventBus {
    private listeners;
    /**
     * Subscribe to `event`. Returns an unsubscribe function.
     */
    on<T>(event: string, handler: EventHandler<T>): () => void;
    off<T>(event: string, handler: EventHandler<T>): void;
    emit<T>(event: string, data: T): void;
    /**
     * Subscribe to `event` for a single invocation, then auto-unsubscribe.
     * Returns an unsubscribe function in case you want to cancel early.
     */
    once<T>(event: string, handler: EventHandler<T>): () => void;
    /**
     * Remove all listeners, optionally scoped to a single event.
     */
    removeAllListeners(event?: string): void;
}
export {};
//# sourceMappingURL=event-bus.d.ts.map