import SfxPreviewButtons from "@/components/sfx/SfxPreviewButtons";
import { VOCAL_SFX_PREVIEWS } from "@/lib/vocalSfxPreview";

export default function VocalSfxButtons({ compact = false }) {
  return <SfxPreviewButtons items={VOCAL_SFX_PREVIEWS} compact={compact} columns={2} />;
}
