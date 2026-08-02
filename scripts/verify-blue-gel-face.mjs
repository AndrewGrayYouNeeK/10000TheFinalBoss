/**
 * Verifies Blue Gel uses the original live aquarium and stable pip grid.
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
    const aquarium = document.querySelector("[data-fish-overlay]");
    const die = aquarium?.closest("button");
    const generatedImgs = [...(die?.querySelectorAll("img") ?? [])].filter((img) =>
      (img.getAttribute("src") || "").includes(fragment)
    );
    return {
      aquariumCount: die?.querySelectorAll("[data-fish-overlay]").length ?? 0,
      fishSvgCount: die?.querySelectorAll("[data-fish-overlay] svg").length ?? 0,
      pipGridCount: die?.querySelectorAll("[data-die-pip-grid]").length ?? 0,
      generatedImgCount: generatedImgs.length,
    };
  }, SPRITE_FRAGMENT);

  if (result.aquariumCount < 1 || result.fishSvgCount < 1) {
    throw new Error("Blue Gel original swimming-fish aquarium is missing");
  }
  if (result.pipGridCount !== 1) {
    throw new Error(`expected one stable pip grid, found ${result.pipGridCount}`);
  }
  if (result.generatedImgCount > 0) {
    throw new Error("opaque generated face image still covers the swimming fish");
  }

  mkdirSync(join(ROOT, "artifacts"), { recursive: true });
  const previewDie = page.locator("button").filter({ has: page.locator("[data-fish-overlay]") }).first();
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
      `OK: ${result.fishSvgCount} live fish, ${result.pipGridCount} pip grid, no opaque face sprite`
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
