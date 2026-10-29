type Handler<T> = (payload: T) => void

/** 极简事件总线，对应 Flutter 版 ICommunicationService。 */
export class Emitter<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {}

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const set = (this.handlers[event] ??= new Set())
    set.add(handler)
    return () => set.delete(handler)
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers[event]?.forEach((h) => h(payload))
  }
}

export const appEvents = new Emitter<{
  unauthorized: void
  notificationsChanged: void
  alarmChanged: string
}>()
