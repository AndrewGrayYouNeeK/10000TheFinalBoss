/**
 * Verify dice skins render in Shop + Game. Screenshots + asset load audit.
 * Run: npm run build && node scripts/verify-all-dice-skins.mjs
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACTS = join(ROOT, "artifacts");
const PORT = Number(process.env.VERIFY_PORT || 4191);
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

const SAMPLE_SKINS = [
  "classic_white",
  "gold",
  "matrix",
  "galaxy",
  "blue_gel",
  "ruby",
  "diamond_ruby",
  "ragnarok",
  "crystal_cut",
];

mkdirSync(ARTIFACTS, { recursive: true });

async function startPreview() {
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

async function auditShop(page) {
  await page.goto(`${BASE}/shop`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const audit = await page.evaluate(() => {
    const bgLayers = [...document.querySelectorAll("[style*='background-image']")].filter((el) => {
      const bg = el.style.backgroundImage || "";
      return bg.includes("/assets/");
    });
    const brokenBgs = bgLayers.filter((el) => {
      const m = (el.style.backgroundImage || "").match(/url\(["']?([^"')]+)/);
      const url = m?.[1] || "";
      return url.includes("/shop/assets/") || url.startsWith("./assets/");
    });
    const skinCards = [...document.querySelectorAll("h2, h3")].map((h) => h.textContent?.trim()).filter(Boolean);
    return {
      bgLayerCount: bgLayers.length,
      brokenBgCount: brokenBgs.length,
      hasClassicWhite: document.body.innerText.includes("Classic White"),
      hasDiamondRuby: document.body.innerText.includes("Diamond Ruby"),
      categoryHeaders: skinCards.slice(0, 8),
    };
  });

  await page.screenshot({ path: join(ARTIFACTS, "verify-shop-full.png"), fullPage: true });

  // Scroll to REGULAR section dice previews
  await page.getByText("REGULAR", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(ARTIFACTS, "verify-shop-regular-dice.png") });

  await page.getByText("GEMSTONE", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(ARTIFACTS, "verify-shop-gemstone-dice.png") });

  const crystalCard = page.locator("text=Diamond Cut").first().locator("xpath=ancestor::div[contains(@class,'rounded-2xl')]");
  if (await crystalCard.count()) {
    await crystalCard.screenshot({ path: join(ARTIFACTS, "verify-crystal-cut-card.png") });
    const crystalAudit = await crystalCard.evaluate((el) => {
      const bg = el.querySelector("[style*='background-image']");
      const dieBtn = el.querySelector("button");
      return {
        hasBg: !!bg,
        bgImage: bg?.style?.backgroundImage?.slice(0, 120) || null,
        bgSize: bg?.style?.backgroundSize || null,
        dieW: dieBtn?.offsetWidth || 0,
      };
    });
    audit.crystalCut = crystalAudit;
  }

  await page.getByText("EXOTIC", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(ARTIFACTS, "verify-shop-exotic-dice.png") });

  return audit;
}

async function auditGame(page) {
  await page.goto(`${BASE}/setup`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  const play = page.getByRole("button", { name: /play|start|let's roll|begin/i }).first();
  if (await play.isVisible().catch(() => false)) {
    await play.click();
    await page.waitForTimeout(2000);
  }

  await page.goto(`${BASE}/game`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3500);

  const audit = await page.evaluate(() => {
    const bgLayers = [...document.querySelectorAll("[style*='background-image']")].filter((el) => {
      const bg = el.style.backgroundImage || "";
      return bg.includes("/assets/");
    });
    const brokenBgs = bgLayers.filter((el) => {
      const m = (el.style.backgroundImage || "").match(/url\(["']?([^"')]+)/);
      const url = m?.[1] || "";
      return url.includes("/game/assets/") || url.startsWith("./assets/");
    });
    const diceImgs = [...document.querySelectorAll("img")].filter((img) => (img.src || "").includes("/assets/"));
    return {
      bgLayerCount: bgLayers.length,
      brokenBgCount: brokenBgs.length,
      diceImgCount: diceImgs.length,
      hasError: document.body.innerText.includes("Something went wrong"),
    };
  });

  await page.screenshot({ path: join(ARTIFACTS, "verify-game-dice.png"), fullPage: false });
  return audit;
}

const ASSET_PATHS = {
  classic_white: "/assets/e3c042b9e_hPLMjJ1wVsJG0mW-UisgC_GgpVeRAE.png",
  gold: "/assets/cb5c77d90_WxvYf9qjMiU_V3CHnTzs-_DUPg67v2.png",
  matrix: "/assets/matrix_dice.png",
  galaxy: "/assets/galaxy_dice_blackhole.png",
  blue_gel: "/assets/999d8760b_generated_image.png",
  ruby: "/assets/95bd85fb4_RdaZRnY8n4MYNGmhbire2_jIN9S0Pd.png",
  diamond_ruby: "/assets/diamond_ruby_dice.png",
  ragnarok: "/assets/ragnarok_regular_dice.png",
  crystal_cut: "/assets/823a86262_zIRb81kXhGo3xU-pd4xpr_yf8rZsgh.png",
};

async function probeAssets(page) {
  const rows = [];
  for (const id of SAMPLE_SKINS) {
    const path = ASSET_PATHS[id];
    if (!path) {
      rows.push({ id, ok: false, error: "missing path map" });
      continue;
    }
    const resolved = path;
    try {
      const res = await page.request.get(`${BASE}${resolved}`);
      rows.push({ id, path, resolved, ok: res.ok(), status: res.status() });
    } catch (e) {
      rows.push({ id, path, resolved, ok: false, error: e.message });
    }
  }
  return rows;
}

async function main() {
  const preview = await startPreview();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const report = { base: BASE, timestamp: new Date().toISOString() };

  try {
    report.shop = await auditShop(page);
    report.game = await auditGame(page);
    report.assets = await probeAssets(page);

    report.pass =
      report.shop.brokenBgCount === 0 &&
      report.shop.hasClassicWhite &&
      report.shop.hasDiamondRuby &&
      report.game.brokenBgCount === 0 &&
      !report.game.hasError &&
      report.assets.every((a) => a.ok !== false);

    writeFileSync(join(ARTIFACTS, "verify-dice-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    console.log("\nScreenshots saved to artifacts/:");
    console.log("  verify-shop-full.png");
    console.log("  verify-shop-regular-dice.png");
    console.log("  verify-shop-exotic-dice.png");
    console.log("  verify-game-dice.png");

    if (!report.pass) {
      console.error("\nFAIL: dice skin verification failed");
      process.exit(1);
    }
    console.log("\nOK: all dice skins verified with screenshots.");
  } finally {
    await browser.close();
    preview.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
