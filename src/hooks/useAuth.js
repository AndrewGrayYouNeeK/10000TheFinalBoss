import { useEffect, useState, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { syncEntitlementsFromCloud } from "@/lib/entitlements";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Auth session + entitlement sync for web shop / native restore.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(configured);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const refreshEntitlements = useCallback(async () => {
    if (!configured) return null;
    setSyncing(true);
    try {
      const result = await syncEntitlementsFromCloud();
      if (result.ok) {
        queryClient.setQueryData(["me"], result.profile);
        setLastSync({ at: Date.now(), count: result.count });
      }
      return result;
    } finally {
      setSyncing(false);
    }
  }, [configured, queryClient]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return undefined;
    }
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
      if (data.session) void refreshEntitlements();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void refreshEntitlements();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [configured, refreshEntitlements]);

  const signInWithEmail = async (email) => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, reason: "not_configured" };
    const redirectTo = `${window.location.origin}/account`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    configured,
    session,
    user: session?.user ?? null,
    loading,
    syncing,
    lastSync,
    signInWithEmail,
    signOut,
    refreshEntitlements,
  };
}
