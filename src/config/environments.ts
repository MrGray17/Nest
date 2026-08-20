import type { TimeOfDay } from "../atmosphere/atmosphere.types";
import type { AmbientChannelId, EnvironmentId } from "../domain/types";

export type EnvironmentAssets = Record<TimeOfDay, string>;

export type EnvironmentDefinition = {
  id: EnvironmentId;
  name: string;
  shortName: string;
  icon: string;
  eyebrow: string;
  description: string;
  assets: EnvironmentAssets;
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
    assets: {
      dawn: "/assets/scenes/tokyo-cafe-dawn.jpg",
      day: "/assets/scenes/tokyo-cafe-day.jpg",
      sunset: "/assets/scenes/tokyo-cafe-sunset.jpg",
      night: "/assets/scenes/tokyo-cafe-night.jpg",
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
    assets: {
      dawn: "/assets/scenes/summer-sunset-dawn.jpg",
      day: "/assets/scenes/summer-sunset-day.jpg",
      sunset: "/assets/scenes/summer-sunset-sunset.jpg",
      night: "/assets/scenes/summer-sunset-night.jpg",
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
    assets: {
      dawn: "/assets/scenes/late-night-dawn.jpg",
      day: "/assets/scenes/late-night-day.jpg",
      sunset: "/assets/scenes/late-night-sunset.jpg",
      night: "/assets/scenes/late-night-night.jpg",
    },
    channels: ["rain", "city"],
    accent: "#dfad72",
  },
];

export const ENVIRONMENT_MAP = Object.fromEntries(
  ENVIRONMENTS.map((environment) => [environment.id, environment]),
) as Record<EnvironmentId, EnvironmentDefinition>;

export function environmentAsset(environmentId: EnvironmentId, timeOfDay: TimeOfDay): string {
  return ENVIRONMENT_MAP[environmentId].assets[timeOfDay];
}
