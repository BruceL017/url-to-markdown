import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dir, "..");
const CLI = path.join(ROOT, "url-to-markdown/scripts/url-to-markdown");
const PIXEL = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="),
  (character) => character.charCodeAt(0),
);

const server = Bun.serve({
  port: 0,
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/fixture.png") {
      return new Response(PIXEL, { headers: { "content-type": "image/png" } });
    }
    if (url.pathname === "/generic-login-wall" || url.pathname === "/user/status/123") {
      return new Response(
        `<!doctype html><html><head><title>Sign in</title></head><body>
          <main><h1>Sign in</h1><form><input name="username"><input type="password"></form></main>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    if (url.pathname === "/cloudflare") {
      return new Response(
        `<!doctype html><html><head><title>Just a moment...</title></head><body>
          <main id="challenge-running">Checking your browser before accessing this page</main>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    if (url.pathname === "/recaptcha") {
      return new Response(
        `<!doctype html><html><head><title>Verification</title></head><body>
          <main><div class="g-recaptcha">Please complete reCAPTCHA</div></main>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    if (url.pathname === "/hcaptcha") {
      return new Response(
        `<!doctype html><html><head><title>Verification</title></head><body>
          <main><div class="h-captcha">Please complete hCaptcha</div></main>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    return new Response(
      `<!doctype html>
      <html>
        <head><title>Local Capture Fixture</title></head>
        <body>
          <main><article>
            <h1>Local Capture Fixture</h1>
            <p>This unique local paragraph verifies rendered browser extraction.</p>
            <figure>
              <img src="${url.origin}/fixture.png" alt="fixture image" width="640" height="360">
              <figcaption>Local media fixture</figcaption>
            </figure>
          </article></main>
        </body>
      </html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } },
    );
  },
});

afterAll(() => server.stop(true));

async function runCli(args: string[], cwd: string) {
  const process = Bun.spawn([CLI, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

describe("local browser capture", () => {
  test("writes Markdown, JSON, and localized media", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "url-to-markdown-e2e-"));
    const pageUrl = `http://127.0.0.1:${server.port}/article`;
    const profileDir = path.join(tempRoot, "profile");
    const markdownPath = path.join(tempRoot, "capture.md");
    const jsonPath = path.join(tempRoot, "capture.json");

    try {
      const markdownRun = await runCli([
        pageUrl,
        "--headless",
        "--output",
        markdownPath,
        "--download-media",
        "--chrome-profile-dir",
        profileDir,
      ], tempRoot);
      expect(markdownRun.exitCode, markdownRun.stderr).toBe(0);

      const markdown = fs.readFileSync(markdownPath, "utf8");
      expect(markdown).toContain("Local Capture Fixture");
      expect(markdown).toContain("unique local paragraph");
      expect(markdown).toContain("imgs/");
      expect(fs.readdirSync(path.join(tempRoot, "imgs")).length).toBeGreaterThan(0);

      const jsonRun = await runCli([
        pageUrl,
        "--headless",
        "--json",
        "--output",
        jsonPath,
        "--chrome-profile-dir",
        profileDir,
      ], tempRoot);
      expect(jsonRun.exitCode, jsonRun.stderr).toBe(0);

      const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      expect(payload.adapter).toBe("generic");
      expect(payload.status).toBe("ok");
      expect(payload.document.title).toBe("Local Capture Fixture");
      expect(payload.markdown).toContain("unique local paragraph");
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }, 60_000);

  test("rejects login and verification walls without writing output", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "url-to-markdown-blocked-"));
    const profileDir = path.join(tempRoot, "profile");
    const blockedCases = [
      { name: "generic-login", path: "/generic-login-wall", extra: [] },
      { name: "x-login", path: "/user/status/123", extra: ["--adapter", "x"] },
      { name: "cloudflare", path: "/cloudflare", extra: [] },
      { name: "recaptcha", path: "/recaptcha", extra: [] },
      { name: "hcaptcha-json", path: "/hcaptcha", extra: ["--json"] },
    ];

    try {
      for (const blocked of blockedCases) {
        const outputPath = path.join(tempRoot, `${blocked.name}.md`);
        const result = await runCli([
          `http://127.0.0.1:${server.port}${blocked.path}`,
          "--headless",
          "--output",
          outputPath,
          "--chrome-profile-dir",
          profileDir,
          ...blocked.extra,
        ], tempRoot);

        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain("supports only pages that require no login or manual verification");
        expect(fs.existsSync(outputPath)).toBe(false);
      }
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }, 60_000);
});
