import { Coffee } from "lucide-react";
import type { RefObject } from "react";
import { formatClock } from "../domain/timer";
import type { BreakState } from "../domain/types";

export default function BreakObject({ state, now, onReady, readyButtonRef }: { state: BreakState; now: number; onReady: () => void; readyButtonRef?: RefObject<HTMLButtonElement | null> }) {
  const seconds = Math.max(0, Math.ceil((state.endsAt - now) / 1_000));
  return (
    <section className="break-object" aria-label="Break timer">
      <Coffee size={19} />
      <strong>{formatClock(seconds)}</strong>
      <p>No work right now.</p>
      <button ref={readyButtonRef} type="button" onClick={onReady}>Ready? <span aria-hidden="true">🌱</span></button>
    </section>
  );
}
