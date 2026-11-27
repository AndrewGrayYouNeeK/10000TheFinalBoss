import React from "react";

/** Exact public copyright line for the site footer and README. */
export const SITE_COPYRIGHT = "YouNeeK™ · © 2026 Andrew Gray";

/**
 * Site-wide copyright footer. Rendered once from App for every route.
 * `compact` is for full-screen game views, where vertical space is tight.
 */
export default function SiteFooter({ compact = false }) {
  return (
    <footer
      role="contentinfo"
      className={
        compact
          ? "shrink-0 w-full px-3 py-1 text-center"
          : "shrink-0 w-full px-4 py-3 text-center"
      }
    >
      <p
        className={
          compact
            ? "text-[10px] leading-none tracking-wide text-slate-500"
            : "text-[11px] leading-snug tracking-wide text-slate-500"
        }
      >
        {SITE_COPYRIGHT}
      </p>
    </footer>
  );
}
