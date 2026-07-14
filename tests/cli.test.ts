import { describe, expect, test } from "bun:test";
import { HELP_TEXT, parseArgs } from "../url-to-markdown/scripts/lib/cli";

describe("parseArgs", () => {
  test("defaults to markdown output", () => {
    const options = parseArgs(["bun", "src/cli.ts", "https://example.com"]);
    expect(options.format).toBe("markdown");
    expect(options.quiet).toBe(false);
  });

  test("parses quiet file output", () => {
    const options = parseArgs([
      "bun",
      "src/cli.ts",
      "https://example.com",
      "--output",
      "article.md",
      "--quiet",
    ]);

    expect(options.output).toBe("article.md");
    expect(options.quiet).toBe(true);
  });

  test("parses explicit json output format", () => {
    const options = parseArgs(["bun", "src/cli.ts", "https://example.com", "--format", "json"]);
    expect(options.format).toBe("json");
  });

  test("maps --json to json output format", () => {
    const options = parseArgs(["bun", "src/cli.ts", "https://example.com", "--json"]);
    expect(options.format).toBe("json");
  });

  test("parses media download options", () => {
    const options = parseArgs([
      "bun",
      "src/cli.ts",
      "https://example.com",
      "--download-media",
      "--media-dir",
      "./assets",
    ]);

    expect(options.downloadMedia).toBe(true);
    expect(options.mediaDir).toBe("./assets");
  });

  test("parses reusable Chrome options", () => {
    const options = parseArgs([
      "bun",
      "src/cli.ts",
      "https://example.com",
      "--cdp-url",
      "http://127.0.0.1:9222",
      "--chrome-profile-dir",
      "/tmp/url-to-markdown-profile",
    ]);

    expect(options.cdpUrl).toBe("http://127.0.0.1:9222");
    expect(options.chromeProfileDir).toBe("/tmp/url-to-markdown-profile");
  });

  test("rejects removed login and interaction options", () => {
    const removedOptions = [
      ["--wait-for", "interaction"],
      ["--wait-for-interaction"],
      ["--wait-for-login"],
      ["--interaction-timeout", "1000"],
      ["--interaction-poll-interval", "1000"],
      ["--login-timeout", "1000"],
      ["--login-poll-interval", "1000"],
    ];

    for (const removed of removedOptions) {
      expect(() =>
        parseArgs(["bun", "src/cli.ts", "https://example.com", ...removed]),
      ).toThrow(`Unknown option: ${removed[0]}`);
    }
  });

  test("rejects invalid output formats", () => {
    expect(() =>
      parseArgs(["bun", "src/cli.ts", "https://example.com", "--format", "xml"]),
    ).toThrow("Invalid output format");
  });

  test("documents only non-interactive capture options", () => {
    expect(HELP_TEXT).toContain("url-to-markdown");
    expect(HELP_TEXT).toContain("--format <type>");
    expect(HELP_TEXT).toContain("--quiet");
    expect(HELP_TEXT).toContain("--download-media");
    expect(HELP_TEXT).toContain("--cdp-url <url>");
    expect(HELP_TEXT).toContain("--chrome-profile-dir <path>");
    expect(HELP_TEXT).not.toContain("--wait-for");
    expect(HELP_TEXT.toLowerCase()).not.toContain("login");
    expect(HELP_TEXT.toLowerCase()).not.toContain("interaction");
  });
});
