import { ArrowRight, Coffee, Plus, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { elapsedMs } from "../domain/timer";
import type { ActiveSession } from "../domain/types";

type Props = {
  session: ActiveSession;
  now: number;
  onExtend: () => void;
  onBreak: (note: string) => void;
  onFinish: (note: string) => void;
  fallbackFocusRefs?: readonly RefObject<HTMLElement | null>[];
};

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours} hour${hours === 1 ? "" : "s"}`;
}

export default function SessionEndOverlay({ session, now, onExtend, onBreak, onFinish, fallbackFocusRefs }: Props) {
  const [note, setNote] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const minutes = Math.max(1, Math.round(elapsedMs(session, now) / 60_000));

  useEffect(() => {
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    noteRef.current?.focus();
    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]",
      ) ?? []);
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keepFocusInside);
    return () => {
      document.removeEventListener("keydown", keepFocusInside);
      if (returnTarget?.isConnected) returnTarget.focus();
      else fallbackFocusRefs?.find((ref) => ref.current)?.current?.focus();
    };
  }, [fallbackFocusRefs]);

  return (
    <div className="session-end-backdrop">
      <section ref={dialogRef} className="session-end" role="dialog" aria-modal="true" aria-label="Focus session complete">
        <span className="end-sprout" aria-hidden="true">🌱</span>
        <p>Gently done</p>
        <h2>{durationLabel(minutes)}</h2>
        <div className="end-task"><span>You worked on</span><strong>{session.task}</strong></div>
        <label><span>Leave a thread for next time</span><input ref={noteRef} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Next: test concurrent transfers" /></label>
        <div className="end-actions">
          {session.durationMinutes !== null && <button type="button" onClick={onExtend}><Plus size={14} />15 min</button>}
          <button type="button" onClick={() => onBreak(note)}><Coffee size={14} />Take a break</button>
          <button type="button" className="end-finish" onClick={() => onFinish(note)}><Sparkles size={14} />Finish<ArrowRight size={13} /></button>
        </div>
      </section>
    </div>
  );
}
