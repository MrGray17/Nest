// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { YouTubeSource } from "../domain/types";

const source: YouTubeSource = {
  id: "video",
  name: "Test video",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  videoId: "dQw4w9WgXcQ",
  createdAt: "now",
};

function playerInstance() {
  return { destroy: vi.fn(), playVideo: vi.fn(), pauseVideo: vi.fn(), setVolume: vi.fn() };
}

describe("YouTube IFrame API loader", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    document.head.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').forEach((node) => node.remove());
  });

  afterEach(() => vi.useRealTimers());

  it("resolves immediately when the API already exists", async () => {
    const Player = vi.fn(function FakePlayer() { return playerInstance(); });
    window.YT = { Player } as unknown as Window["YT"];
    const { loadYouTubeApi } = await import("./youtubeIframe");
    await expect(loadYouTubeApi()).resolves.toBe(window.YT);
    expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(0);
  });

  it("shares one script and resolves simultaneous callers", async () => {
    const { loadYouTubeApi } = await import("./youtubeIframe");
    const first = loadYouTubeApi();
    const second = loadYouTubeApi();
    expect(first).toBe(second);
    expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1);
    window.YT = { Player: vi.fn() } as unknown as Window["YT"];
    window.onYouTubeIframeAPIReady?.();
    await expect(Promise.all([first, second])).resolves.toEqual([window.YT, window.YT]);
  });

  it("rejects script errors and can retry", async () => {
    const { loadYouTubeApi } = await import("./youtubeIframe");
    const first = loadYouTubeApi();
    document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')?.dispatchEvent(new Event("error"));
    await expect(first).rejects.toThrow("couldn't reach YouTube");

    const retry = loadYouTubeApi();
    expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1);
    window.YT = { Player: vi.fn() } as unknown as Window["YT"];
    window.onYouTubeIframeAPIReady?.();
    await expect(retry).resolves.toBe(window.YT);
  });

  it("times out, then accepts a late API or a clean retry", async () => {
    vi.useFakeTimers();
    const { loadYouTubeApi } = await import("./youtubeIframe");
    const pending = loadYouTubeApi({ timeoutMs: 50 });
    const rejection = expect(pending).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(50);
    await rejection;

    window.YT = { Player: vi.fn() } as unknown as Window["YT"];
    window.onYouTubeIframeAPIReady?.();
    await expect(loadYouTubeApi()).resolves.toBe(window.YT);
  });
});

describe("YouTube player adapter", () => {
  beforeEach(() => {
    vi.resetModules();
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
    document.head.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').forEach((node) => node.remove());
  });

  it("does not create a player when its owner unmounts during API loading", async () => {
    const { createYouTubePlayer } = await import("./youtubeIframe");
    const Player = vi.fn(function FakePlayer() { return playerInstance(); });
    const controller = new AbortController();
    const pending = createYouTubePlayer(document.createElement("div"), source, { onReady: vi.fn(), onError: vi.fn() }, controller.signal);
    controller.abort();
    window.YT = { Player } as unknown as Window["YT"];
    window.onYouTubeIframeAPIReady?.();
    await expect(pending).resolves.toBeNull();
    expect(Player).not.toHaveBeenCalled();
  });

  it("creates video and playlist players and destroys only the aborted instance", async () => {
    const instances = [playerInstance(), playerInstance()];
    const playerOptions: Array<{ playerVars: Record<string, string | number> }> = [];
    const Player = vi.fn(function FakePlayer(_element: HTMLElement, options: { playerVars: Record<string, string | number> }) {
      playerOptions.push(options);
      return instances[playerOptions.length - 1];
    });
    window.YT = { Player } as unknown as Window["YT"];
    const { createYouTubePlayer } = await import("./youtubeIframe");
    const firstController = new AbortController();
    const first = await createYouTubePlayer(document.createElement("div"), source, { onReady: vi.fn(), onError: vi.fn() }, firstController.signal);
    const secondController = new AbortController();
    const playlist = { ...source, id: "playlist", videoId: undefined, playlistId: "PL1234567890" };
    const second = await createYouTubePlayer(document.createElement("div"), playlist, { onReady: vi.fn(), onError: vi.fn() }, secondController.signal);
    firstController.abort();
    expect(first).toBe(instances[0]);
    expect(second).toBe(instances[1]);
    expect(instances[0].destroy).toHaveBeenCalledOnce();
    expect(instances[1].destroy).not.toHaveBeenCalled();
    expect(playerOptions[1]?.playerVars).toMatchObject({ listType: "playlist", list: "PL1234567890" });
  });

  it("maps raw player errors into application failures", async () => {
    const { playerFailureFromCode } = await import("./youtubeIframe");
    expect(playerFailureFromCode(2).code).toBe("invalid-media");
    expect(playerFailureFromCode(5).code).toBe("html5-error");
    expect(playerFailureFromCode(100).code).toBe("unavailable");
    expect(playerFailureFromCode(101).code).toBe("embedding-disabled");
    expect(playerFailureFromCode(150).code).toBe("embedding-disabled");
    expect(playerFailureFromCode(999).code).toBe("initialization-failed");
  });
});
