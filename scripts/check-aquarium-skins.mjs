/**
 * Regression guard — Blue Gel / Snow Globe must never ship with sprite sheets.
 * Run after catalog edits: node scripts/check-aquarium-skins.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "src/lib/shopCatalog.js");
const source = readFileSync(catalogPath, "utf8");

const errors = [];

for (const skinId of ["blue_gel", "snow_globe"]) {
  const blockRe = new RegExp(
    `id:\\s*"${skinId}"[\\s\\S]*?(?=\\n\\s*\\{|\\n\\s*\\];)`,
    "m",
  );
  const block = source.match(blockRe)?.[0] ?? "";
  if (!block) {
    errors.push(`${skinId}: catalog entry not found`);
    continue;
  }
  if (/spriteUrl\s*:/.test(block)) {
    errors.push(`${skinId}: must not define spriteUrl in PRODUCTION_DICE_SKINS`);
  }
  if (/999d8760b_generated_image/.test(block)) {
    errors.push(`${skinId}: regressed to generic generated sprite sheet`);
  }
}

if (!source.includes("AQUARIUM_OVERLAY_SKIN_IDS")) {
  errors.push("AQUARIUM_OVERLAY_SKIN_IDS guard missing from shopCatalog.js");
}

if (errors.length) {
  console.error("Aquarium skin regression check failed:\n");
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

console.log("Aquarium skins OK (no sprite sheets on blue_gel / snow_globe).");
