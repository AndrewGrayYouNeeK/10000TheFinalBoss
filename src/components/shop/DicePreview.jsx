import React, { Suspense, useEffect, useRef, useState } from "react";
import { getSkin, getSpriteStyle } from "@/lib/shopCatalog";

const LazyDie = React.lazy(() => import("@/components/game/Die"));

function LazySpritePreview({ skinId, value, size }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "160px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const skin = getSkin(skinId);
  const spriteStyle = visible ? getSpriteStyle(skin, value, size) : null;

  return (
    <div
      ref={ref}
      className="rounded-lg overflow-hidden bg-slate-800/30 shrink-0"
      style={{
        width: size,
        height: size,
        transform: "scale(1.1)",
        ...(spriteStyle || {}),
      }}
    />
  );
}

function LazyAnimatedPreview({ skinId, value, size }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: size, height: size }}>
      {visible ? (
        <Suspense fallback={<div className="w-full h-full rounded-lg bg-slate-800/40 animate-pulse" />}>
          <LazyDie value={value} skinId={skinId} size={size} dieSeed={value * 17 + 3} />
        </Suspense>
      ) : (
        <div className="w-full h-full rounded-lg bg-slate-800/30" />
      )}
    </div>
  );
}

/** Shop card preview — static sprite when possible; lazy Die for custom effects */
export default function DicePreview({ skinId, value = 5 }) {
  const size = 64;
  const skin = getSkin(skinId);

  if (skin?.spriteUrl) {
    return <LazySpritePreview skinId={skinId} value={value} size={size} />;
  }

  return (
    <div style={{ transform: "scale(1.1)" }}>
      <LazyAnimatedPreview skinId={skinId} value={value} size={size} />
    </div>
  );
}
