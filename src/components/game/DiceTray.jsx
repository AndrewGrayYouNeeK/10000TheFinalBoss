import React from "react";
import Die from "./Die";
import { motion } from "framer-motion";
import { getFelt } from "@/lib/shopCatalog";
import FeltSurface from "@/components/shop/FeltSurface";

/**
 * Visual tray for the 6 dice. Rendered on a felt surface whose color is controlled by `feltId`.
 * dice: array of { id, value, used (banked), held (in active selection) }
 */
export default function DiceTray({ dice, rolling, onToggle, disabled, skinId, feltId = "classic_green" }) {
  const felt = getFelt(feltId);
  return (
    <div
      className={`relative rounded-3xl p-6 overflow-hidden border-4 ${felt.border}`}
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${felt.inner} 0%, ${felt.mid} 45%, ${felt.outer} 95%)`,
        boxShadow:
          "inset 0 4px 12px rgba(255,255,255,0.06)",
      }}
    >
      <FeltSurface felt={felt} />

      <div className="relative grid grid-cols-3 gap-3 sm:gap-6 justify-items-center sm:grid-cols-6">
        {dice.map((d, idx) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04 }}
          >
            <Die
              value={d.value}
              held={d.held}
              used={d.used}
              rolling={rolling && !d.used}
              onClick={() => !disabled && !d.used && onToggle && onToggle(d.id)}
              size={100}
              skinId={skinId}
              bigFishVariantIndex={[7, 1, 6, 3, 1, 4][idx]}
              bigFishExtraScale={idx === 0 ? 2.1 : idx === 4 ? 2.0 : 1.15}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}