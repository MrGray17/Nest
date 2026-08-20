import { Music2, Plus } from "lucide-react";
import type { YouTubeSource } from "../domain/types";
import YouTubePlayer from "./YouTubePlayer";

type Props = {
  source: YouTubeSource | null;
  volume: number;
  onOpenMusic: () => void;
};

export default function MediaObject({ source, volume, onOpenMusic }: Props) {
  return (
    <section className={`media-object ${source ? "has-media" : "media-empty"}`} aria-label="YouTube player">
      {source ? (
        <>
          <YouTubePlayer key={source.id} source={source} volume={volume} />
          <div className="media-caption"><span><Music2 size={13} />{source.name}</span><button type="button" onClick={onOpenMusic} aria-label="Choose different music"><Plus size={14} /></button></div>
        </>
      ) : (
        <>
          <Music2 size={23} />
          <div><strong>Bring your own soundtrack</strong><span>Paste a YouTube video or playlist</span></div>
          <button type="button" onClick={onOpenMusic}>Add music</button>
        </>
      )}
    </section>
  );
}
