/** Resolve public asset paths for Vite + Capacitor (base is `./`). */
export function assetUrl(path) {
  if (!path || path.startsWith("http") || path.startsWith("data:")) return path;
  const clean = path.replace(/^\//, "");
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${clean}`;
}
