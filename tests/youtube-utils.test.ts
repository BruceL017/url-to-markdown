import { describe, expect, test } from "bun:test";
import {
  buildYouTubeThumbnailCandidates,
  formatTimestampRange,
  parseYouTubeDescriptionChapters,
  parseYouTubeVideoId,
  renderYouTubeTranscriptMarkdown,
} from "../url-to-markdown/scripts/lib/adapters/youtube/utils";

describe("parseYouTubeVideoId", () => {
  test("parses watch, short, live, and shortened URLs", () => {
    expect(parseYouTubeVideoId(new URL("https://www.youtube.com/watch?v=abc123"))).toBe("abc123");
    expect(parseYouTubeVideoId(new URL("https://youtu.be/abc123"))).toBe("abc123");
    expect(parseYouTubeVideoId(new URL("https://www.youtube.com/shorts/abc123"))).toBe("abc123");
    expect(parseYouTubeVideoId(new URL("https://www.youtube.com/live/abc123"))).toBe("abc123");
  });
});

describe("YouTube transcript formatting", () => {
  test("extracts chapters and renders every transcript segment", () => {
    const chapters = parseYouTubeDescriptionChapters(`0:00 Intro
2:15 Deep Dive`);
    expect(chapters).toEqual([
      { title: "Intro", time: 0 },
      { title: "Deep Dive", time: 135 },
    ]);

    const markdown = renderYouTubeTranscriptMarkdown({
      description: "Line one\nLine two",
      chapters: [
        { title: "Intro", time: 0 },
        { title: "Deep Dive", time: 4 },
      ],
      segments: [
        { start: 0, end: 2, text: "Hello everyone." },
        { start: 2, end: 4, text: "Welcome back." },
        { start: 4, end: 7, text: "Now the details." },
      ],
    });

    expect(markdown).toContain("## Description");
    expect(markdown).toContain("### Intro [0:00 -> 0:04]");
    expect(markdown).toContain("[0:02 -> 0:04] Welcome back.");
    expect(markdown).toContain("### Deep Dive [0:04 -> 0:07]");
  });

  test("builds thumbnail candidates and timestamp ranges", () => {
    expect(buildYouTubeThumbnailCandidates("abc123", [])).toEqual([
      "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
      "https://i.ytimg.com/vi/abc123/sddefault.jpg",
      "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      "https://i.ytimg.com/vi/abc123/mqdefault.jpg",
      "https://i.ytimg.com/vi/abc123/default.jpg",
    ]);
    expect(formatTimestampRange(3661, 3675)).toBe("[1:01:01 -> 1:01:15]");
  });
});
