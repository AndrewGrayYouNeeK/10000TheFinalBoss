/**
 * Import a clean 3×2 ice cube sheet (JPEG/PNG on black) into production assets:
 *   - ice_power_frozen.png (+ alpha)
 *   - ice_power_frozen_outline.png / _drips.png (derived silhouettes)
 * then runs split-ice-power-faces.mjs.
 *
 * Usage:
 *   node scripts/import-ice-power-sheet.mjs [path-to-sheet]
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "public", "assets");

const SRC =
  process.argv[2] ||
  path.join(
    process.env.HOME || "",
    ".cursor/projects/Users-andrewgray-Desktop-my-app-code-10000TheFinalBoss/assets/grDCveZAO9shzc5DCxQDg_fWkUG7Nj-5a01f718-cb5e-4e96-b612-f4bc42a0291a.png"
  );

const BLACK_T = 22;
const TARGET_W = 1024;

if (!fs.existsSync(SRC)) {
  console.error("Source sheet not found:", SRC);
  process.exit(1);
}

const frozenPath = path.join(ASSETS, "ice_power_frozen.png");
const bakPath = path.join(ASSETS, "ice_power_frozen_prev.png");
if (fs.existsSync(frozenPath) && !fs.existsSync(bakPath)) {
  fs.copyFileSync(frozenPath, bakPath);
  console.log("Backed up previous frozen sheet → ice_power_frozen_prev.png");
}

const raw = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = raw.info;
const src = raw.data;

let minX = width;
let minY = height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const i = (y * width + x) * 4;
    const luma = 0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2];
    if (luma > BLACK_T) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}
const margin = 8;
minX = Math.max(0, minX - margin);
minY = Math.max(0, minY - margin);
maxX = Math.min(width - 1, maxX + margin);
maxY = Math.min(height - 1, maxY + margin);
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
console.log("crop", { minX, minY, cropW, cropH });

const cropped = Buffer.alloc(cropW * cropH * 4, 0);
for (let y = 0; y < cropH; y += 1) {
  for (let x = 0; x < cropW; x += 1) {
    const si = ((minY + y) * width + (minX + x)) * 4;
    const di = (y * cropW + x) * 4;
    const r = src[si];
    const g = src[si + 1];
    const b = src[si + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luma <= BLACK_T) continue;
    const a = Math.min(255, Math.round(((luma - BLACK_T) / (80 - BLACK_T)) * 255));
    cropped[di] = r;
    cropped[di + 1] = g;
    cropped[di + 2] = b;
    cropped[di + 3] = Math.max(a, luma > BLACK_T + 8 ? 255 : a);
  }
}

const outW = TARGET_W;
const outH = Math.round(cropH * (TARGET_W / cropW));
console.log("upscale", outW, "x", outH);

const frozenBuf = await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
  .resize(outW, outH, { kernel: "lanczos3" })
  .png()
  .toBuffer();
await sharp(frozenBuf).toFile(frozenPath);
await sharp(frozenBuf).toFile(path.join(ASSETS, "ice_power_frozen_source_clean.png"));
console.log("Wrote", frozenPath);

const fr = await sharp(frozenBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const fw = fr.info.width;
const fh = fr.info.height;
const fd = fr.data;

const outline = Buffer.alloc(fw * fh * 4, 0);
const alpha = new Uint8Array(fw * fh);
for (let i = 0; i < fw * fh; i += 1) {
  const a = fd[i * 4 + 3];
  alpha[i] = a;
  if (a >= 40) {
    outline[i * 4] = 255;
    outline[i * 4 + 1] = 255;
    outline[i * 4 + 2] = 255;
    outline[i * 4 + 3] = 255;
  } else if (a > 0) {
    outline[i * 4] = 255;
    outline[i * 4 + 1] = 255;
    outline[i * 4 + 2] = 255;
    outline[i * 4 + 3] = a;
  }
}

const ERODE = 5;
const core = new Uint8Array(fw * fh);
for (let y = 0; y < fh; y += 1) {
  for (let x = 0; x < fw; x += 1) {
    const idx = y * fw + x;
    if (alpha[idx] < 40) continue;
    let ok = true;
    for (let dy = -ERODE; dy <= ERODE && ok; dy += 1) {
      for (let dx = -ERODE; dx <= ERODE && ok; dx += 1) {
        if (dx * dx + dy * dy > ERODE * ERODE) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= fw || ny >= fh || alpha[ny * fw + nx] < 40) ok = false;
      }
    }
    if (ok) core[idx] = 1;
  }
}

const DILATE = 3;
const body = new Uint8Array(fw * fh);
for (let y = 0; y < fh; y += 1) {
  for (let x = 0; x < fw; x += 1) {
    if (!core[y * fw + x]) continue;
    for (let dy = -DILATE; dy <= DILATE; dy += 1) {
      for (let dx = -DILATE; dx <= DILATE; dx += 1) {
        if (dx * dx + dy * dy > DILATE * DILATE) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= fw || ny >= fh) continue;
        if (alpha[ny * fw + nx] >= 40) body[ny * fw + nx] = 1;
      }
    }
  }
}

const drips = Buffer.alloc(fw * fh * 4, 0);
let dripCount = 0;
for (let i = 0; i < fw * fh; i += 1) {
  if (alpha[i] < 40 || body[i]) continue;
  drips[i * 4] = 255;
  drips[i * 4 + 1] = 255;
  drips[i * 4 + 2] = 255;
  drips[i * 4 + 3] = 255;
  dripCount += 1;
}
console.log("drip pixels", dripCount);

for (const name of ["ice_power_frozen_outline.png", "ice_power_frozen_outline_drips.png"]) {
  const p = path.join(ASSETS, name);
  const bak = path.join(ASSETS, name.replace(".png", "_prev.png"));
  if (fs.existsSync(p) && !fs.existsSync(bak)) fs.copyFileSync(p, bak);
}

await sharp(outline, { raw: { width: fw, height: fh, channels: 4 } })
  .png()
  .toFile(path.join(ASSETS, "ice_power_frozen_outline.png"));
await sharp(drips, { raw: { width: fw, height: fh, channels: 4 } })
  .png()
  .toFile(path.join(ASSETS, "ice_power_frozen_outline_drips.png"));
console.log("Wrote outline + drips masks", fw, "x", fh);

const split = spawnSync("node", [path.join(ROOT, "scripts", "split-ice-power-faces.mjs")], {
  cwd: ROOT,
  encoding: "utf8",
});
process.stdout.write(split.stdout || "");
if (split.status !== 0) {
  process.stderr.write(split.stderr || "");
  process.exit(split.status || 1);
}
console.log("Import complete. Update ICE_FACE_PAD_FRAC from ice_power_face_meta.json if padFrac changed.");
