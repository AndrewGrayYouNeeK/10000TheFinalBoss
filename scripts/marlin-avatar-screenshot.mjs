import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "scripts", ".screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

const positions = [42, 30, 25, 18];

async function analyzeVideo(page, videoLocator) {
  return videoLocator.evaluate((video) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return { error: "no dimensions", readyState: video.readyState };
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const style = getComputedStyle(video);
    const boxW = video.clientWidth;
    const boxH = video.clientHeight;

    // Parse object-position percentages
    const op = style.objectPosition.split(/\s+/);
    const ox = parseFloat(op[0]) / 100;
    const oy = parseFloat(op[1] ?? op[0]) / 100;

    // object-fit cover math: find visible source rect
    const scale = Math.max(boxW / w, boxH / h);
    const visW = boxW / scale;
    const visH = boxH / scale;
    let sx = ox * w - visW / 2;
    let sy = oy * h - visH / 2;
    sx = Math.max(0, Math.min(w - visW, sx));
    sy = Math.max(0, Math.min(h - visH, sy));

    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const x1 = Math.min(w, Math.ceil(sx + visW));
    const y1 = Math.min(h, Math.floor(sy + visH * 0.55));

    let sumX = 0;
    let sum = 0;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        const weight = lum * 0.6 + sat * 2;
        if (weight > 40) {
          sumX += x * weight;
          sum += weight;
        }
      }
    }
    const subjectX = sum > 0 ? sumX / sum : null;
    const subjectInVisible = subjectX != null ? (subjectX - sx) / visW : null;

    return {
      objectPosition: style.objectPosition,
      boxW,
      boxH,
      videoW: w,
      videoH: h,
      visibleSource: { sx, sy, visW, visH },
      subjectXInSource: subjectX,
      subjectXInVisibleFraction: subjectInVisible,
      headSide:
        subjectInVisible == null
          ? "unknown"
          : subjectInVisible < 0.42
            ? "left"
            : subjectInVisible > 0.58
              ? "right"
              : "center",
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const results = [];

for (const x of positions) {
  await page.goto("http://127.0.0.1:5173/video-assets", { waitUntil: "networkidle", timeout: 90000 });
  await page.evaluate((percent) => {
    localStorage.removeItem("dice10k_fisherman_avatar_loop_v5");
    localStorage.setItem(
      "dice10k_fisherman_avatar_loop_v5",
      JSON.stringify({ objectPositionXPercent: percent, objectPositionYPercent: 50, scale: 1 })
    );
  }, x);

  await page.reload({ waitUntil: "networkidle", timeout: 90000 });
  const marlin = page.locator('div.rounded-2xl.border').filter({ hasText: "Marlin Joe" });
  await marlin.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const video = marlin.locator("video").last();
  await video.waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(1200);
  try {
    await video.evaluate((v) => v.play());
  } catch {
    /* ignore */
  }
  await page.waitForFunction(
    (el) => el.readyState >= 2 && el.videoWidth > 0,
    await video.elementHandle(),
    { timeout: 15000 }
  ).catch(() => {});

  const analysis = await analyzeVideo(page, video);
  const box = await video.boundingBox();
  if (box) {
    await page.screenshot({
      path: path.join(OUT_DIR, `marlin-x${x}.png`),
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
  }
  results.push({ x, analysis });
  console.log(JSON.stringify({ x, analysis }, null, 0));
}

// Story fight panel at default load settings
await page.goto("http://127.0.0.1:5173/story/fisherman", { waitUntil: "networkidle", timeout: 90000 });
await page.evaluate(() => {
  localStorage.removeItem("dice10k_fisherman_avatar_loop_v5");
});
await page.reload({ waitUntil: "networkidle", timeout: 90000 });
const continueBtn = page.getByRole("button", { name: /continue|fight|start|let's/i }).first();
if (await continueBtn.count()) {
  await continueBtn.click({ timeout: 5000 }).catch(() => {});
}
await page.waitForTimeout(2500);
const loopVideo = page.locator(".absolute.inset-0.w-full.h-full").filter({ has: page.locator("video") }).locator("video").first();
if (!(await loopVideo.count())) {
  const anyVideo = page.locator("video").first();
  if (await anyVideo.count()) {
    const box = await anyVideo.boundingBox();
    if (box) {
      await page.screenshot({ path: path.join(OUT_DIR, "story-fight-video.png"), clip: box });
    }
  }
} else {
  await loopVideo.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  const box = await loopVideo.boundingBox();
  if (box) {
    await page.screenshot({ path: path.join(OUT_DIR, "story-fight-video.png"), clip: box });
  }
  const loaded = loadFishermanAvatarLoopSettings;
}

await browser.close();
fs.writeFileSync(path.join(OUT_DIR, "analysis.json"), JSON.stringify(results, null, 2));
console.log("done", OUT_DIR);
