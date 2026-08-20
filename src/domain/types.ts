export type EnvironmentId = "tokyo" | "sunset" | "midnight";
export type LayoutMode = "focus" | "immersive" | "watch";
export type AmbientChannelId = "rain" | "cafe" | "wind" | "city";

export type AmbientMix = Record<AmbientChannelId, number>;

export type YouTubeSource = {
  id: string;
  name: string;
  url: string;
  videoId?: string;
  playlistId?: string;
  createdAt: string;
};

export type SavedSpace = {
  id: string;
  name: string;
  environmentId: EnvironmentId;
  sourceId: string | null;
  durationMinutes: number | null;
  layout: LayoutMode;
  ambient: AmbientMix;
  createdAt: string;
};

export type ActiveSession = {
  task: string;
  environmentId: EnvironmentId;
  sourceId: string | null;
  durationMinutes: number | null;
  startedAt: number;
  accumulatedMs: number;
  runningSince: number | null;
};

export type SessionRecord = {
  id: string;
  task: string;
  environmentId: EnvironmentId;
  sourceId: string | null;
  startedAt: string;
  endedAt: string;
  minutes: number;
  note?: string;
};

export type BreakState = {
  startedAt: number;
  endsAt: number;
};

export type NestSettings = {
  environmentId: EnvironmentId;
  sourceId: string | null;
  durationMinutes: number | null;
  customDurationMinutes: number;
  layout: LayoutMode;
  ambient: AmbientMix;
  youtubeVolume: number;
  currentTask: string;
  hasEntered: boolean;
};

export type NestData = {
  version: 2;
  settings: NestSettings;
  sources: YouTubeSource[];
  spaces: SavedSpace[];
  history: SessionRecord[];
  activeSession: ActiveSession | null;
  breakState: BreakState | null;
};

export const DEFAULT_AMBIENT: AmbientMix = {
  rain: 34,
  cafe: 12,
  wind: 0,
  city: 8,
};

export const DEFAULT_DATA: NestData = {
  version: 2,
  settings: {
    environmentId: "tokyo",
    sourceId: null,
    durationMinutes: 45,
    customDurationMinutes: 50,
    layout: "focus",
    ambient: DEFAULT_AMBIENT,
    youtubeVolume: 70,
    currentTask: "",
    hasEntered: false,
  },
  sources: [],
  spaces: [],
  history: [],
  activeSession: null,
  breakState: null,
};
