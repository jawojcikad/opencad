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
export class EventBus {
    listeners = new Map();
    /**
     * Subscribe to `event`. Returns an unsubscribe function.
     */
    on(event, handler) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(handler);
        return () => this.off(event, handler);
    }
    off(event, handler) {
        this.listeners.get(event)?.delete(handler);
    }
    emit(event, data) {
        const set = this.listeners.get(event);
        if (!set)
            return;
        for (const handler of set) {
            handler(data);
        }
    }
    /**
     * Subscribe to `event` for a single invocation, then auto-unsubscribe.
     * Returns an unsubscribe function in case you want to cancel early.
     */
    once(event, handler) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            handler(data);
        };
        return this.on(event, wrapper);
    }
    /**
     * Remove all listeners, optionally scoped to a single event.
     */
    removeAllListeners(event) {
        if (event !== undefined) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    }
}
//# sourceMappingURL=event-bus.js.map