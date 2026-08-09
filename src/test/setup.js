// Minimal browser storage shims so localStorage/sessionStorage-backed lib
// modules can be unit tested without a full DOM environment.
import { beforeEach } from 'vitest'

function createStorage() {
  const store = new Map()
  return {
    get length() {
      return store.size
    },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => { store.set(String(k), String(v)) },
    removeItem: (k) => { store.delete(String(k)) },
    clear: () => { store.clear() },
  }
}

function installStorage() {
  globalThis.localStorage = createStorage()
  globalThis.sessionStorage = createStorage()
}

installStorage()

if (!globalThis.window) {
  globalThis.window = globalThis
}
if (!globalThis.window.location) {
  globalThis.window.location = { origin: 'http://localhost:5173' }
}

beforeEach(() => {
  installStorage()
})
