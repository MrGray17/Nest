import { useEffect, useState } from "react";

export function useIdleControls(enabled: boolean, timeoutMs = 4_000): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIdle(false);
      return;
    }
    let timer = window.setTimeout(() => setIdle(true), timeoutMs);
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), timeoutMs);
    };
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [enabled, timeoutMs]);

  return idle;
}
