import { useEffect, useState } from "react";
import { isDevPreviewActive, setDevPreviewEnabled } from "@/lib/devPreview";

export function useDevPreview() {
  const [active, setActive] = useState(() => isDevPreviewActive());

  useEffect(() => {
    const sync = () => setActive(isDevPreviewActive());
    window.addEventListener("devPreviewChange", sync);
    return () => window.removeEventListener("devPreviewChange", sync);
  }, []);

  const setEnabled = (enabled) => {
    setDevPreviewEnabled(enabled);
    setActive(enabled);
  };

  return { active, setEnabled };
}
