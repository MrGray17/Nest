// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AmbientEngine } from "./AmbientEngine";

class FakeAudioParam {
  value = 0;
  cancelScheduledValues = vi.fn();
  setTargetAtTime = vi.fn();
}

class FakeNode {
  disconnect = vi.fn();
  connect(destination: FakeNode | FakeAudioParam) { return destination; }
}

class FakeSource extends FakeNode {
  start = vi.fn();
  stop = vi.fn();
  buffer: AudioBuffer | null = null;
  loop = false;
  frequency = new FakeAudioParam();
  type = "sine";
}

class FakeGain extends FakeNode { gain = new FakeAudioParam(); }
class FakeFilter extends FakeNode { frequency = new FakeAudioParam(); Q = new FakeAudioParam(); type = "lowpass"; }

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 2;
  sampleRate = 10;
  destination = new FakeNode();
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  constructor() { FakeAudioContext.instances.push(this); }
  createGain() { const node = new FakeGain(); this.gains.push(node); return node; }
  createBuffer() { return { getChannelData: () => new Float32Array(40) }; }
  createBufferSource() { const node = new FakeSource(); this.sources.push(node); return node; }
  createBiquadFilter() { return new FakeFilter(); }
  createOscillator() { const node = new FakeSource(); this.sources.push(node); return node; }
}

describe("AmbientEngine", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    Object.defineProperty(window, "AudioContext", { configurable: true, value: FakeAudioContext });
  });

  it("owns one graph, applies volume, and releases every source", async () => {
    const engine = new AmbientEngine();
    await engine.start();
    await engine.start();
    expect(FakeAudioContext.instances).toHaveLength(1);
    const context = FakeAudioContext.instances[0];
    expect(context.resume).toHaveBeenCalledTimes(2);
    engine.setMix({ rain: 50, cafe: 25, wind: 0, city: 10 });
    expect(context.gains.some((gain) => gain.gain.setTargetAtTime.mock.calls.length > 0)).toBe(true);

    await engine.stop();
    expect(context.sources.every((source) => source.stop.mock.calls.length === 1)).toBe(true);
    expect(context.sources.every((source) => source.disconnect.mock.calls.length === 1)).toBe(true);
    expect(context.close).toHaveBeenCalledOnce();
  });

  it("can build a fresh graph after cleanup", async () => {
    const engine = new AmbientEngine();
    await engine.start();
    await engine.stop();
    await engine.start();
    expect(FakeAudioContext.instances).toHaveLength(2);
  });
});
