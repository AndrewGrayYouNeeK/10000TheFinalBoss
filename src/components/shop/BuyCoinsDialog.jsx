import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, Gift, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { COIN_PACKS } from "@/lib/shopCatalog";
import { toast } from "sonner";

function bonusFor(pack) {
  const tiers = [400, 1100, 2500, 6000, 15000, 175000];
  const idx = COIN_PACKS.findIndex((p) => p.id === pack.id);
  if (idx <= 0) return null;
  const prev = tiers[idx - 1];
  const gain = Math.round(((pack.coins - prev) / prev) * 100);
  return gain > 0 ? gain : null;
}

export default function BuyCoinsDialog({ onPurchase }) {
  const [open, setOpen] = React.useState(false);

  const handleClaim = (pack) => {
    onPurchase(pack.coins);
    toast.success(`+${pack.coins.toLocaleString()} GQ added!`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-9 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold"
        >
          <Gift className="w-4 h-4 mr-1" /> Bonus GQ
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" /> Bonus Gray Quarters
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Free bonus packs while you play. No real-money purchases in this version.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {COIN_PACKS.map((pack) => {
            const bonus = bonusFor(pack);
            return (
              <motion.button
                key={pack.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleClaim(pack)}
                className={`relative rounded-2xl p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-2 transition-colors flex flex-col items-center gap-1 text-center ${
                  pack.popular
                    ? "border-fuchsia-500 shadow-lg shadow-fuchsia-500/30"
                    : "border-amber-500/30 hover:border-amber-400"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Best Value
                  </div>
                )}
                <div className="text-3xl">{pack.emoji}</div>
                <div className="font-black text-white text-lg">{pack.name}</div>
                <div className="flex items-center gap-1 text-amber-300 font-black">
                  <Coins className="w-3.5 h-3.5" />
                  {pack.coins.toLocaleString()} GQ
                </div>
                {bonus !== null && (
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    bigger pack
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-2">
          Bonus GQ are added instantly at no charge.
        </p>
      </DialogContent>
    </Dialog>
  );
}
