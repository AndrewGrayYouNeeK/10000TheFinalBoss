import { getSkin } from "@/lib/shopCatalog";
import DicePreview from "@/components/shop/DicePreview";
import {
  GHOST_SKIN_ID,
  getSetupDisguiseOptions,
  getSetupSkinOptions,
} from "@/lib/ghostDisguise";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const triggerStyle = {
  background: "rgba(3,4,10,0.7)",
  borderColor: "rgba(0,255,200,0.5)",
  boxShadow: "inset 0 0 10px rgba(0,255,200,0.2)",
};

const contentStyle = {
  background: "rgba(8,2,20,0.96)",
  borderColor: "rgba(0,255,200,0.45)",
  boxShadow: "0 0 18px rgba(0,255,200,0.25), 0 4px 24px rgba(0,0,0,0.5)",
};

/** Compact per-player dice skin dropdown for pass-and-play Setup rows. */
export default function SetupSkinPicker({
  ownedSkins,
  selectedId,
  onSelect,
  selectedDisguiseId,
  onDisguiseSelect,
  disguiseLocked = false,
}) {
  const options = getSetupSkinOptions(ownedSkins);
  if (!options.length) return null;

  const value = options.includes(selectedId) ? selectedId : options[0];
  const isGhost = value === GHOST_SKIN_ID;
  const disguiseOptions = getSetupDisguiseOptions(ownedSkins);
  const disguiseValue =
    selectedDisguiseId && disguiseOptions.includes(selectedDisguiseId)
      ? selectedDisguiseId
      : null;
  const showDisguisePicker =
    isGhost && !disguiseLocked && disguiseOptions.length > 0 && onDisguiseSelect;
  const disguiseName = disguiseValue ? getSkin(disguiseValue)?.name : null;

  return (
    <div className="flex items-start gap-2 min-w-0">
      <div className="shrink-0 scale-[0.72] origin-left -mr-2 mt-0.5">
        {/* Always show the selected look — Ghost stays spectral even after disguise */}
        <DicePreview skinId={value} size={40} compact resolveGhost={false} />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <Select value={value} onValueChange={onSelect}>
          <SelectTrigger
            className="h-9 w-full border-2 font-term text-sm tracking-wide text-white focus:ring-0 focus:ring-offset-0 [&>svg]:text-cyan-300/70"
            style={triggerStyle}
          >
            <SelectValue placeholder="Pick dice look" />
          </SelectTrigger>
          <SelectContent
            className="z-50 border-2 font-term text-white"
            style={contentStyle}
            position="popper"
            sideOffset={4}
          >
            {options.map((id) => {
              const skin = getSkin(id);
              return (
                <SelectItem
                  key={id}
                  value={id}
                  className="cursor-pointer text-slate-200 focus:bg-cyan-500/15 focus:text-white data-[state=checked]:text-cyan-200"
                >
                  {skin?.name || id.replace(/_/g, " ")}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {showDisguisePicker ? (
          <Select
            value={disguiseValue ?? undefined}
            onValueChange={onDisguiseSelect}
          >
            <SelectTrigger
              className="h-8 w-full border font-term text-xs tracking-wide text-slate-200 focus:ring-0 focus:ring-offset-0 [&>svg]:text-cyan-300/60"
              style={{
                ...triggerStyle,
                borderColor: "rgba(0,255,200,0.35)",
                boxShadow: "inset 0 0 8px rgba(0,255,200,0.12)",
              }}
            >
              <SelectValue placeholder="Pick disguise" />
            </SelectTrigger>
            <SelectContent
              className="z-50 border-2 font-term text-white"
              style={contentStyle}
              position="popper"
              sideOffset={4}
            >
              {disguiseOptions.map((id) => {
                const skin = getSkin(id);
                return (
                  <SelectItem
                    key={id}
                    value={id}
                    className="cursor-pointer text-slate-200 focus:bg-cyan-500/15 focus:text-white data-[state=checked]:text-cyan-200"
                  >
                    {skin?.name || id.replace(/_/g, " ")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : null}

        {isGhost && disguiseLocked && disguiseName ? (
          <div
            className="h-8 flex items-center px-3 border font-term text-xs tracking-wide text-white/80 truncate"
            style={{
              ...triggerStyle,
              borderColor: "rgba(0,255,200,0.35)",
              boxShadow: "inset 0 0 8px rgba(0,255,200,0.12)",
            }}
          >
            Disguise: {disguiseName}
          </div>
        ) : null}
      </div>
    </div>
  );
}
