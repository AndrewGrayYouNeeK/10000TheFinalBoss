import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2 } from "lucide-react";
import SiteNav from "@/components/marketing/SiteNav";
import { getWebShopCatalog } from "@/lib/webShopPricing";
import { assetUrl } from "@/lib/assetUrl";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { toast } from "sonner";

const TABS = [
  { id: "all", label: "All" },
  { id: "skin", label: "Dice Skins" },
  { id: "felt", label: "Felts" },
  { id: "box", label: "Mystery Boxes" },
];

async function startCheckout(item) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Shop backend is not configured yet.");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in on the Account page first.");

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: {
      item_type: item.type,
      item_id: item.id,
      success_url: `${window.location.origin}/account?checkout=success`,
      cancel_url: `${window.location.origin}/shop?checkout=cancel`,
    },
  });

  if (error) throw new Error(error.message || "Checkout failed");
  if (data?.url) {
    window.location.href = data.url;
    return;
  }
  throw new Error(data?.error || "No checkout URL returned");
}

export default function WebShop() {
  const catalog = useMemo(() => getWebShopCatalog(), []);
  const [tab, setTab] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const { user, configured } = useAuth();

  const items = catalog.filter((i) => tab === "all" || i.type === tab);

  const onBuy = async (item) => {
    if (!configured) {
      toast.message("Payments coming online soon", {
        description: "Add Supabase + Stripe keys to enable checkout.",
      });
      return;
    }
    if (!user) {
      toast.message("Sign in required", {
        description: "Create a free account so purchases sync to the app.",
        action: {
          label: "Account",
          onClick: () => {
            window.location.href = "/account";
          },
        },
      });
      return;
    }
    setBusyId(`${item.type}:${item.id}`);
    try {
      await startCheckout(item);
    } catch (err) {
      toast.error(err.message || "Checkout failed");
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#020408" }}>
      <SiteNav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1
              className="text-3xl font-black mb-1"
              style={{ color: "#00ffc8", textShadow: "0 0 20px rgba(0,255,200,0.3)" }}
            >
              Web Shop
            </h1>
            <p className="text-slate-400 text-sm max-w-lg">
              Buy dice skins, table felts, and mystery boxes here — keep 100% of the purchase.
              Sign in, buy, then open the iOS app with the same account to unlock them.
            </p>
          </div>
          <Link
            to="/account"
            className="text-xs font-bold uppercase tracking-wide px-3 py-2 rounded border"
            style={{
              color: "#c084fc",
              borderColor: "rgba(168,85,247,0.45)",
              background: "rgba(168,85,247,0.1)",
            }}
          >
            {user ? "My unlocks" : "Sign in to buy"}
          </Link>
        </div>

        {!isSupabaseConfigured() && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-sm text-amber-200/90"
            style={{
              borderColor: "rgba(251,191,36,0.35)",
              background: "rgba(251,191,36,0.08)",
            }}
          >
            Checkout is in preview mode until{" "}
            <code className="text-amber-100">VITE_SUPABASE_URL</code> / Stripe secrets are set.
            Browse the catalog below.
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors"
              style={{
                color: tab === t.id ? "#000" : "rgba(0,255,200,0.65)",
                borderColor:
                  tab === t.id ? "transparent" : "rgba(0,255,200,0.25)",
                background:
                  tab === t.id
                    ? "linear-gradient(135deg, #00ffc8, #a855f7)"
                    : "rgba(0,255,200,0.05)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-4 flex flex-col gap-3"
              style={{
                borderColor: "rgba(0,255,200,0.18)",
                background: "rgba(0,255,200,0.03)",
              }}
            >
              <div className="flex items-start gap-3">
                {item.spriteUrl ? (
                  <div
                    className="w-14 h-14 rounded-lg shrink-0 bg-cover bg-center border"
                    style={{
                      backgroundImage: `url("${assetUrl(item.spriteUrl)}")`,
                      borderColor: "rgba(0,255,200,0.25)",
                    }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg shrink-0 border flex items-center justify-center"
                    style={{
                      borderColor: "rgba(0,255,200,0.25)",
                      background: item.accent || "rgba(0,255,200,0.1)",
                    }}
                  >
                    <ShoppingBag className="w-5 h-5 text-white/80" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-white text-sm truncate">{item.name}</h2>
                    <span
                      className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color: "rgba(0,255,200,0.8)",
                        background: "rgba(0,255,200,0.1)",
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="font-black text-cyan-300">{item.priceLabel}</span>
                <button
                  type="button"
                  disabled={busyId === `${item.type}:${item.id}`}
                  onClick={() => onBuy(item)}
                  className="px-3 py-1.5 rounded-lg text-xs font-black disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #00ffc8, #00b8ff)",
                    color: "#000",
                  }}
                >
                  {busyId === `${item.type}:${item.id}` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Buy"
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
