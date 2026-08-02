/**
 * Verifies Blue Gel die renders the catalog face sprite (baked pips) above the fish tank.
 * Run: npm run build && node scripts/verify-blue-gel-face.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
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
    const imgs = [...document.querySelectorAll("img")].filter((img) =>
      (img.getAttribute("src") || "").includes(fragment)
    );
    const badRelative = imgs.filter((img) => {
      const src = img.getAttribute("src") || "";
      return src.startsWith("./") || src.startsWith("../");
    });
    const loaded = imgs.filter((img) => img.complete && img.naturalWidth > 0);
    return {
      imgCount: imgs.length,
      badRelative: badRelative.length,
      loadedCount: loaded.length,
      sampleSrc: imgs[0]?.getAttribute("src") || null,
    };
  }, SPRITE_FRAGMENT);

  if (result.imgCount < 1) {
    throw new Error("no Blue Gel face <img> with catalog sheet");
  }
  if (result.badRelative > 0) {
    throw new Error("face img uses relative asset URL (breaks on nested routes)");
  }
  if (result.loadedCount < 1) {
    throw new Error(`face sprite image did not load — src=${result.sampleSrc}`);
  }

  mkdirSync(join(ROOT, "artifacts"), { recursive: true });
  const previewDie = page.locator("button").filter({ has: page.locator(`img[src*="${SPRITE_FRAGMENT}"]`) }).first();
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
    console.log(`OK: ${result.loadedCount} loaded face sprite(s), src=${result.sampleSrc}`);
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
