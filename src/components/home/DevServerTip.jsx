import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const DEV_URL = "http://127.0.0.1:5173";

/**
 * Shown only in dev builds. If you can see this component, Vite is already serving the app —
 * do not tell the player to "start the dev server" again.
 */
export default function DevServerTip() {
  const [copied, setCopied] = useState(false);

  if (!import.meta.env.DEV) return null;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(DEV_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked.
    }
  }

  return (
    <div
      className="fixed bottom-3 left-3 z-30 rounded-md border px-2 py-1 text-[10px] font-mono"
      style={{
        background: "rgba(0,0,0,0.45)",
        borderColor: "rgba(0,255,200,0.2)",
        color: "rgba(0,255,200,0.75)",
      }}
    >
      <span className="opacity-80">Dev · </span>
      <a href={DEV_URL} className="underline underline-offset-2 hover:opacity-90">
        {DEV_URL}
      </a>
      <button
        type="button"
        onClick={copyUrl}
        className="ml-2 inline-flex items-center gap-0.5 opacity-80 hover:opacity-100"
        aria-label="Copy dev URL"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
