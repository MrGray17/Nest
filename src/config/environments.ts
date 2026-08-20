import type { AmbientChannelId, EnvironmentId } from "../domain/types";

export type EnvironmentDefinition = {
  id: EnvironmentId;
  name: string;
  shortName: string;
  icon: string;
  eyebrow: string;
  description: string;
  asset: string;
  channels: AmbientChannelId[];
  accent: string;
};

export const ENVIRONMENTS: EnvironmentDefinition[] = [
  {
    id: "tokyo",
    name: "Rainy Tokyo Café",
    shortName: "Tokyo Café",
    icon: "🌧️",
    eyebrow: "Window seat · rain on glass",
    description: "Rain on glass, low conversation, and a lamp kept warm for you.",
    asset: "/assets/scenes/tokyo-cafe.jpg",
    channels: ["rain", "cafe", "city"],
    accent: "#e59a61",
  },
  {
    id: "sunset",
    name: "Summer Sunset",
    shortName: "Summer Sunset",
    icon: "🌇",
    eyebrow: "Balcony doors · salt air",
    description: "Salt air, slow curtains, and the last gold light over the water.",
    asset: "/assets/scenes/summer-sunset.jpg",
    channels: ["wind", "city"],
    accent: "#e99474",
  },
  {
    id: "midnight",
    name: "Late-Night Coding",
    shortName: "Late Night",
    icon: "🌙",
    eyebrow: "Desk light · city glow",
    description: "A quiet monitor glow, distant windows, and one more careful thought.",
    asset: "/assets/scenes/late-night.jpg",
    channels: ["rain", "city"],
    accent: "#dfad72",
  },
];

export const ENVIRONMENT_MAP = Object.fromEntries(
  ENVIRONMENTS.map((environment) => [environment.id, environment]),
) as Record<EnvironmentId, EnvironmentDefinition>;
