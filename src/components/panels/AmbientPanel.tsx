import { CloudRain, Coffee, Play, Volume2, Wind } from "lucide-react";
import { ENVIRONMENT_MAP } from "../../config/environments";
import type { AmbientChannelId, AmbientMix, EnvironmentId } from "../../domain/types";
import PanelShell from "./PanelShell";

const CHANNEL_META: Record<AmbientChannelId, { label: string; icon: typeof CloudRain }> = {
  rain: { label: "Rain on glass", icon: CloudRain },
  cafe: { label: "Café murmur", icon: Coffee },
  wind: { label: "Summer wind", icon: Wind },
  city: { label: "Distant city", icon: Volume2 },
};

type Props = {
  environmentId: EnvironmentId;
  mix: AmbientMix;
  youtubeVolume: number;
  audioState: "idle" | "starting" | "playing" | "error";
  onStartAudio: () => void;
  onMixChange: (channel: AmbientChannelId, value: number) => void;
  onYouTubeVolumeChange: (value: number) => void;
  onClose: () => void;
};

export default function AmbientPanel(props: Props) {
  const channels = ENVIRONMENT_MAP[props.environmentId].channels;
  return (
    <PanelShell eyebrow="Layer the room" title="Sound" onClose={props.onClose}>
      {props.audioState !== "playing" && (
        <button type="button" className="audio-permission" onClick={props.onStartAudio} disabled={props.audioState === "starting"}>
          <Play size={14} fill="currentColor" />
          <span>{props.audioState === "error" ? "Try ambience again" : props.audioState === "starting" ? "Starting…" : "Enable room ambience"}</span>
        </button>
      )}
      <div className="mixer-list">
        <VolumeSlider icon={Volume2} label="YouTube" value={props.youtubeVolume} onChange={props.onYouTubeVolumeChange} />
        {channels.map((channel) => {
          const meta = CHANNEL_META[channel];
          return <VolumeSlider key={channel} icon={meta.icon} label={meta.label} value={props.mix[channel]} onChange={(value) => props.onMixChange(channel, value)} />;
        })}
      </div>
      <p className="panel-note">Room sounds are generated locally and stay independent from YouTube.</p>
    </PanelShell>
  );
}

function VolumeSlider({ icon: Icon, label, value, onChange }: { icon: typeof CloudRain; label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="volume-row">
      <span className="volume-icon"><Icon size={15} /></span>
      <span className="volume-name">{label}</span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${label} volume`} />
      <output>{value}%</output>
    </label>
  );
}
