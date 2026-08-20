import { Check, Pause, Play, Plus } from "lucide-react";
import type { RefObject } from "react";
import { formatClock, remainingSeconds } from "../domain/timer";
import type { ActiveSession, NestSettings } from "../domain/types";

const DURATIONS = [25, 45, 60, 90] as const;

type Props = {
  settings: NestSettings;
  active: ActiveSession | null;
  now: number;
  compact?: boolean;
  onTaskChange: (task: string) => void;
  onDurationChange: (duration: number | null) => void;
  onCustomDurationChange: (duration: number) => void;
  onBegin: () => void;
  onToggle: () => void;
  onExtend: () => void;
  onFinish: () => void;
  taskInputRef?: RefObject<HTMLInputElement | null>;
};

export default function TimerObject(props: Props) {
  if (props.active) {
    const seconds = remainingSeconds(props.active, props.now);
    return (
      <section className={`timer-object active-timer ${props.compact ? "is-compact" : ""}`} aria-label="Current focus timer">
        <span className="timer-label">{props.active.runningSince === null ? "Paused" : "Quiet focus"}</span>
        <strong className="timer-readout" aria-live="off">{formatClock(seconds)}</strong>
        <div className="active-task"><span>Working on</span><h2>{props.active.task}</h2></div>
        <div className="timer-controls">
          <button type="button" onClick={props.onToggle}>{props.active.runningSince === null ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}<span>{props.active.runningSince === null ? "Resume" : "Pause"}</span></button>
          {props.active.durationMinutes !== null && <button type="button" onClick={props.onExtend}><Plus size={14} /><span>10 min</span></button>}
          <button type="button" onClick={props.onFinish}><Check size={14} /><span>Finish</span></button>
        </div>
      </section>
    );
  }

  const isCustom = props.settings.durationMinutes === props.settings.customDurationMinutes && !DURATIONS.includes(props.settings.durationMinutes as typeof DURATIONS[number]);
  return (
    <section className="timer-object setup-timer" aria-label="Set up focus timer">
      <span className="timer-label">Settle in for</span>
      <div className="duration-choices" aria-label="Focus duration">
        {DURATIONS.map((duration) => <button type="button" key={duration} className={props.settings.durationMinutes === duration ? "is-selected" : ""} onClick={() => props.onDurationChange(duration)}>{duration}</button>)}
        <button type="button" className={isCustom ? "is-selected" : ""} onClick={() => props.onDurationChange(props.settings.customDurationMinutes)}>Custom</button>
        <button type="button" className={props.settings.durationMinutes === null ? "is-selected" : ""} onClick={() => props.onDurationChange(null)}>∞</button>
      </div>
      {isCustom ? (
        <label className="custom-duration"><span>Minutes</span><input type="number" min="1" max="480" value={props.settings.customDurationMinutes} onChange={(event) => props.onCustomDurationChange(Math.min(480, Math.max(1, Number(event.target.value))))} /></label>
      ) : <strong className="timer-readout">{props.settings.durationMinutes === null ? "∞" : formatClock(props.settings.durationMinutes * 60)}</strong>}
      <label className="task-field">
        <span>What are you working on?</span>
        <input ref={props.taskInputRef} value={props.settings.currentTask} onChange={(event) => props.onTaskChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && props.onBegin()} placeholder="One thing. Keep it simple." />
      </label>
      <button type="button" className="begin-focus" disabled={!props.settings.currentTask.trim()} onClick={props.onBegin}>Begin focus <span>→</span></button>
    </section>
  );
}
