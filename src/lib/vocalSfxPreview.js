/**
 * Vocal SFX — "YEEET!" & "SKRRRT!" via speech synthesis (actual yelled words).
 */

import { unlockPreviewAudio } from "@/lib/audioPreviewContext";

/** @deprecated use unlockPreviewAudio */
export function unlockVocalAudio() {
  return unlockPreviewAudio();
}

function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function waitForVoices(timeoutMs = 1200) {
  return new Promise((resolve) => {
    if (!speechSupported()) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    let settled = false;
    const finish = (voices) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.onvoiceschanged = null;
      resolve(voices);
    };
    const timer = setTimeout(() => finish(window.speechSynthesis.getVoices()), timeoutMs);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      finish(window.speechSynthesis.getVoices());
    };
  });
}

/** Pick a loud, clear English voice when available */
function pickShoutVoice(voices) {
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = en.length ? en : voices;
  const prefer = (pred) => pool.find(pred);
  return (
    prefer((v) => /samantha|alex|daniel|fred|tom|karen|zira|david/i.test(v.name)) ||
    prefer((v) => !/whisper|compact|novelty|bad/i.test(v.name)) ||
    pool[0] ||
    null
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Yell a word/phrase through the device TTS engine.
 * @returns {Promise<boolean>}
 */
export async function speakYell(
  text,
  { pitch = 1.25, rate = 1.15, volume = 1, voice = null, cancelFirst = true } = {},
) {
  if (!speechSupported()) return false;

  unlockPreviewAudio();
  if (cancelFirst) {
    window.speechSynthesis.cancel();
    await delay(40);
  }

  const voices = await waitForVoices();
  const chosen = voice || pickShoutVoice(voices);

  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    if (chosen) utter.voice = chosen;
    utter.lang = chosen?.lang || "en-US";
    utter.pitch = pitch;
    utter.rate = rate;
    utter.volume = volume;

    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve(ok);
    };

    utter.onend = () => finish(true);
    utter.onerror = () => finish(false);

    window.speechSynthesis.speak(utter);

    // Safari sometimes skips onend — fallback timeout
    const ms = Math.max(900, text.length * 90 / Math.max(rate, 0.5));
    setTimeout(() => finish(true), ms);
  });
}

/** "YEEET!" — one big yelled throw */
export async function playYeetPreview() {
  return speakYell("YEEET!", { pitch: 1.45, rate: 1.08, volume: 1 });
}

/** "SKRRRT!" — stutter-yelled tire scratch */
export async function playSkrrtPreview() {
  if (!speechSupported()) return false;

  const chunks = [
    { text: "Skrr!", pitch: 1.35, rate: 1.55 },
    { text: "Skrr!", pitch: 1.4, rate: 1.5 },
    { text: "SKRRRT!", pitch: 1.5, rate: 1.35 },
  ];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const ok = await speakYell(chunk.text, {
      pitch: chunk.pitch,
      rate: chunk.rate,
      volume: 1,
      cancelFirst: i === 0,
    });
    if (!ok) return false;
  }
  return true;
}

export const VOCAL_SFX_PREVIEWS = [
  {
    id: "yeet",
    label: "YEEET",
    emoji: "🚀",
    play: playYeetPreview,
    blurb: "Voice yells “YEEET!” — uses your device speaker",
    durationMs: 900,
  },
  {
    id: "skrrt",
    label: "SKRRRT",
    emoji: "🛞",
    play: playSkrrtPreview,
    blurb: "Stutter-yelled “skrr… SKRRRT!” tire scratch",
    durationMs: 1400,
  },
];
