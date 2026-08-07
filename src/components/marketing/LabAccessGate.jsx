import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { canAccessLabs, getLabAdminEmails } from "@/lib/labAccess";
import { gameHubPath } from "@/lib/webPlay";

/**
 * Blocks public access to sprite/felt/ice/shark labs.
 * Production: signed-in email must be in VITE_LAB_ADMIN_EMAILS.
 * Local `npm run dev`: always open.
 */
export default function LabAccessGate() {
  const { user, loading, configured } = useAuth();
  const allowed = canAccessLabs(user);

  if (import.meta.env.DEV) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-300 text-sm">
        Checking access…
      </div>
    );
  }

  if (allowed) {
    return <Outlet />;
  }

  const adminsConfigured = getLabAdminEmails().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 text-center gap-4">
      <p className="text-rose-400 font-black text-lg">Labs are private</p>
      <p className="text-sm text-slate-400 max-w-sm">
        {!configured
          ? "Sign-in is not configured on this build, so lab tools stay locked."
          : !user
            ? "Sign in with your developer account to open labs."
            : adminsConfigured
              ? "This account is not on the lab allowlist."
              : "No lab admin emails are configured (VITE_LAB_ADMIN_EMAILS)."}
      </p>
      <div className="flex items-center gap-4 text-sm font-bold">
        {!user && configured && (
          <Link to="/account" className="text-cyan-400 underline">
            Sign in
          </Link>
        )}
        <Link to={gameHubPath()} className="text-cyan-400 underline">
          Back
        </Link>
      </div>
    </div>
  );
}
