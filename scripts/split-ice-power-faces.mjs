/**
 * Split ice power 3×2 sheets into 6 isolated per-face PNGs.
 *
 * Ownership: multi-source BFS from each cell center on the outline silhouette
 * (competing watershed) so touching neighbors divide cleanly.
 *
 * Placement: each face's ice BODY (dense core, not drip crumbs) is CENTERED and
 * uniformly SCALED so it fully covers a shared content square. Drips may extend
 * into the pad ring. Watershed cuts make some bodies narrower than tall — without
 * scale-to-cover, those faces only paint ~75% of the die and look one-side cut off.
 *
 * Usage: node scripts/split-ice-power-faces.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "public", "assets");

const COLS = 3;
const ROWS = 2;
/**
 * Pad around the content square as a fraction of contentSize.
 * Must fit drip overhang + scale-to-cover expansion of the longer body axis.
 */
const CONTENT_PAD_FRAC = 0.28;
/** Final canvas is square — side = contentSize * (1 + 2 * CONTENT_PAD_FRAC). */
const ALPHA_KEEP = 10;
const BODY_ALPHA = 40;
const SILHOUETTE_T = 40;

const OUTLINE_SHEET = "ice_power_frozen_outline.png";

const SHEETS = [
  { in: "ice_power_frozen.png", outPrefix: "ice_power_frozen_face" },
  { in: "ice_power_frozen_outline.png", outPrefix: "ice_power_frozen_outline_face" },
  { in: "ice_power_frozen_outline_drips.png", outPrefix: "ice_power_frozen_outline_drips_face" },
];

async function loadRgba(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function isSilhouettePixel(data, i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < SILHOUETTE_T) return false;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma >= SILHOUETTE_T || a >= 200;
}

function buildOwnership(outline, width, height) {
  const cellW = width / COLS;
  const cellH = height / ROWS;
  const owner = new Int8Array(width * height);
  const queue = new Int32Array(width * height);
  let qh = 0;
  let qt = 0;

  const seeds = [];
  for (let face = 1; face <= 6; face += 1) {
    const col = (face - 1) % COLS;
    const row = Math.floor((face - 1) / COLS);
    let cx = Math.floor((col + 0.5) * cellW);
    let cy = Math.floor((row + 0.5) * cellH);
    const x0 = Math.floor(col * cellW);
    const y0 = Math.floor(row * cellH);
    const x1 = Math.floor((col + 1) * cellW);
    const y1 = Math.floor((row + 1) * cellH);

    if (!isSilhouettePixel(outline, (cy * width + cx) * 4)) {
      let found = false;
      for (let rad = 1; rad < Math.max(cellW, cellH) && !found; rad += 1) {
        for (let dy = -rad; dy <= rad && !found; dy += 1) {
          for (let dx = -rad; dx <= rad && !found; dx += 1) {
            if (Math.abs(dx) !== rad && Math.abs(dy) !== rad) continue;
            const x = cx + dx;
            const y = cy + dy;
            if (x < x0 || y < y0 || x >= x1 || y >= y1) continue;
            if (isSilhouettePixel(outline, (y * width + x) * 4)) {
              cx = x;
              cy = y;
              found = true;
            }
          }
        }
      }
    }
    seeds.push({ face, cx, cy });
    const idx = cy * width + cx;
    if (owner[idx] === 0 && isSilhouettePixel(outline, idx * 4)) {
      owner[idx] = face;
      queue[qt++] = idx;
    }
  }

  const N4 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  while (qh < qt) {
    const idx = queue[qh++];
    const face = owner[idx];
    const x = idx % width;
    const y = (idx - x) / width;
    for (const [dx, dy] of N4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nidx = ny * width + nx;
      if (owner[nidx] !== 0) continue;
      if (!isSilhouettePixel(outline, nidx * 4)) continue;
      owner[nidx] = face;
      queue[qt++] = nidx;
    }
  }

  const centers = seeds.map((s) => ({ face: s.face, x: s.cx, y: s.cy }));

  function nearestFace(x, y) {
    let best = 1;
    let bestD = Infinity;
    for (const c of centers) {
      const dx = x - c.x;
      const dy = y - c.y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = c.face;
      }
    }
    const R = 48;
    let localBest = 0;
    let localD = Infinity;
    const x0 = Math.max(0, Math.floor(x - R));
    const x1 = Math.min(width - 1, Math.ceil(x + R));
    const y0 = Math.max(0, Math.floor(y - R));
    const y1 = Math.min(height - 1, Math.ceil(y + R));
    for (let yy = y0; yy <= y1; yy += 2) {
      for (let xx = x0; xx <= x1; xx += 2) {
        const f = owner[yy * width + xx];
        if (f <= 0) continue;
        const dx = x - xx;
        const dy = y - yy;
        const d = dx * dx + dy * dy;
        if (d < localD) {
          localD = d;
          localBest = f;
        }
      }
    }
    return localBest || best;
  }

  return { owner, nearestFace, cellW, cellH };
}

function collectFaceOpaque(owner, frozenData, face) {
  const indices = [];
  for (let i = 0; i < owner.length; i += 1) {
    if (owner[i] !== face) continue;
    if (frozenData[i * 4 + 3] < ALPHA_KEEP) continue;
    indices.push(i);
  }
  return indices;
}

function connectedComponents(indices, owner, frozenData, face, width, height) {
  const seen = new Uint8Array(owner.length);
  const comps = [];
  for (const start of indices) {
    if (seen[start]) continue;
    const q = [start];
    seen[start] = 1;
    const members = [];
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    while (q.length) {
      const idx = q.pop();
      members.push(idx);
      const x = idx % width;
      const y = (idx - x) / width;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nidx = ny * width + nx;
        if (seen[nidx] || owner[nidx] !== face) continue;
        if (frozenData[nidx * 4 + 3] < ALPHA_KEEP) continue;
        seen[nidx] = 1;
        q.push(nidx);
      }
    }
    comps.push({ members, n: members.length, minX, minY, maxX, maxY });
  }
  comps.sort((a, b) => b.n - a.n);
  return comps;
}

/**
 * Drop neighbor-edge fragments:
 * 1) Morphological opening (erode→largest→dilate) breaks thin necks to side strips
 * 2) Keep largest remaining blob + small nearby drip crumbs
 */
function pruneNeighborStrips(owner, frozenData, width, height) {
  const DROP_MIN = 250;
  const DRIP_MAX = 250;
  const NEAR_PX = 14;
  const ERODE = 3;

  for (let face = 1; face <= 6; face += 1) {
    const indices = collectFaceOpaque(owner, frozenData, face);
    if (indices.length === 0) continue;

    const mask = new Uint8Array(owner.length);
    for (const idx of indices) mask[idx] = 1;

    // Erode to break thin bridges to neighbor strips
    const eroded = new Uint8Array(owner.length);
    for (const idx of indices) {
      const x = idx % width;
      const y = (idx - x) / width;
      let ok = true;
      for (let dy = -ERODE; dy <= ERODE && ok; dy += 1) {
        for (let dx = -ERODE; dx <= ERODE && ok; dx += 1) {
          if (dx * dx + dy * dy > ERODE * ERODE) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            ok = false;
            break;
          }
          if (!mask[ny * width + nx]) ok = false;
        }
      }
      if (ok) eroded[idx] = 1;
    }

    const erodedIdx = [];
    for (let i = 0; i < eroded.length; i += 1) if (eroded[i]) erodedIdx.push(i);
    if (erodedIdx.length === 0) {
      // fallback: no erode
      for (const idx of indices) eroded[idx] = 1;
      erodedIdx.push(...indices);
    }

    // Largest eroded component
    const eComps = connectedComponents(
      erodedIdx,
      // temp owner: treat eroded as face
      (() => {
        const o = new Int8Array(owner.length);
        for (const i of erodedIdx) o[i] = face;
        return o;
      })(),
      frozenData,
      face,
      width,
      height
    );
    const core = new Uint8Array(owner.length);
    for (const idx of eComps[0].members) core[idx] = 1;

    // Dilate core back
    const dilated = new Uint8Array(owner.length);
    for (let i = 0; i < core.length; i += 1) {
      if (!core[i]) continue;
      const x = i % width;
      const y = (i - x) / width;
      for (let dy = -ERODE; dy <= ERODE; dy += 1) {
        for (let dx = -ERODE; dx <= ERODE; dx += 1) {
          if (dx * dx + dy * dy > ERODE * ERODE) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (mask[ni]) dilated[ni] = 1;
        }
      }
    }

    // Also keep small drip comps from original that are near dilated core
    const comps = connectedComponents(indices, owner, frozenData, face, width, height);
    const keep = new Set();
    for (let i = 0; i < dilated.length; i += 1) if (dilated[i]) keep.add(i);

    // bbox of dilated
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (const idx of keep) {
      const x = idx % width;
      const y = (idx - x) / width;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    for (let c = 0; c < comps.length; c += 1) {
      const comp = comps[c];
      // skip if already mostly kept
      let already = 0;
      for (const idx of comp.members) if (keep.has(idx)) already += 1;
      if (already > comp.n * 0.5) continue;
      if (comp.n > DROP_MIN) continue;
      if (comp.n > DRIP_MAX) continue;
      const near =
        comp.maxX >= minX - NEAR_PX &&
        comp.minX <= maxX + NEAR_PX &&
        comp.maxY >= minY - NEAR_PX &&
        comp.minY <= maxY + NEAR_PX;
      if (near) for (const idx of comp.members) keep.add(idx);
    }

    // Column-run cleanup: if opaque columns form 2+ thick runs, keep only the
    // widest run (plus small drip runs). Removes side strips joined by thick necks.
    const colCount = new Array(width).fill(0);
    for (const idx of keep) {
      colCount[idx % width] += 1;
    }
    const colThresh = Math.max(8, Math.floor(height * 0.06));
    const runs = [];
    let inRun = false;
    let runStart = 0;
    for (let x = 0; x < width; x += 1) {
      if (colCount[x] >= colThresh) {
        if (!inRun) {
          inRun = true;
          runStart = x;
        }
      } else if (inRun) {
        runs.push({ x0: runStart, x1: x - 1, w: x - runStart });
        inRun = false;
      }
    }
    if (inRun) runs.push({ x0: runStart, x1: width - 1, w: width - runStart });
    runs.sort((a, b) => b.w - a.w);

    if (runs.length >= 2 && runs[0].w >= 80) {
      const mainRun = runs[0];
      const allow = new Set();
      allow.add(`${mainRun.x0}:${mainRun.x1}`);
      for (let r = 1; r < runs.length; r += 1) {
        // keep only narrow drip columns near main
        if (runs[r].w <= 18) {
          const near =
            runs[r].x1 >= mainRun.x0 - 12 && runs[r].x0 <= mainRun.x1 + 12;
          if (near) allow.add(`${runs[r].x0}:${runs[r].x1}`);
        }
      }
      for (const idx of [...keep]) {
        const x = idx % width;
        let inAllowed = false;
        for (const key of allow) {
          const [a, b] = key.split(":").map(Number);
          if (x >= a && x <= b) {
            inAllowed = true;
            break;
          }
        }
        // also keep sparse drip pixels (columns below thresh) near main
        if (!inAllowed && colCount[x] < colThresh) {
          if (x >= mainRun.x0 - 16 && x <= mainRun.x1 + 16) inAllowed = true;
        }
        if (!inAllowed) keep.delete(idx);
      }
    }

    let dropped = 0;
    for (const idx of indices) {
      if (keep.has(idx)) continue;
      owner[idx] = 0;
      dropped += 1;
    }
    console.log(
      `  prune face ${face}: erodedCore=${eComps[0].n} kept=${keep.size} dropped=${dropped} colRuns=${runs.length}`
    );
  }
}

function faceBBoxes(owner, width, height) {
  const boxes = Array.from({ length: 7 }, () => ({
    minX: width,
    minY: height,
    maxX: -1,
    maxY: -1,
  }));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const f = owner[y * width + x];
      if (f <= 0) continue;
      const b = boxes[f];
      if (x < b.minX) b.minX = x;
      if (y < b.minY) b.minY = y;
      if (x > b.maxX) b.maxX = x;
      if (y > b.maxY) b.maxY = y;
    }
  }
  return boxes;
}

/**
 * Dense ice-cube body (ignores sparse drip columns/rows) for owned frozen pixels.
 * Used to center/scale so the cube covers the die; drips ride along in pad.
 */
function faceBodyBox(owner, frozenData, face, width, height) {
  const colCount = new Array(width).fill(0);
  const rowCount = new Array(height).fill(0);
  let any = false;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (owner[idx] !== face) continue;
      if (frozenData[idx * 4 + 3] < BODY_ALPHA) continue;
      colCount[x] += 1;
      rowCount[y] += 1;
      any = true;
    }
  }
  if (!any) {
    return { minX: 0, minY: 0, maxX: -1, maxY: -1, w: 0, h: 0, cx: 0, cy: 0 };
  }
  const colT = Math.max(10, Math.floor(height * 0.07));
  const rowT = Math.max(10, Math.floor(width * 0.07));
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  for (let x = 0; x < width; x += 1) {
    if (colCount[x] < colT) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  for (let y = 0; y < height; y += 1) {
    if (rowCount[y] < rowT) continue;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0 || maxY < 0) {
    // fallback: all opaque owned pixels
    minX = width;
    minY = height;
    maxX = -1;
    maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        if (owner[idx] !== face) continue;
        if (frozenData[idx * 4 + 3] < BODY_ALPHA) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  return {
    minX,
    minY,
    maxX,
    maxY,
    w,
    h,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

/** Bilinear sample RGBA buffer → writes into out[oi..oi+3]. */
function sampleBilinear(src, width, height, fx, fy, out, oi) {
  if (fx < -0.5 || fy < -0.5 || fx >= width - 0.5 || fy >= height - 0.5) {
    out[oi] = 0;
    out[oi + 1] = 0;
    out[oi + 2] = 0;
    out[oi + 3] = 0;
    return;
  }
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const i00 = (y0 * width + x0) * 4;
  const i10 = (y0 * width + x1) * 4;
  const i01 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;
  for (let c = 0; c < 4; c += 1) {
    const v00 = src[i00 + c];
    const v10 = src[i10 + c];
    const v01 = src[i01 + c];
    const v11 = src[i11 + c];
    const v0 = v00 * (1 - tx) + v10 * tx;
    const v1 = v01 * (1 - tx) + v11 * tx;
    out[oi + c] = Math.round(v0 * (1 - ty) + v1 * ty);
  }
}

async function splitAll() {
  const outlinePath = path.join(ASSETS, OUTLINE_SHEET);
  const { data: outline, width, height } = await loadRgba(outlinePath);
  console.log(`Building ownership from ${OUTLINE_SHEET} (${width}×${height})…`);
  const ownership = buildOwnership(outline, width, height);

  const frozen = await loadRgba(path.join(ASSETS, "ice_power_frozen.png"));
  const drips = await loadRgba(path.join(ASSETS, "ice_power_frozen_outline_drips.png"));

  // Soft-assign only isolated opaque crumbs (tiny) near owned ice — never
  // reclaim large neighbor strips (those are pruned after).
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (ownership.owner[idx] !== 0) continue;
      if (frozen.data[idx * 4 + 3] < ALPHA_KEEP) continue;
      let found = 0;
      for (let dy = -3; dy <= 3 && !found; dy += 1) {
        for (let dx = -3; dx <= 3 && !found; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const f = ownership.owner[ny * width + nx];
          if (f > 0) found = f;
        }
      }
      if (found) ownership.owner[idx] = found;
    }
  }

  // Drip-sheet pixels: only attach when already owned or within 4px of owned ice
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (drips.data[idx * 4 + 3] < ALPHA_KEEP) continue;
      if (ownership.owner[idx] !== 0) continue;
      let found = 0;
      for (let dy = -4; dy <= 4 && !found; dy += 1) {
        for (let dx = -4; dx <= 4 && !found; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const f = ownership.owner[ny * width + nx];
          if (f > 0) found = f;
        }
      }
      if (found) ownership.owner[idx] = found;
    }
  }

  console.log("Pruning neighbor strips (keep main ice blob + small drips)…");
  pruneNeighborStrips(ownership.owner, frozen.data, width, height);

  // Clear orphan outline/drip ownership far from remaining frozen ice of that face
  for (let i = 0; i < ownership.owner.length; i += 1) {
    const f = ownership.owner[i];
    if (f <= 0) continue;
    if (frozen.data[i * 4 + 3] >= ALPHA_KEEP) continue;
    const x = i % width;
    const y = (i - x) / width;
    let near = false;
    for (let dy = -10; dy <= 10 && !near; dy += 1) {
      for (let dx = -10; dx <= 10 && !near; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (ownership.owner[ni] === f && frozen.data[ni * 4 + 3] >= ALPHA_KEEP) {
          near = true;
        }
      }
    }
    if (!near) ownership.owner[i] = 0;
  }

  const boxes = faceBBoxes(ownership.owner, width, height);
  const bodies = [];
  let maxBody = 0;
  for (let face = 1; face <= 6; face += 1) {
    const body = faceBodyBox(ownership.owner, frozen.data, face, width, height);
    bodies[face] = body;
    const b = boxes[face];
    const cw = b.maxX >= 0 ? b.maxX - b.minX + 1 : 0;
    const ch = b.maxY >= 0 ? b.maxY - b.minY + 1 : 0;
    if (body.w > 0) maxBody = Math.max(maxBody, body.w, body.h);
    console.log(
      `face ${face} content ${cw}×${ch}  body ${body.w}×${body.h} @ (${body.minX},${body.minY})–(${body.maxX},${body.maxY})`
    );
  }

  // Shared content square: die face maps to this. Each body is scaled so
  // min(bodyW, bodyH) == contentSize (covers the square on both axes).
  const contentSize = maxBody;
  const pad = Math.round(contentSize * CONTENT_PAD_FRAC);
  const outSize = contentSize + pad * 2;
  const destCx = (outSize - 1) / 2;
  const destCy = (outSize - 1) / 2;
  console.log(`Shared canvas: ${outSize}×${outSize} (content ${contentSize}, pad ${pad})`);

  /** Extra scale so watershed hard-cuts sit in the pad, not on the die edge. */
  const COVER_OVERSCAN = 1.08;
  const faceScales = [];
  for (let face = 1; face <= 6; face += 1) {
    const body = bodies[face];
    if (!body || body.w <= 0) {
      faceScales[face] = 1;
      continue;
    }
    // Cover the content square: shorter body axis fills contentSize, plus overscan.
    faceScales[face] = (contentSize / Math.min(body.w, body.h)) * COVER_OVERSCAN;
    console.log(
      `  face ${face} scale ${faceScales[face].toFixed(3)} → body ${Math.round(body.w * faceScales[face])}×${Math.round(body.h * faceScales[face])}`
    );
  }

  // Write meta for the overlay (pad fraction relative to canvas)
  const meta = {
    outSize,
    contentSize,
    pad,
    padFrac: pad / outSize, // fraction of canvas that is pad on each side
    // Inner content square maps to the die; padFrac matches ICE_FACE_PAD_FRAC
    note: "padFrac = pad/outSize; body scaled to cover content square; drips in pad",
    placement: "body-center scale-to-cover",
  };
  fs.writeFileSync(
    path.join(ASSETS, "ice_power_face_meta.json"),
    JSON.stringify(meta, null, 2)
  );
  console.log("Wrote ice_power_face_meta.json", meta);

  const sources = {
    "ice_power_frozen.png": frozen,
    "ice_power_frozen_outline.png": { data: outline, width, height },
    "ice_power_frozen_outline_drips.png": drips,
  };

  for (const sheet of SHEETS) {
    const src = sources[sheet.in];
    console.log(`${sheet.in} → ${outSize}×${outSize}`);
    for (let face = 1; face <= 6; face += 1) {
      const b = boxes[face];
      const body = bodies[face];
      const out = Buffer.alloc(outSize * outSize * 4, 0);
      if (!body || body.w <= 0 || b.maxX < 0) {
        console.log(`  face ${face}: empty`);
        continue;
      }
      const scale = faceScales[face];
      const inv = 1 / scale;

      // Inverse-map each output pixel → source. Only keep pixels owned by this face.
      let kept = 0;
      for (let oy = 0; oy < outSize; oy += 1) {
        for (let ox = 0; ox < outSize; ox += 1) {
          const sx = body.cx + (ox - destCx) * inv;
          const sy = body.cy + (oy - destCy) * inv;
          const ix = Math.round(sx);
          const iy = Math.round(sy);
          if (ix < 0 || iy < 0 || ix >= width || iy >= height) continue;
          const idx = iy * width + ix;
          if (ownership.owner[idx] !== face) continue;
          const si = idx * 4;
          if (src.data[si + 3] < ALPHA_KEEP) continue;
          const oi = (oy * outSize + ox) * 4;
          sampleBilinear(src.data, width, height, sx, sy, out, oi);
          if (out[oi + 3] < ALPHA_KEEP) {
            out[oi] = 0;
            out[oi + 1] = 0;
            out[oi + 2] = 0;
            out[oi + 3] = 0;
            continue;
          }
          kept += 1;
        }
      }

      const outPath = path.join(ASSETS, `${sheet.outPrefix}_${face}.png`);
      await sharp(out, { raw: { width: outSize, height: outSize, channels: 4 } })
        .png()
        .toFile(outPath);
      console.log(`  face ${face}: kept ${kept} scale=${scale.toFixed(3)} → ${path.basename(outPath)}`);
    }
  }

  console.log("Done — body-centered, scale-to-cover per-face ice assets written.");
  return meta;
}

splitAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
