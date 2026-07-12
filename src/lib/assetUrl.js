/** Resolve public asset paths for Vite + Capacitor (base is `./`). */
export function assetUrl(path) {
  if (!path || path.startsWith("http") || path.startsWith("data:")) return path;
  const clean = path.replace(/^\//, "");
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${clean}`;
}

/** Returns true when a media file is reachable (used before story cutscenes). */
export async function mediaExists(path) {
  if (!path) return false;
  try {
    const res = await fetch(assetUrl(path), { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
