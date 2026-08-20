// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { YouTubeSource } from "../domain/types";
import YouTubePlayer from "./YouTubePlayer";

const firstSource: YouTubeSource = { id: "one", name: "One", url: "https://youtube.com/watch?v=dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ", createdAt: "now" };
const secondSource: YouTubeSource = { id: "two", name: "Two", url: "https://youtube.com/playlist?list=PL1234567890", playlistId: "PL1234567890", createdAt: "now" };

type FakeOptions = {
  events: {
    onReady: (event: { target: ReturnType<typeof fakeInstance> }) => void;
    onError: (event: { data: number }) => void;
    onAutoplayBlocked: () => void;
  };
};

function fakeInstance() {
  return { destroy: vi.fn(), playVideo: vi.fn(), pauseVideo: vi.fn(), setVolume: vi.fn() };
}

describe("YouTubePlayer", () => {
  beforeEach(() => {
    vi.useRealTimers();
    delete window.onYouTubeIframeAPIReady;
  });

  it("is StrictMode-safe and transitions from loading to ready", async () => {
    const instances: ReturnType<typeof fakeInstance>[] = [];
    const Player = vi.fn(function FakePlayer(_element: HTMLElement, options: FakeOptions) {
      const instance = fakeInstance();
      instances.push(instance);
      queueMicrotask(() => options.events.onReady({ target: instance }));
      return instance;
    });
    window.YT = { Player } as unknown as Window["YT"];
    const view = render(<StrictMode><YouTubePlayer source={firstSource} volume={64} /></StrictMode>);
    expect(screen.getByRole("status")).toHaveTextContent("Warming up YouTube");
    expect(await screen.findByText("", { selector: ".youtube-player.player-ready" })).toBeInTheDocument();
    expect(Player).toHaveBeenCalledOnce();
    expect(instances[0].setVolume).toHaveBeenCalledWith(64);
    view.unmount();
    expect(instances[0].destroy).toHaveBeenCalledOnce();
  });

  it("destroys the old player when switching media without stale cleanup touching the new player", async () => {
    const instances: ReturnType<typeof fakeInstance>[] = [];
    const Player = vi.fn(function FakePlayer(_element: HTMLElement, options: FakeOptions) {
      const instance = fakeInstance();
      instances.push(instance);
      queueMicrotask(() => options.events.onReady({ target: instance }));
      return instance;
    });
    window.YT = { Player } as unknown as Window["YT"];
    const view = render(<YouTubePlayer source={firstSource} volume={50} />);
    await screen.findByText("", { selector: ".youtube-player.player-ready" });
    view.rerender(<YouTubePlayer source={secondSource} volume={50} />);
    await act(async () => {});
    expect(instances[0].destroy).toHaveBeenCalledOnce();
    expect(instances[1].destroy).not.toHaveBeenCalled();
  });

  it("leaves loading for friendly errors and offers retry when appropriate", async () => {
    const Player = vi.fn(function FakePlayer(_element: HTMLElement, options: FakeOptions) {
      const instance = fakeInstance();
      queueMicrotask(() => options.events.onError({ data: 5 }));
      return instance;
    });
    window.YT = { Player } as unknown as Window["YT"];
    render(<YouTubePlayer source={firstSource} volume={50} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't play");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("Warming up YouTube…")).not.toBeInTheDocument();
  });

  it("distinguishes embedding-disabled and autoplay-blocked failures", async () => {
    let activeOptions: FakeOptions | null = null;
    const Player = vi.fn(function FakePlayer(_element: HTMLElement, options: FakeOptions) {
      activeOptions = options;
      return fakeInstance();
    });
    window.YT = { Player } as unknown as Window["YT"];
    const view = render(<YouTubePlayer source={firstSource} volume={50} />);
    await act(async () => { await Promise.resolve(); });
    act(() => (activeOptions as FakeOptions | null)?.events.onError({ data: 150 }));
    expect(screen.getByRole("alert")).toHaveTextContent("disabled playback");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();

    view.unmount();
    activeOptions = null;
    render(<YouTubePlayer source={firstSource} volume={50} />);
    await act(async () => { await Promise.resolve(); });
    act(() => (activeOptions as FakeOptions | null)?.events.onAutoplayBlocked());
    expect(screen.getByRole("alert")).toHaveTextContent("blocked automatic playback");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("times out instead of warming forever", async () => {
    vi.useFakeTimers();
    const Player = vi.fn(function FakePlayer() { return fakeInstance(); });
    window.YT = { Player } as unknown as Window["YT"];
    render(<YouTubePlayer source={firstSource} volume={50} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(screen.getByRole("alert")).toHaveTextContent("too long");
  });
});
