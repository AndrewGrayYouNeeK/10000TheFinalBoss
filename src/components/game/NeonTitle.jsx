import React from "react";

// A single die face used in place of a "0" in the title
function DieZero({ size = 44, pips = 1 }) {
  const layouts = {
    1: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
    2: [[1, 0, 0], [0, 0, 0], [0, 0, 1]],
    3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    4: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
    5: [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
    6: [[1, 0, 1], [1, 0, 1], [1, 0, 1]]
  };
  const layout = layouts[pips] || layouts[1];
  const radius = Math.round(size * 0.22);
  const pipSize = Math.round(size * 0.18);
  const pad = Math.round(size * 0.14);

  return (
    <span
      className="inline-block align-middle relative"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background:
        "linear-gradient(135deg, #0a0020 0%, #2a0050 50%, #0a0020 100%)",
        border: "2px solid #ff00ea",
        boxShadow:
        "0 0 10px #ff00ea, 0 0 22px #00ffff, inset 0 0 10px rgba(0,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)"
      }}>
      
      {/* sheen */}
      <span
        className="absolute pointer-events-none"
        style={{
          inset: 1,
          borderRadius: radius - 1,
          background:
          "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 45%)"
        }} />
      
      <span
        className="absolute grid grid-cols-3 grid-rows-3"
        style={{ inset: pad, gap: Math.round(size * 0.04) }}>
        
        {layout.flat().map((p, i) =>
        <span key={i} className="flex items-center justify-center">
            {p === 1 &&
          <span
            className="rounded-full block"
            style={{
              width: pipSize,
              height: pipSize,
              background: "#ffffff",
              boxShadow:
              "0 0 6px #00ffff, 0 0 12px #ff00ea, 0 0 2px #fff"
            }} />

          }
          </span>
        )}
      </span>
    </span>);

}

export default function NeonTitle({ dieSize = 40 }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* glow halo behind title */}
      <div
        className="absolute inset-0 -m-2 rounded-full blur-2xl opacity-70 pointer-events-none"
        style={{
          background:
          "radial-gradient(ellipse at center, rgba(255,0,170,0.55), rgba(0,255,200,0.25) 50%, transparent 70%)"
        }} />
      

      {/* corner brackets */}
      <span
        className="absolute -left-2 top-0 bottom-0 w-2"
        style={{
          borderLeft: "2px solid #00ffc8",
          borderTop: "2px solid #00ffc8",
          borderBottom: "2px solid #00ffc8",
          boxShadow: "0 0 8px #00ffc8",
          borderRadius: "2px 0 0 2px"
        }} />
      
      <span
        className="absolute -right-2 top-0 bottom-0 w-2"
        style={{
          borderRight: "2px solid #ff00aa",
          borderTop: "2px solid #ff00aa",
          borderBottom: "2px solid #ff00aa",
          boxShadow: "0 0 8px #ff00aa",
          borderRadius: "0 2px 2px 0"
        }} />
      

      




















      
    </div>);

}