export type ParsedYouTubeUrl = {
  videoId?: string;
  playlistId?: string;
  canonicalUrl: string;
};

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{10,80}$/;
const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function validVideoId(value: string | null): string | undefined {
  return value && VIDEO_ID.test(value) ? value : undefined;
}

function validPlaylistId(value: string | null): string | undefined {
  return value && PLAYLIST_ID.test(value) ? value : undefined;
}

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const videoId = url.hostname.includes("youtu.be")
    ? validVideoId(parts[0] ?? null)
    : validVideoId(
        url.searchParams.get("v")
        ?? (["embed", "shorts", "live"].includes(parts[0] ?? "") ? parts[1] ?? null : null),
      );
  const playlistId = validPlaylistId(url.searchParams.get("list"));

  if (!videoId && !playlistId) return null;

  const canonical = new URL("https://www.youtube.com/watch");
  if (videoId) canonical.searchParams.set("v", videoId);
  if (playlistId) canonical.searchParams.set("list", playlistId);

  return { videoId, playlistId, canonicalUrl: canonical.toString() };
}
