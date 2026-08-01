/** Resolve public asset paths for Vite + Capacitor (base is `./`). */
export function assetUrl(path) {
  if (!path || path.startsWith("http") || path.startsWith("data:")) return path;
  const clean = path.replace(/^\//, "");
  const base = import.meta.env.BASE_URL || "/";

  // Relative base (`./`) breaks on nested client routes (e.g. `/game`, `/sprite-lab/blue_gel`)
  // because the browser resolves `./assets/...` against the current pathname.
  if (base === "./" || base === ".") {
    if (typeof window !== "undefined") {
      const proto = window.location?.protocol || "";
      if (proto === "file:") {
        return `${base}${clean}`;
      }
    }
    return `/${clean}`;
  }

  return `${base}${clean}`;
}
