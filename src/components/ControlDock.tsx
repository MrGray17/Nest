import { Headphones, Heart, Maximize, MonitorPlay, SlidersHorizontal, Sparkles } from "lucide-react";
import type { LayoutMode } from "../domain/types";

type Props = {
  layout: LayoutMode;
  sourceName: string | null;
  ambientSummary: string;
  onLayoutChange: (layout: LayoutMode) => void;
  onOpenMusic: () => void;
  onOpenMixer: () => void;
  onOpenSpaces: () => void;
  onFullscreen: () => void;
};

const MODES: { id: LayoutMode; label: string; icon: typeof Headphones }[] = [
  { id: "focus", label: "Focus", icon: Headphones },
  { id: "immersive", label: "Immersive", icon: Sparkles },
  { id: "watch", label: "Watch", icon: MonitorPlay },
];

export default function ControlDock(props: Props) {
  return (
    <footer className="room-dock">
      <button type="button" onClick={props.onOpenMusic}><Headphones size={15} /><span>{props.sourceName ?? "Add music"}</span></button>
      <span className="dock-divider" />
      <button type="button" onClick={props.onOpenMixer}><SlidersHorizontal size={15} /><span>{props.ambientSummary}</span></button>
      <div className="layout-switcher" aria-label="Display mode">
        {MODES.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={props.layout === id ? "is-active" : ""} onClick={() => props.onLayoutChange(id)} title={label} aria-label={`${label} mode`}><Icon size={14} /><span>{label}</span></button>)}
      </div>
      <span className="dock-spacer" />
      <button type="button" className="icon-command" onClick={props.onOpenSpaces} aria-label="Saved spaces" title="Saved spaces"><Heart size={15} /></button>
      <button type="button" className="icon-command" onClick={props.onFullscreen} aria-label="Fullscreen" title="Fullscreen"><Maximize size={15} /></button>
    </footer>
  );
}
