/**
 * Verifies Angelfish renders the live fish overlay and Aquamarine shell above
 * the tank instead of the retired baked face sprite.
 * Run: npm run build && node scripts/verify-blue-gel-face.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const PORT = 4190;
const SPRITE_FRAGMENT = "999d8760b_generated_image";

async function startPreview() {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error("Run npm run build first");
  }
  const proc = spawn("npx", ["vite", "preview", "--port", String(PORT), "--host", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  await sleep(2500);
  return proc;
}

async function openSpriteLab(page) {
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => history.pushState({}, "", "/sprite-lab/blue_gel"));
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent("popstate")));
  await sleep(3000);
}

async function verifyBlueGelFaces(page) {
  const result = await page.evaluate((fragment) => {
    const oldSpriteImgs = [...document.querySelectorAll("img")].filter((img) =>
      (img.getAttribute("src") || "").includes(fragment)
    );
    const badRelative = oldSpriteImgs.filter((img) => {
      const src = img.getAttribute("src") || "";
      return src.startsWith("./") || src.startsWith("../");
    });
    return {
      oldSpriteCount: oldSpriteImgs.length,
      badRelative: badRelative.length,
      fishOverlayCount: document.querySelectorAll('[data-fish-overlay="aquarium"]').length,
      angelfishBarCount: [...document.querySelectorAll("path")].filter(
        (path) => path.getAttribute("d") === "M 25 9 L 29 9 L 29 31 L 25 31 Z"
      ).length,
    };
  }, SPRITE_FRAGMENT);

  if (result.oldSpriteCount > 0) {
    throw new Error("retired baked Angelfish face sprite is still rendering");
  }
  if (result.badRelative > 0) {
    throw new Error("face img uses relative asset URL (breaks on nested routes)");
  }
  if (result.fishOverlayCount < 1) {
    throw new Error("no live Angelfish fish overlay rendered");
  }
  if (result.angelfishBarCount < 1) {
    throw new Error("no angular Angelfish stripe bars rendered");
  }

  mkdirSync(join(ROOT, "artifacts"), { recursive: true });
  const previewDie = page.locator('[data-fish-overlay="aquarium"]').first();
  await previewDie.screenshot({ path: join(ROOT, "artifacts/blue-gel-die-verify.png") });

  return result;
}

async function main() {
  const preview = await startPreview();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await openSpriteLab(page);
    const result = await verifyBlueGelFaces(page);
    console.log(
      `OK: ${result.fishOverlayCount} live fish overlay(s), ${result.angelfishBarCount} angular bar(s)`
    );
    console.log("Screenshot: artifacts/blue-gel-die-verify.png");
  } finally {
    await browser.close();
    preview.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("FAIL:", err.message || err);
  process.exit(1);
});
