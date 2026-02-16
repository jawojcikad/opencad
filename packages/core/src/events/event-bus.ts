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
export class EventBus {
  private listeners = new Map<string, Set<EventHandler<any>>>();

  /**
   * Subscribe to `event`. Returns an unsubscribe function.
   */
  on<T>(event: string, handler: EventHandler<T>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<T>(event: string, data: T): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      handler(data);
    }
  }

  /**
   * Subscribe to `event` for a single invocation, then auto-unsubscribe.
   * Returns an unsubscribe function in case you want to cancel early.
   */
  once<T>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Remove all listeners, optionally scoped to a single event.
   */
  removeAllListeners(event?: string): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
