import SfxPreviewButtons from "@/components/sfx/SfxPreviewButtons";
import { DICE_ROLL_SFX_PREVIEWS } from "@/lib/diceRollSfxPreview";

export default function DiceRollSfxButtons({ compact = false }) {
  return <SfxPreviewButtons items={DICE_ROLL_SFX_PREVIEWS} compact={compact} />;
}
