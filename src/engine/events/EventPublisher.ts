import type {
  EngineEvent,
  EngineEventBase,
  EngineEventHandler,
  EngineEventMap,
  EngineEventName,
} from "./types";

class EngineEventPublisher {
  private handlers = new Set<EngineEventHandler>();

  subscribe(handler: EngineEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.unsubscribe(handler);
  }

  unsubscribe(handler: EngineEventHandler): void {
    this.handlers.delete(handler);
  }

  emit<E extends EngineEventName>(
    name: E,
    payload: EngineEventMap[E],
  ): void {
    if (this.handlers.size === 0) return;

    const event: EngineEventBase<E> = {
      name,
      payload,
      createdAt: new Date().toISOString(),
    };

    for (const handler of this.handlers) {
      try {
        handler(event as EngineEvent);
      } catch {
        // Engine events are observational and must never affect gameplay.
      }
    }
  }
}

/**
 * Внутренний singleton Engine Events.
 * Не экспортируется из `@/engine`, чтобы не расширять публичный API Engine.
 */
export const engineEvents = new EngineEventPublisher();

export function emitEngineEvent<E extends EngineEventName>(
  name: E,
  payload: EngineEventMap[E],
): void {
  engineEvents.emit(name, payload);
}
