import type { TimeOfDay } from "../atmosphere/atmosphere.types";
import type { AmbientChannelId, EnvironmentId } from "../domain/types";

export type EnvironmentTimeArt = Record<TimeOfDay, string>;

export type EnvironmentDefinition = {
  id: EnvironmentId;
  name: string;
  shortName: string;
  icon: string;
  eyebrow: string;
  description: string;
  baseAsset: string;
  timeArt: EnvironmentTimeArt;
  channels: AmbientChannelId[];
  accent: string;
};

export const ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    id: "tokyo",
    name: "Rainy Tokyo Café",
    shortName: "Tokyo Café",
    icon: "☕",
    eyebrow: "Window seat · city hush",
    description: "Low conversation, soft traffic, and a lamp kept warm for you.",
    baseAsset: "/assets/scenes/tokyo-cafe.jpg",
    timeArt: {
      dawn: "/assets/scenes/time/tokyo-dawn.svg",
      day: "/assets/scenes/time/tokyo-day.svg",
      sunset: "/assets/scenes/time/tokyo-sunset.svg",
      night: "/assets/scenes/time/tokyo-night.svg",
    },
    channels: ["rain", "cafe", "city"],
    accent: "#e59a61",
  },
  {
    id: "sunset",
    name: "Summer Sunset",
    shortName: "Summer Sunset",
    icon: "🌿",
    eyebrow: "Balcony doors · salt air",
    description: "Open air, slow curtains, and a quiet horizon beyond the room.",
    baseAsset: "/assets/scenes/summer-sunset.jpg",
    timeArt: {
      dawn: "/assets/scenes/time/summer-dawn.svg",
      day: "/assets/scenes/time/summer-day.svg",
      sunset: "/assets/scenes/time/summer-sunset.svg",
      night: "/assets/scenes/time/summer-night.svg",
    },
    channels: ["wind", "city"],
    accent: "#e99474",
  },
  {
    id: "midnight",
    name: "Late-Night Coding",
    shortName: "Late Night",
    icon: "💻",
    eyebrow: "Desk light · city window",
    description: "A quiet desk, distant windows, and one more careful thought.",
    baseAsset: "/assets/scenes/late-night.jpg",
    timeArt: {
      dawn: "/assets/scenes/time/coding-dawn.svg",
      day: "/assets/scenes/time/coding-day.svg",
      sunset: "/assets/scenes/time/coding-sunset.svg",
      night: "/assets/scenes/time/coding-night.svg",
    },
    channels: ["rain", "city"],
    accent: "#dfad72",
  },
];

export const ENVIRONMENT_MAP = Object.fromEntries(
  ENVIRONMENTS.map((environment) => [environment.id, environment]),
) as Record<EnvironmentId, EnvironmentDefinition>;

export function environmentTimeArt(environmentId: EnvironmentId, timeOfDay: TimeOfDay): string {
  return ENVIRONMENT_MAP[environmentId].timeArt[timeOfDay];
}
