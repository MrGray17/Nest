import { useEffect, useRef, useState } from "react";
import type { YouTubeSource } from "../domain/types";
import { createYouTubePlayer, type YouTubePlayerFailure, type YouTubePlayerInstance } from "../services/youtubeIframe";

type Props = {
  source: YouTubeSource;
  volume: number;
};

type PlayerState =
  | { status: "loading" }
  | { status: "ready"; autoplayBlocked: boolean }
  | { status: "error"; failure: YouTubePlayerFailure };

const PLAYER_READY_TIMEOUT_MS = 20_000;
const INITIALIZATION_FAILURE: YouTubePlayerFailure = {
  code: "initialization-failed",
  message: "YouTube took too long to prepare this player.",
  retryable: true,
};

export default function YouTubePlayer({ source, volume }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const [state, setState] = useState<PlayerState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const controller = new AbortController();
    const readyTimer = window.setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
        playerRef.current = null;
        setState({ status: "error", failure: INITIALIZATION_FAILURE });
      }
    }, PLAYER_READY_TIMEOUT_MS);
    setState({ status: "loading" });

    const fail = (failure: YouTubePlayerFailure) => {
      window.clearTimeout(readyTimer);
      if (!controller.signal.aborted) setState({ status: "error", failure });
    };

    void createYouTubePlayer(mount, source, {
      onReady: (player) => {
        window.clearTimeout(readyTimer);
        playerRef.current = player;
        player.setVolume(volume);
        setState({ status: "ready", autoplayBlocked: false });
      },
      onAutoplayBlocked: (player) => {
        window.clearTimeout(readyTimer);
        playerRef.current = player;
        player.setVolume(volume);
        setState({ status: "ready", autoplayBlocked: true });
      },
      onError: fail,
    }, controller.signal).then((player) => {
      if (!controller.signal.aborted && player) playerRef.current = player;
    }).catch(() => fail({
      code: "initialization-failed",
      message: "Nest couldn't open the YouTube player.",
      retryable: true,
    }));

    return () => {
      window.clearTimeout(readyTimer);
      controller.abort();
      playerRef.current = null;
    };
  }, [attempt, source]);

  useEffect(() => {
    if (state.status === "ready") playerRef.current?.setVolume(volume);
  }, [state.status, volume]);

  return (
    <div className={`youtube-player player-${state.status}`} aria-busy={state.status === "loading"}>
      <div ref={mountRef} className="youtube-mount" />
      {state.status === "loading" && <div className="player-status" role="status">Warming up YouTube…</div>}
      {state.status === "ready" && state.autoplayBlocked && (
        <div className="player-play-hint" role="status">Press play to begin 🎧</div>
      )}
      {state.status === "error" && (
        <div className="player-status player-error" role="alert">
          <span>{state.failure.message}</span>
          <div>
            {state.failure.retryable && <button type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>}
            <a href={source.url} target="_blank" rel="noreferrer">Open on YouTube</a>
          </div>
        </div>
      )}
    </div>
  );
}
