import { GHOST_SKIN_ID, getSkinLabel } from "@/lib/ghostDisguise";
import { getExperimentalById } from "@/lib/experimentalDice";
import { getSkinPower } from "@/lib/skinPowers";

/** Manual overrides for hidden dice mechanics (when catalog metadata isn't enough). */
const SKIN_HIDDEN_TRAITS = {
  clear_void: ["Clear body hidden — only floating pips show"],
  ethereal_mist: ["Misty clear body — pips look soft and hidden"],
  zen: ["Minimal clear body — nearly invisible face"],
};

const DEBUFF_REVEALS = {
  static: { icon: "📡", text: "Score hidden from themselves (Static — this turn)" },
  blackout: { icon: "🌑", text: "Their score hidden from you (Blackout — this turn)" },
  freeze: { icon: "❄️", text: "Power bar frozen (Freeze — this turn)" },
  freeze_score: { icon: "🧊", text: "Banked score locked (Score Freeze — this turn)" },
  lockout: { icon: "🔒", text: "Powers locked out (Lockout — this turn)" },
  shark_bite: { icon: "🦈", text: "Marked for Shark Bite — next bank will be eaten" },
};

function addFinding(findings, seen, icon, text) {
  if (!text || seen.has(text)) return;
  seen.add(text);
  findings.push({ icon, text });
}

/** Normalize legacy reveals (trueSkinId string) or finding arrays. */
export function normalizeXrayFindings(entry) {
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  if (typeof entry === "string") {
    return [{ icon: "👻", text: `Ghost disguise → ${getSkinLabel(entry)}` }];
  }
  return [];
}

function mergeFindings(existing, next) {
  const seen = new Set();
  const merged = [];
  for (const f of [...normalizeXrayFindings(existing), ...next]) {
    addFinding(merged, seen, f.icon, f.text);
  }
  return merged;
}

function getAutoHiddenTraits(skinId) {
  const exp = getExperimentalById(skinId);
  if (!exp?.style) return [];
  const traits = [];
  const { style } = exp;

  if (style.phantomPulse || style.pipEffect === "ghostPip") {
    traits.push("Nearly invisible body — pips fade out completely");
  }
  if (style.kind === "clear" && skinId !== GHOST_SKIN_ID) {
    traits.push("Clear body — dice face is nearly invisible");
  }
  if (style.pipMode === "hidden" || style.pipEffect === "hiddenPip") {
    traits.push("Pips stay hidden until the radar sweep hits them");
  }
  if (style.pipEffect === "radarReveal") {
    traits.push("Pips only visible while the scan line passes over them");
  }
  if (skinId === "pf_xray") {
    traits.push("Internal bone lattice hidden under fluoroscopy scan");
  }
  return traits;
}

function scanSkinTraits(skinId, findings, seen, prefix = "") {
  const traits = [...getAutoHiddenTraits(skinId), ...(SKIN_HIDDEN_TRAITS[skinId] || [])];
  for (const trait of traits) {
    addFinding(findings, seen, "🔬", prefix ? `${prefix}: ${trait}` : trait);
  }
}

function scanDebuffs(player, findings, seen) {
  for (const debuff of player.debuffs || []) {
    const id = typeof debuff === "string" ? debuff : debuff.id;
    const info = DEBUFF_REVEALS[id];
    if (info) addFinding(findings, seen, info.icon, info.text);
  }
}

/** All hidden information an opponent's dice skin is concealing. */
export function scanPlayerHidden(player) {
  const findings = [];
  const seen = new Set();
  const skinId = player.skinId || "classic_white";
  const trueSkinId = player.trueSkinId;

  if (skinId === GHOST_SKIN_ID && trueSkinId) {
    addFinding(findings, seen, "👻", `Ghost — disguised as ${getSkinLabel(trueSkinId)}`);
    addFinding(
      findings,
      seen,
      "🎭",
      "Power mimics opponent's pretend skin (Ghost vs Ghost = swap disguises)"
    );
    const disguisePower = getSkinPower(trueSkinId);
    if (disguisePower) {
      addFinding(
        findings,
        seen,
        "⚡",
        `Disguise power (${getSkinLabel(trueSkinId)}): ${disguisePower.name} — only if they were real`
      );
    }
    scanSkinTraits(trueSkinId, findings, seen, getSkinLabel(trueSkinId));
  } else {
    const power = getSkinPower(skinId);
    if (power) {
      addFinding(findings, seen, "⚡", `Hidden power: ${power.name}`);
    }
  }

  scanSkinTraits(skinId, findings, seen);
  scanDebuffs(player, findings, seen);

  return findings;
}

/** Scan every opponent and merge into persistent xray reveal state. */
export function scanAllOpponents(state) {
  const idx = state.currentIndex;
  const reveals = { ...(state.xrayReveals || {}) };
  const scanned = [];

  state.players.forEach((player, i) => {
    if (i === idx) return;
    const findings = scanPlayerHidden(player);
    if (!findings.length) return;
    reveals[i] = mergeFindings(reveals[i], findings);
    scanned.push({ name: player.name, findings: reveals[i] });
  });

  return {
    reveals,
    scanned,
    hasAny: scanned.length > 0,
  };
}

export function formatXraySummary(scanned) {
  return scanned
    .map(({ name, findings }) => `${name}: ${findings.map((f) => f.text).join("; ")}`)
    .join(" · ");
}

/** Whether a skin has visual/mechanical hidden traits (beyond secret power). */
export function skinHasHiddenTraits(skinId) {
  return (
    skinId === GHOST_SKIN_ID ||
    getAutoHiddenTraits(skinId).length > 0 ||
    (SKIN_HIDDEN_TRAITS[skinId]?.length ?? 0) > 0
  );
}
