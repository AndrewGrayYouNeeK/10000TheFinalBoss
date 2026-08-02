/**
 * Verifies Blue Gel dice on the real /game route — face sprites + fish tank, no pip fallback.
 * Run: npm run build && node scripts/verify-blue-gel-gameplay.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.VERIFY_PORT || 4192);
const BASE = `http://127.0.0.1:${PORT}`;
const SPRITE_FRAGMENT = "999d8760b_generated_image";
const PROFILE_KEY = "dice10k_profile";
const PLAYERS_KEY = "dice10k_players";
const SKINS_KEY = "dice10k_player_skins";

async function startPreview() {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error("Run npm run build first");
  }
  const proc = spawn("npx", ["vite", "preview", "--port", String(PORT), "--host", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) break;
    } catch {
      /* wait */
    }
    await sleep(500);
  }
  return proc;
}

async function seedStorage(page) {
  await page.evaluate(
    ({ profileKey, playersKey, skinsKey, profile }) => {
      localStorage.setItem(profileKey, JSON.stringify(profile));
      sessionStorage.setItem(playersKey, JSON.stringify(["You"]));
      sessionStorage.setItem(skinsKey, JSON.stringify(["blue_gel"]));
    },
    {
      profileKey: PROFILE_KEY,
      playersKey: PLAYERS_KEY,
      skinsKey: SKINS_KEY,
      profile: {
        email: "local@player",
        full_name: "Player",
        coins: 5000,
        xp: 0,
        games_finished: 0,
        wins: 0,
        intro_seen: true,
        owned_skins: ["classic_white", "blue_gel"],
        owned_badges: [],
        owned_felts: ["classic_green", "matrix_rain"],
        equipped_skin: "blue_gel",
        ghost_disguise: null,
        equipped_badge: "",
        equipped_felt: "classic_green",
        equipped_powers: [],
        bosses_defeated: [],
        story_active_boss: null,
        held_dice_style: "amber_glow",
        sfx_muted: true,
        opponent_sfx_muted: true,
        sprite_tuning: {},
        felt_tuning: {},
        video_uploads: {},
        skin_levels: {},
        skin_level_xp: {},
        online_visibility: { hideDice: true },
      },
    }
  );
}

async function auditTray(page) {
  return page.evaluate((fragment) => {
    const tray = document.querySelector("#gameplay-dice-tray");
    if (!tray) {
      return { ok: false, error: "missing #gameplay-dice-tray" };
    }
    const faceImgs = [...tray.querySelectorAll("img")].filter((img) =>
      (img.getAttribute("src") || "").includes(fragment)
    );
    const loadedFaces = faceImgs.filter((img) => img.complete && img.naturalWidth > 0);
    const badRelative = faceImgs.filter((img) => {
      const src = img.getAttribute("src") || "";
      return src.startsWith("./") || src.startsWith("../");
    });
    const pipGrids = tray.querySelectorAll("button .grid.grid-cols-3.grid-rows-3");
    const dieButtons = tray.querySelectorAll("button");
    return {
      ok: true,
      dieCount: dieButtons.length,
      faceImgCount: faceImgs.length,
      loadedFaceCount: loadedFaces.length,
      badRelative: badRelative.length,
      pipGridCount: pipGrids.length,
      sampleSrc: faceImgs[0]?.getAttribute("src") || null,
    };
  }, SPRITE_FRAGMENT);
}

async function main() {
  const preview = await startPreview();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
    await seedStorage(page);
    await page.goto(`${BASE}/game`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("#gameplay-dice-tray", { timeout: 15000 });
    await sleep(1500);

    let audit = await auditTray(page);
    if (!audit.ok) throw new Error(audit.error);
    if (audit.dieCount !== 6) {
      throw new Error(`expected 6 dice, got ${audit.dieCount}`);
    }
    if (audit.faceImgCount !== 6) {
      throw new Error(`expected 6 face sprites, got ${audit.faceImgCount}`);
    }
    if (audit.loadedFaceCount !== 6) {
      throw new Error(`expected 6 loaded face sprites, got ${audit.loadedFaceCount} — src=${audit.sampleSrc}`);
    }
    if (audit.badRelative > 0) {
      throw new Error("face img uses relative asset URL (breaks on /game route)");
    }
    if (audit.pipGridCount > 0) {
      throw new Error(`expected 0 pip fallback grids, got ${audit.pipGridCount}`);
    }

    mkdirSync(join(ROOT, "artifacts"), { recursive: true });
    await page.locator("#gameplay-dice-tray").screenshot({
      path: join(ROOT, "artifacts/blue-gel-gameplay-verify.png"),
    });

    const rollBtn = page.getByRole("button", { name: /roll dice/i });
    if (await rollBtn.isVisible().catch(() => false)) {
      await rollBtn.click();
      await sleep(1200);
      audit = await auditTray(page);
      if (!audit.ok) throw new Error(audit.error);
      if (audit.faceImgCount !== 6 || audit.loadedFaceCount !== 6) {
        throw new Error(
          `after roll: expected 6 loaded faces, got ${audit.loadedFaceCount}/${audit.faceImgCount}`
        );
      }
      if (audit.pipGridCount > 0) {
        throw new Error(`after roll: pip fallback appeared (${audit.pipGridCount} grids)`);
      }
      await page.locator("#gameplay-dice-tray").screenshot({
        path: join(ROOT, "artifacts/blue-gel-gameplay-after-roll.png"),
      });
    }

    console.log(`OK: ${audit.loadedFaceCount} Blue Gel face sprites on /game, 0 pip grids`);
    console.log("Screenshots: artifacts/blue-gel-gameplay-verify.png");
  } finally {
    await browser.close();
    preview.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
});
