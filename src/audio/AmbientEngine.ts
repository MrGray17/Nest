import type { AmbientChannelId, AmbientMix } from "../domain/types";
import { normalizeMix } from "./ambientState";

type ChannelNodes = {
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
};

const CHANNEL_SCALE: Record<AmbientChannelId, number> = {
  rain: 0.34,
  cafe: 0.18,
  wind: 0.3,
  city: 0.16,
};

export class AmbientEngine {
  private context: AudioContext | null = null;
  private channels = new Map<AmbientChannelId, ChannelNodes>();

  async start(): Promise<void> {
    if (!this.context) this.buildGraph();
    if (!this.context) throw new Error("Ambient audio is not supported in this browser.");
    await this.context.resume();
  }

  setMix(input: AmbientMix): void {
    if (!this.context) return;
    const mix = normalizeMix(input);
    for (const [id, channel] of this.channels) {
      const level = Math.pow(mix[id] / 100, 1.55) * CHANNEL_SCALE[id];
      channel.gain.gain.cancelScheduledValues(this.context.currentTime);
      channel.gain.gain.setTargetAtTime(level, this.context.currentTime, 0.16);
    }
  }

  async stop(): Promise<void> {
    const context = this.context;
    if (!context) return;
    for (const channel of this.channels.values()) {
      for (const source of channel.sources) {
        try { source.stop(); } catch { /* The node may already be stopped. */ }
        source.disconnect();
      }
      channel.gain.disconnect();
    }
    this.channels.clear();
    this.context = null;
    await context.close();
  }

  private buildGraph(): void {
    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const master = context.createGain();
    master.gain.value = 0.82;
    master.connect(context.destination);

    const noise = this.createNoiseBuffer(context, 4);
    this.channels.set("rain", this.createNoiseChannel(context, master, noise, "highpass", 850));
    this.channels.set("cafe", this.createNoiseChannel(context, master, noise, "bandpass", 430));
    this.channels.set("wind", this.createNoiseChannel(context, master, noise, "lowpass", 480, true));
    this.channels.set("city", this.createCityChannel(context, master, noise));
    this.context = context;
  }

  private createNoiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      samples[index] = white * 0.52 + last * 2.2;
    }
    return buffer;
  }

  private createNoiseChannel(
    context: AudioContext,
    destination: AudioNode,
    buffer: AudioBuffer,
    filterType: BiquadFilterType,
    frequency: number,
    modulate = false,
  ): ChannelNodes {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = filterType === "bandpass" ? 0.45 : 0.2;
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(destination);
    source.start();

    const sources: AudioScheduledSourceNode[] = [source];
    if (modulate) {
      const lfo = context.createOscillator();
      const depth = context.createGain();
      lfo.frequency.value = 0.075;
      depth.gain.value = 0.055;
      lfo.connect(depth).connect(gain.gain);
      lfo.start();
      sources.push(lfo);
    }
    return { gain, sources };
  }

  private createCityChannel(context: AudioContext, destination: AudioNode, noise: AudioBuffer): ChannelNodes {
    const base = this.createNoiseChannel(context, destination, noise, "lowpass", 190);
    const hum = context.createOscillator();
    const humGain = context.createGain();
    hum.type = "sine";
    hum.frequency.value = 58;
    humGain.gain.value = 0.045;
    hum.connect(humGain).connect(base.gain);
    hum.start();
    base.sources.push(hum);
    return base;
  }
}
