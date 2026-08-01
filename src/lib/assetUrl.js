/** Resolve public asset paths for Vite + Capacitor (base is `./`). */
export function assetUrl(path) {
  if (!path || path.startsWith("http") || path.startsWith("data:")) return path;
  const clean = path.replace(/^\//, "");

  if (typeof window === "undefined") {
    const base = import.meta.env.BASE_URL || "/";
    return `${base}${clean}`;
  }

  // Resolve from the document base URI so nested client routes (/game, /sprite-lab/…)
  // do not turn `./assets/…` into `/route/assets/…` 404s.
  try {
    return new URL(clean, document.baseURI).pathname;
  } catch {
    return `/${clean}`;
  }
}
