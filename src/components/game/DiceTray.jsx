import React, { useCallback } from "react";
import Die from "./Die";
import { motion } from "framer-motion";
import { getFelt } from "@/lib/shopCatalog";
import FeltTrayFrame from "@/components/shop/FeltTrayFrame";

/**
 * Visual tray for the 6 dice. Rendered on a felt surface whose color is controlled by `feltId`.
 */
function DiceTray({
  dice,
  rolling,
  onToggle,
  disabled,
  skinId,
  feltId = "classic_green",
  scoreFill = 0.5,
  heldStyleId,
  lowPower = false,
  powerMode = false,
}) {
  const felt = getFelt(feltId);

  const handleToggle = useCallback(
    (dieId) => {
      if (!disabled && onToggle) onToggle(dieId);
    },
    [disabled, onToggle]
  );

  return (
    <FeltTrayFrame felt={felt} innerClassName="p-6">
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
              dieId={d.id}
              onToggleDie={handleToggle}
              size={100}
              skinId={skinId}
              scoreFill={scoreFill}
              dieSeed={d.id}
              heldStyleId={heldStyleId}
              lowPower={lowPower}
              powerMode={powerMode}
              bigFishVariantIndex={[7, 1, 6, 3, 1, 4][idx]}
              bigFishExtraScale={idx === 0 ? 2.1 : idx === 4 ? 2.0 : 1.15}
            />
          </motion.div>
        ))}
      </div>
    </FeltTrayFrame>
  );
}

export default React.memo(DiceTray);
