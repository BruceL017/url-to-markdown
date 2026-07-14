import { describe, expect, test } from "bun:test";
import { formatOutputContent } from "../url-to-markdown/scripts/lib/commands/convert";

describe("formatOutputContent", () => {
  test("returns raw markdown for markdown output", () => {
    expect(
      formatOutputContent("markdown", {
        adapter: "generic",
        status: "ok",
        media: [],
        downloads: null,
        document: {
          url: "https://example.com",
          content: [],
        },
        markdown: "# Example",
      }),
    ).toBe("# Example");
  });

  test("returns structured json for json output", () => {
    const parsed = JSON.parse(
      formatOutputContent("json", {
        adapter: "generic",
        status: "ok",
        media: [],
        downloads: null,
        document: {
          url: "https://example.com",
          content: [],
        },
        markdown: "# Example",
      }),
    );

    expect(parsed.status).toBe("ok");
    expect(parsed.markdown).toBe("# Example");
    expect(parsed.document.url).toBe("https://example.com");
    expect(parsed).not.toHaveProperty("login");
    expect(parsed).not.toHaveProperty("interaction");
  });
});
