import type { AmbientChannelId, AmbientMix, EnvironmentId } from "../domain/types";

const CHANNELS: AmbientChannelId[] = ["rain", "cafe", "wind", "city"];

export function normalizeMix(input: Partial<AmbientMix>): AmbientMix {
  return Object.fromEntries(CHANNELS.map((channel) => [channel, Math.min(100, Math.max(0, Math.round(input[channel] ?? 0)))])) as AmbientMix;
}

export function mixForEnvironment(mix: AmbientMix, environmentId: EnvironmentId): AmbientMix {
  const allowed: Record<EnvironmentId, AmbientChannelId[]> = {
    tokyo: ["rain", "cafe", "city"],
    sunset: ["wind", "city"],
    midnight: ["rain", "city"],
  };
  return Object.fromEntries(CHANNELS.map((channel) => [channel, allowed[environmentId].includes(channel) ? mix[channel] : 0])) as AmbientMix;
}
