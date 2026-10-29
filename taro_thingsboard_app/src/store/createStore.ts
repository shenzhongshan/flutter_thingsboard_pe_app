import { useSyncExternalStore } from 'react'

/** 轻量全局状态容器（替代 Flutter 版的 Riverpod provider）。 */
export function createStore<S>(initial: S) {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(partial: Partial<S> | ((s: S) => Partial<S>)) {
      const next = typeof partial === 'function' ? (partial as (s: S) => Partial<S>)(state) : partial
      state = { ...state, ...next }
      listeners.forEach((l) => l())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    use<T>(selector: (s: S) => T): T {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useSyncExternalStore(
        this.subscribe,
        () => selector(state),
        () => selector(state)
      )
    }
  }
}
