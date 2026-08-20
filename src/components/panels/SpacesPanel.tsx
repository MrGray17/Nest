import { Heart, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { ENVIRONMENT_MAP } from "../../config/environments";
import type { SavedSpace, YouTubeSource } from "../../domain/types";
import PanelShell from "./PanelShell";

type Props = {
  spaces: SavedSpace[];
  sources: YouTubeSource[];
  onSave: (name: string) => void;
  onApply: (space: SavedSpace) => void;
  onRemove: (spaceId: string) => void;
  onClose: () => void;
};

export default function SpacesPanel({ spaces, sources, onSave, onApply, onRemove, onClose }: Props) {
  const [name, setName] = useState("");
  const submit = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
  };
  return (
    <PanelShell eyebrow="Come back anytime" title="Saved spaces" onClose={onClose}>
      <div className="space-form">
        <input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Late Night Sifr" aria-label="Saved space name" />
        <button type="button" onClick={submit} disabled={!name.trim()}><Heart size={14} /> Save this room</button>
      </div>
      {spaces.length === 0 ? <p className="panel-empty">Save the exact room, music, timer, layout, and sound mix you want to return to.</p> : (
        <div className="space-list">
          {spaces.map((space) => {
            const environment = ENVIRONMENT_MAP[space.environmentId];
            const source = sources.find((item) => item.id === space.sourceId);
            return (
              <article key={space.id}>
                <button type="button" className="space-main" onClick={() => onApply(space)}>
                  <span className="space-icon">{environment.icon}</span>
                  <span><strong>{space.name}</strong><small>{environment.shortName} · {space.durationMinutes ?? "∞"} min{source ? ` · ${source.name}` : ""}</small></span>
                  <Play size={13} fill="currentColor" />
                </button>
                <button type="button" className="row-delete" onClick={() => onRemove(space.id)} aria-label={`Remove ${space.name}`}><Trash2 size={14} /></button>
              </article>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}
