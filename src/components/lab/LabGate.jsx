import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasLabGatePassword,
  isLabUnlocked,
  tryUnlockLab,
} from "@/lib/labGate";

/**
 * Password wall for creator tools (Sprite Lab, Felt Lab, etc.).
 * Auto-open in Vite DEV. Production uses VITE_LAB_GATE_PASSWORD + sessionStorage.
 */
export default function LabGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => isLabUnlocked());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (unlocked) return children;

  const configured = hasLabGatePassword();

  const onSubmit = (e) => {
    e.preventDefault();
    const result = tryUnlockLab(password);
    if (result.ok) {
      setError("");
      setUnlocked(true);
      return;
    }
    if (result.reason === "not_configured") {
      setError("Lab access is not configured for this build.");
    } else if (result.reason === "empty") {
      setError("Enter the lab password.");
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 shadow-lg shadow-cyan-950/40">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-cyan-300" />
          <h1 className="text-lg font-black tracking-wide">Creator labs</h1>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          {configured
            ? "Enter the lab password to open Sprite Lab and related tools."
            : "Labs are locked on this deployment. Set VITE_LAB_GATE_PASSWORD and rebuild to enable unlock."}
        </p>
        {configured ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            {error ? <p className="text-xs text-rose-400 font-semibold">{error}</p> : null}
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
              Unlock
            </Button>
          </form>
        ) : (
          error ? <p className="text-xs text-rose-400 font-semibold mb-3">{error}</p> : null
        )}
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-bold text-cyan-400 underline underline-offset-2"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
