/**
 * Browser storage stubs so shared src/lib modules load inside Workers.
 * Must run before any `@/lib/*` import that touches localStorage.
 */
function makeMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(String(key)) ? map.get(String(key)) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
    key(i) {
      return [...map.keys()][i] ?? null;
    },
    get length() {
      return map.size;
    },
  };
}

export function installWorkerBrowserPolyfills() {
  const g = globalThis;
  if (typeof g.localStorage === "undefined") {
    g.localStorage = makeMemoryStorage();
  }
  if (typeof g.sessionStorage === "undefined") {
    g.sessionStorage = makeMemoryStorage();
  }
  if (typeof g.window === "undefined") {
    g.window = g;
  }
  if (typeof g.document === "undefined") {
    g.document = { createElement: () => ({}), getElementById: () => null };
  }
  if (typeof g.navigator === "undefined") {
    g.navigator = { userAgent: "Cloudflare-Worker" };
  }
}

// Side-effect install so `import "./polyfill.js"` runs before sibling game imports.
installWorkerBrowserPolyfills();
