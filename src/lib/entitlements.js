import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { loadProfile, updateProfile } from "@/lib/localProfile";

/**
 * Fetch cloud entitlements for the signed-in user.
 * @returns {Promise<{ item_type: string, item_id: string, source?: string }[]>}
 */
export async function fetchEntitlements() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("entitlements")
    .select("item_type, item_id, source, created_at")
    .eq("user_id", session.user.id);

  if (error) {
    console.warn("[entitlements] fetch failed", error.message);
    return [];
  }
  return data || [];
}

/**
 * Merge cloud entitlements into local profile (add-only — never wipe coins/XP).
 */
export function mergeEntitlementsIntoProfile(entitlements) {
  if (!Array.isArray(entitlements) || entitlements.length === 0) {
    return loadProfile();
  }

  const profile = loadProfile();
  const skins = new Set(profile.owned_skins ?? ["classic_white"]);
  const felts = new Set(profile.owned_felts ?? ["classic_green"]);
  const boxCredits = { ...(profile.mystery_box_credits || {}) };
  let changed = false;

  for (const row of entitlements) {
    const type = row.item_type;
    const id = row.item_id;
    if (!id) continue;
    if (type === "skin" && !skins.has(id)) {
      skins.add(id);
      changed = true;
    } else if (type === "felt" && !felts.has(id)) {
      felts.add(id);
      changed = true;
    } else if (type === "box") {
      // Each entitlement row = one box credit (idempotent merge uses count from cloud)
      // Prefer recounting from cloud rows rather than incrementing repeatedly.
    }
  }

  // Recount box credits from entitlement rows so re-sync is idempotent
  const boxCounts = {};
  for (const row of entitlements) {
    if (row.item_type === "box" && row.item_id) {
      boxCounts[row.item_id] = (boxCounts[row.item_id] || 0) + 1;
    }
  }
  for (const [boxId, count] of Object.entries(boxCounts)) {
    const prev = boxCredits[boxId] || 0;
    if (count > prev) {
      boxCredits[boxId] = count;
      changed = true;
    }
  }

  if (!changed) return profile;

  return updateProfile({
    owned_skins: [...skins],
    owned_felts: [...felts],
    mystery_box_credits: boxCredits,
  });
}

export async function syncEntitlementsFromCloud() {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "not_configured", profile: loadProfile() };
  }
  const rows = await fetchEntitlements();
  const profile = mergeEntitlementsIntoProfile(rows);
  return { ok: true, count: rows.length, profile };
}
