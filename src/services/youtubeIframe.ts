import type { YouTubeSource } from "../domain/types";

export type YouTubePlayerInstance = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
};

export type YouTubePlayerFailure = Readonly<{
  code: "invalid-media" | "html5-error" | "unavailable" | "embedding-disabled" | "initialization-failed";
  message: string;
  retryable: boolean;
}>;

type YouTubePlayerOptions = {
  host?: string;
  width: string;
  height: string;
  videoId?: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: (event: { target: YouTubePlayerInstance }) => void;
    onError: (event: { data: number }) => void;
    onAutoplayBlocked: () => void;
  };
};

export type YouTubeNamespace = {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_URL = "https://www.youtube.com/iframe_api";
const DEFAULT_API_TIMEOUT_MS = 15_000;
let apiPromise: Promise<YouTubeNamespace> | null = null;

export function playerFailureFromCode(code: number): YouTubePlayerFailure {
  if (code === 2) return { code: "invalid-media", message: "This YouTube link is invalid.", retryable: false };
  if (code === 5) return { code: "html5-error", message: "YouTube couldn't play this video in your browser.", retryable: true };
  if (code === 100) return { code: "unavailable", message: "This video is unavailable or private.", retryable: false };
  if (code === 101 || code === 150) return { code: "embedding-disabled", message: "The creator has disabled playback outside YouTube.", retryable: false };
  return { code: "initialization-failed", message: "The YouTube player couldn't start.", retryable: true };
}

export function loadYouTubeApi({ timeoutMs = DEFAULT_API_TIMEOUT_MS }: { timeoutMs?: number } = {}): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    let settled = false;
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${API_URL}"]`);
    const script = existingScript ?? document.createElement("script");
    const previousReady = window.onYouTubeIframeAPIReady;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      script.removeEventListener("error", onScriptError);
      callback();
    };
    const onScriptError = () => finish(() => {
      if (!existingScript) script.remove();
      reject(new Error("Nest couldn't reach YouTube."));
    });
    const timeout = window.setTimeout(() => finish(() => {
      if (!existingScript) script.remove();
      reject(new Error("YouTube took too long to answer."));
    }), timeoutMs);

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      finish(() => {
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YouTube reported ready without a player API."));
      });
    };

    script.addEventListener("error", onScriptError, { once: true });
    if (!existingScript) {
      script.src = API_URL;
      script.async = true;
      document.head.append(script);
    }
  }).catch((error: unknown) => {
    apiPromise = null;
    throw error;
  });

  return apiPromise;
}

export async function createYouTubePlayer(
  element: HTMLElement,
  source: YouTubeSource,
  callbacks: {
    onReady: (player: YouTubePlayerInstance) => void;
    onError: (failure: YouTubePlayerFailure) => void;
    onAutoplayBlocked?: (player: YouTubePlayerInstance) => void;
  },
  signal?: AbortSignal,
): Promise<YouTubePlayerInstance | null> {
  const youtube = await loadYouTubeApi();
  if (signal?.aborted) return null;

  let player: YouTubePlayerInstance;
  try {
    player = new youtube.Player(element, {
      host: "https://www.youtube-nocookie.com",
      width: "100%",
      height: "100%",
      videoId: source.videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        enablejsapi: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        ...(source.playlistId ? { listType: "playlist", list: source.playlistId } : {}),
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          if (!signal?.aborted) callbacks.onReady(event.target);
        },
        onError: (event) => {
          if (!signal?.aborted) callbacks.onError(playerFailureFromCode(event.data));
        },
        onAutoplayBlocked: () => {
          if (!signal?.aborted) callbacks.onAutoplayBlocked?.(player);
        },
      },
    });
  } catch {
    throw new Error("The YouTube player could not be created.");
  }

  signal?.addEventListener("abort", () => player.destroy(), { once: true });
  return player;
}
