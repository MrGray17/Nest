import { Music2, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { parseYouTubeUrl } from "../../domain/youtube";
import type { YouTubeSource } from "../../domain/types";
import PanelShell from "./PanelShell";

type Props = {
  sources: YouTubeSource[];
  selectedId: string | null;
  onSave: (source: YouTubeSource) => void;
  onSelect: (sourceId: string) => void;
  onRemove: (sourceId: string) => void;
  onClose: () => void;
};

export default function MusicPanel({ sources, selectedId, onSave, onSelect, onRemove, onClose }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const parsed = parseYouTubeUrl(url);
    if (!parsed) {
      setError("Paste a valid YouTube video or playlist link.");
      return;
    }
    const source: YouTubeSource = {
      id: crypto.randomUUID(),
      name: name.trim() || (parsed.playlistId ? "Saved playlist" : "Saved video"),
      url: parsed.canonicalUrl,
      videoId: parsed.videoId,
      playlistId: parsed.playlistId,
      createdAt: new Date().toISOString(),
    };
    onSave(source);
    setName("");
    setUrl("");
    setError(null);
  };

  return (
    <PanelShell eyebrow="Your soundtrack" title="YouTube" onClose={onClose}>
      <div className="music-form">
        <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Late Night Jazz" /></label>
        <label><span>YouTube link</span><input value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} placeholder="Video or playlist URL" inputMode="url" /></label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="button" className="panel-primary" onClick={submit} disabled={!url.trim()}><Music2 size={15} /> Save & use</button>
      </div>

      <div className="panel-section-heading"><span>Saved</span><b>{sources.length}</b></div>
      {sources.length === 0 ? (
        <p className="panel-empty">Your jazz, lofi, and study playlists will stay here on this device.</p>
      ) : (
        <div className="source-list">
          {sources.map((source) => (
            <div className={`source-row ${source.id === selectedId ? "is-active" : ""}`} key={source.id}>
              <button type="button" className="source-main" onClick={() => onSelect(source.id)}>
                <span className="source-play"><Play size={12} fill="currentColor" /></span>
                <span><strong>{source.name}</strong><small>{source.playlistId ? "Playlist" : "Video"}</small></span>
              </button>
              <button type="button" className="row-delete" onClick={() => onRemove(source.id)} aria-label={`Remove ${source.name}`}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
