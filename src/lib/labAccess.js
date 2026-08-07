/**
 * Dev labs (sprite / felt / ice / shark-bite / video assets) stay private forever —
 * not a pre-launch-only hide. Only allowlisted account emails can open them in production.
 *
 * Set in .env.local and Cloudflare Pages:
 *   VITE_LAB_ADMIN_EMAILS=you@email.com
 * Comma-separate for multiple.
 *
 * Local Vite `npm run dev` always allows labs so you can work offline without signing in.
 */

export function getLabAdminEmails() {
  const raw = import.meta.env.VITE_LAB_ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {{ email?: string } | null | undefined} user - Supabase auth user
 */
export function canAccessLabs(user) {
  if (import.meta.env.DEV) return true;
  const emails = getLabAdminEmails();
  if (!emails.length) return false;
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  return Boolean(email && emails.includes(email));
}

export const LAB_PATH_PREFIXES = [
  "/labs",
  "/sprite-lab",
  "/felt-lab",
  "/ice-lab",
  "/frosty-lab",
  "/shark-bite-lab",
  "/shark-lab",
  "/shark-tank-lab",
  "/shark-tank",
  "/video-assets",
  "/fish-showcase",
  "/preview-dice",
  "/held-style",
  "/soundwave-mic",
  "/ragnarok-sprites",
];

export function isLabPath(pathname = "") {
  return LAB_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
