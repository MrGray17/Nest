import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "./youtube";

describe("parseYouTubeUrl", () => {
  it("accepts video, short, live, embed, and playlist URLs", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90s")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("youtube.com/shorts/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("https://www.youtube.com/live/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("https://www.youtube.com/live/dQw4w9WgXcQ?si=example")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeUrl("https://www.youtube.com/playlist?list=PL1234567890")?.playlistId).toBe("PL1234567890");
  });

  it("keeps both ids for a video inside a playlist", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890")).toMatchObject({
      videoId: "dQw4w9WgXcQ",
      playlistId: "PL1234567890",
    });
  });

  it("rejects lookalike hosts, insecure URLs, and malformed ids", () => {
    expect(parseYouTubeUrl("https://youtube.com.example.test/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeUrl("http://youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeUrl("https://youtube.com/watch?v=too-short")).toBeNull();
    expect(parseYouTubeUrl("https://youtube.com/watch")).toBeNull();
    expect(parseYouTubeUrl("not a url")).toBeNull();
  });
});
