import React, { useRef, useEffect } from "react";
import * as THREE from "three";

// ─── Sprite sheet info ────────────────────────────────────────────────────────
// The sheet is 3 cols × 2 rows.  Col order: 1, 2, 3 (top row)  4, 5, 6 (bottom row)
const SPRITE_URL = "/assets/a1879bbbc_generated_image.png";
const COLS = 3;
const ROWS = 2;

// ─── Rounded-box geometry ─────────────────────────────────────────────────────
// Pure JS implementation – no external packages.
// Each face is a subdivided plane; corner/edge verts are pushed outward to radius R.
function buildRoundedBox(size, radius, segments) {
  const hs = size / 2;           // half-size
  const r  = radius;
  const N  = Math.max(2, segments); // grid divisions per face

  const positions = [];
  const normals   = [];
  const uvs       = [];
  const indices   = [];
  let vi = 0; // vertex index counter

  // Map a raw (x,y,z) on the surface of a box → rounded position + normal
  function round(x, y, z) {
    // Clamp to the inner box core
    const cx = Math.max(-(hs - r), Math.min(hs - r, x));
    const cy = Math.max(-(hs - r), Math.min(hs - r, y));
    const cz = Math.max(-(hs - r), Math.min(hs - r, z));
    // Direction from core to surface
    const dx = x - cx, dy = y - cy, dz = z - cz;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1e-9;
    return {
      px: cx + dx / len * r,
      py: cy + dy / len * r,
      pz: cz + dz / len * r,
      nx: dx / len,
      ny: dy / len,
      nz: dz / len,
    };
  }

  // Build one face.  mapFn(u,v) → raw [x,y,z] before rounding (u,v ∈ [0,1])
  function face(mapFn) {
    const base = vi;
    for (let j = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++) {
        const u = i / N, v = j / N;
        const raw = mapFn(u, v);
        const { px, py, pz, nx, ny, nz } = round(...raw);
        positions.push(px, py, pz);
        normals.push(nx, ny, nz);
        uvs.push(u, v);
        vi++;
      }
    }
    const stride = N + 1;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const a = base + j * stride + i;
        const b = a + 1;
        const c = base + (j + 1) * stride + i;
        const d = c + 1;
        indices.push(a, c, b,  b, c, d);
      }
    }
  }

  // Six faces – ORDER matters for material groups (must match getFaceOrder below)
  // front  +Z
  face((u, v) => [-hs + u * size, -hs + v * size,  hs]);
  // back   -Z  (mirrored U so texture isn't flipped)
  face((u, v) => [ hs - u * size, -hs + v * size, -hs]);
  // top    +Y
  face((u, v) => [-hs + u * size,  hs,  hs - v * size]);
  // bottom -Y
  face((u, v) => [-hs + u * size, -hs, -hs + v * size]);
  // right  +X
  face((u, v) => [ hs, -hs + v * size, hs - u * size]);
  // left   -X
  face((u, v) => [-hs, -hs + v * size, -hs + u * size]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal",   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute("uv",       new THREE.Float32BufferAttribute(uvs,       2));
  geo.setIndex(indices);
  geo.computeVertexNormals(); // smooth normals across rounded edges

  // Add draw-groups so each face gets its own material
  const triCount = N * N * 2;
  for (let f = 0; f < 6; f++) {
    geo.addGroup(f * triCount * 3, triCount * 3, f);
  }

  return geo;
}

// ─── Face value assignment ────────────────────────────────────────────────────
// Material slot order matches face() call order above:
//   0=front(+Z), 1=back(-Z), 2=top(+Y), 3=bottom(-Y), 4=right(+X), 5=left(-X)
// Standard die: opposite faces sum to 7.
// We always show `value` on the front face (+Z).
function getFaceValues(value) {
  const back = 7 - value;
  const rest = [1,2,3,4,5,6].filter(v => v !== value && v !== back);
  // [front, back, top, bottom, right, left]
  return [value, back, rest[0], rest[1], rest[2], rest[3]];
}

// ─── Sprite-sheet texture for one face value ──────────────────────────────────
// Crops the correct cell from the sheet using a canvas; preserves exact proportions.
function makeTexture(faceValue, img) {
  const col = (faceValue - 1) % COLS;
  const row = Math.floor((faceValue - 1) / COLS);
  const fw  = img.naturalWidth  / COLS;
  const fh  = img.naturalHeight / ROWS;

  const S   = 512; // output canvas size (square)
  const canvas = document.createElement("canvas");
  canvas.width  = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");

  // Draw the exact face cell, scaled to fill the canvas edge-to-edge
  ctx.drawImage(img, col * fw, row * fh, fw, fh, 0, 0, S, S);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Die3D({
  value   = 1,
  size    = 72,
  held    = false,
  used    = false,
  rolling = false,
  onClick,
}) {
  const mountRef   = useRef(null);
  const rendRef    = useRef(null);
  const cubeRef    = useRef(null);
  const matsRef    = useRef([]);
  const frameRef   = useRef(null);
  const rollRef    = useRef(false);
  const targetRef  = useRef({ x: 0.38, y: -0.48, z: 0.06 });
  const currentRef = useRef({ x: 0.38, y: -0.48, z: 0.06 });
  const imgRef     = useRef(null);

  function disposeMats() {
    matsRef.current.forEach(m => { m.map?.dispose(); m.dispose(); });
    matsRef.current = [];
  }

  function applyTextures(val) {
    const img = imgRef.current;
    if (!img || !cubeRef.current) return;
    disposeMats();
    const faceValues = getFaceValues(val);
    const mats = faceValues.map(fv =>
      new THREE.MeshStandardMaterial({
        map:       makeTexture(fv, img),
        roughness: 0.18,
        metalness: 0.04,
        envMapIntensity: 1.2,
      })
    );
    matsRef.current = mats;
    cubeRef.current.material = mats;
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Scene ──
    const scene = new THREE.Scene();

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 3.8);

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendRef.current = renderer;

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    const key = new THREE.DirectionalLight(0xfff6e8, 1.5);
    key.position.set(3, 5, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xddeeff, 0.55);
    fill.position.set(-4, 1, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.25);
    rim.position.set(0, -4, -3);
    scene.add(rim);

    // ── Geometry ──
    // 16mm die → scale to 1.5 units; radius ~2mm → 1.5*(2/16)=0.1875
    const GEO_SIZE   = 1.5;
    const GEO_RADIUS = GEO_SIZE * (2 / 16);
    const geo = buildRoundedBox(GEO_SIZE, GEO_RADIUS, 8);

    // Placeholder material while texture loads
    const placeholderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const cube = new THREE.Mesh(geo, placeholderMat);
    cube.rotation.x = currentRef.current.x;
    cube.rotation.y = currentRef.current.y;
    cube.rotation.z = currentRef.current.z;
    scene.add(cube);
    cubeRef.current = cube;

    // ── Load sprite sheet ──
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      applyTextures(value);
    };
    img.src = SPRITE_URL;

    // ── Animate ──
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (cube) {
        if (rollRef.current) {
          cube.rotation.x += 0.09;
          cube.rotation.y += 0.13;
          cube.rotation.z += 0.05;
        } else {
          const cur = currentRef.current;
          const tgt = targetRef.current;
          cur.x += (tgt.x - cur.x) * 0.1;
          cur.y += (tgt.y - cur.y) * 0.1;
          cur.z += (tgt.z - cur.z) * 0.1;
          cube.rotation.x = cur.x;
          cube.rotation.y = cur.y;
          cube.rotation.z = cur.z;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      disposeMats();
      placeholderMat.dispose();
      geo.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [size]);

  // Retexture when value changes
  useEffect(() => {
    applyTextures(value);
    targetRef.current = {
      x: 0.38 + (Math.random() - 0.5) * 0.28,
      y: -0.48 + (Math.random() - 0.5) * 0.28,
      z: (Math.random() - 0.5) * 0.1,
    };
  }, [value]);

  // Rolling state
  useEffect(() => {
    rollRef.current = rolling;
    if (!rolling) {
      targetRef.current = {
        x: 0.38 + (Math.random() - 0.5) * 0.22,
        y: -0.48 + (Math.random() - 0.5) * 0.22,
        z: (Math.random() - 0.5) * 0.08,
      };
    }
  }, [rolling]);

  return (
    <div
      ref={mountRef}
      onClick={!used && !rolling ? onClick : undefined}
      style={{
        width:        size,
        height:       size,
        cursor:       used || rolling ? "default" : "pointer",
        opacity:      used ? 0.2 : 1,
        filter:       used ? "grayscale(1)" : "",
        flexShrink:   0,
        display:      "inline-block",
        borderRadius: Math.round(size * 0.18),
        overflow:     "hidden",
        boxShadow:    held
          ? "0 0 0 3px #fcd34d, 0 0 20px 6px rgba(252,211,77,0.65)"
          : "0 6px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)",
      }}
    />
  );
}