import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import SiteNav from "@/components/marketing/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { fetchEntitlements } from "@/lib/entitlements";
import { getSkin, getFelt } from "@/lib/shopCatalog";
import { MYSTERY_BOXES } from "@/lib/mysteryBoxes";
import { APP_STORE_URL } from "@/lib/webPlay";
import { toast } from "sonner";

export default function Account() {
  const {
    configured,
    user,
    loading,
    syncing,
    signInWithEmail,
    signOut,
    refreshEntitlements,
    lastSync,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Purchase complete — syncing unlocks…");
      void refreshEntitlements();
    }
  }, [searchParams, refreshEntitlements]);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    fetchEntitlements().then(setRows);
  }, [user, lastSync]);

  const onMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const result = await signInWithEmail(email);
    setSending(false);
    if (!result.ok) {
      toast.error(result.reason || "Could not send link");
      return;
    }
    setSent(true);
    toast.success("Check your email for the sign-in link");
  };

  const labelFor = (row) => {
    if (row.item_type === "skin") return getSkin(row.item_id)?.name || row.item_id;
    if (row.item_type === "felt") return getFelt(row.item_id)?.name || row.item_id;
    if (row.item_type === "box") {
      return MYSTERY_BOXES.find((b) => b.id === row.item_id)?.name || row.item_id;
    }
    return row.item_id;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#020408" }}>
      <SiteNav />
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8">
        <h1
          className="text-3xl font-black mb-2"
          style={{ color: "#00ffc8", textShadow: "0 0 20px rgba(0,255,200,0.3)" }}
        >
          Account
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          One account unlocks web purchases in the native app. Sign in here and in the app —
          cosmetics sync automatically (add-only; your coins and XP stay local).
        </p>

        {!configured && (
          <div
            className="rounded-lg border px-4 py-3 text-sm text-amber-200/90 mb-6"
            style={{
              borderColor: "rgba(251,191,36,0.35)",
              background: "rgba(251,191,36,0.08)",
            }}
          >
            Auth is not configured yet. Set{" "}
            <code className="text-amber-100">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-amber-100">VITE_SUPABASE_ANON_KEY</code> in{" "}
            <code className="text-amber-100">.env.local</code>.
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-cyan-300/70 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : !user ? (
          <form onSubmit={onMagicLink} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="mt-1.5 w-full rounded-lg border bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60"
                style={{ borderColor: "rgba(0,255,200,0.25)" }}
                disabled={!configured || sending}
              />
            </label>
            <button
              type="submit"
              disabled={!configured || sending}
              className="w-full h-11 rounded-lg font-black text-sm disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00ffc8, #a855f7)",
                color: "#000",
              }}
            >
              {sending ? "Sending…" : sent ? "Link sent — check email" : "Email me a sign-in link"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: "rgba(0,255,200,0.2)",
                background: "rgba(0,255,200,0.04)",
              }}
            >
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1">
                Signed in
              </p>
              <p className="text-white font-bold text-sm break-all">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => refreshEntitlements()}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                  style={{
                    color: "#00ffc8",
                    borderColor: "rgba(0,255,200,0.35)",
                  }}
                >
                  {syncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sync unlocks
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border text-slate-400"
                  style={{ borderColor: "rgba(148,163,184,0.35)" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
              {lastSync && (
                <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                  Synced {lastSync.count} entitlement{lastSync.count === 1 ? "" : "s"} to this device
                </p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-black text-white mb-3">Cloud unlocks</h2>
              {rows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No purchases yet.{" "}
                  <Link to="/shop" className="text-cyan-400 hover:underline">
                    Visit the shop
                  </Link>
                  .
                </p>
              ) : (
                <ul className="space-y-2">
                  {rows.map((row, i) => (
                    <li
                      key={`${row.item_type}-${row.item_id}-${i}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "rgba(0,255,200,0.15)" }}
                    >
                      <span className="text-white font-bold">{labelFor(row)}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {row.item_type}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-bold text-cyan-500/70 hover:text-cyan-400"
            >
              Open the iOS app and sign in with the same email →
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
