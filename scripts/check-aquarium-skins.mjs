/**
 * Regression guard — aquarium skins must render through the Die overlays.
 * Angelfish may retain its catalog sprite URL as metadata, but runtime code
 * must strip it so the old baked face sheet cannot cover the live fish.
 * Run after catalog edits: node scripts/check-aquarium-skins.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "src/lib/shopCatalog.js");
const source = readFileSync(catalogPath, "utf8");

const errors = [];

/** Skins whose faces are owned by live aquarium overlays (not baked sheets). */
const AQUARIUM_SKINS = ["blue_gel", "shark_gel", "snow_globe"];

for (const skinId of AQUARIUM_SKINS) {
  const blockRe = new RegExp(
    `id:\\s*"${skinId}"[\\s\\S]*?(?=\\n\\s*\\{|\\n\\s*\\];)`,
    "m",
  );
  const block = source.match(blockRe)?.[0] ?? "";
  if (!block) {
    errors.push(`${skinId}: catalog entry not found`);
    continue;
  }
  // Only Angelfish keeps a legacy spriteUrl as catalog metadata.
  if (skinId === "blue_gel") {
    if (!/spriteUrl\s*:/.test(block)) {
      errors.push(`${skinId}: Angelfish catalog metadata is missing spriteUrl`);
    }
  } else if (/spriteUrl\s*:/.test(block)) {
    errors.push(`${skinId}: must not define spriteUrl in PRODUCTION_DICE_SKINS`);
  }
}

if (!source.includes("AQUARIUM_OVERLAY_SKIN_IDS")) {
  errors.push("AQUARIUM_OVERLAY_SKIN_IDS guard missing from shopCatalog.js");
}

for (const skinId of AQUARIUM_SKINS) {
  // Confirm membership in the Set constructor args, not just any string literal.
  const setMatch = source.match(
    /AQUARIUM_OVERLAY_SKIN_IDS\s*=\s*new Set\(\[([^\]]*)\]\)/,
  );
  const setBody = setMatch?.[1] ?? "";
  if (!setBody.includes(`"${skinId}"`)) {
    errors.push(`${skinId}: missing from AQUARIUM_OVERLAY_SKIN_IDS`);
  }
}

if (errors.length) {
  console.error("Aquarium skin regression check failed:\n");
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log(
  "Aquarium skins OK (runtime overlays own blue_gel / shark_gel / snow_globe faces).",
);
