import { describe, expect, test } from "bun:test";
import {
  detectAccessBlockFromSnapshot,
  type AccessBlockSnapshot,
} from "../url-to-markdown/scripts/lib/browser/access-blocks";

function snapshot(overrides: Partial<AccessBlockSnapshot> = {}): AccessBlockSnapshot {
  return {
    title: "Example",
    currentUrl: "https://example.com/article",
    bodyText: "Normal article body",
    hasPasswordInput: false,
    hasUsernameInput: false,
    hasLoginHeading: false,
    hasCloudflareTurnstile: false,
    hasCloudflareChallenge: false,
    hasRecaptcha: false,
    hasRecaptchaIframe: false,
    hasHcaptcha: false,
    hasHcaptchaIframe: false,
    ...overrides,
  };
}

describe("detectAccessBlockFromSnapshot", () => {
  test("detects strong login walls", () => {
    expect(
      detectAccessBlockFromSnapshot(snapshot({
        currentUrl: "https://x.com/i/flow/login",
        bodyText: "Sign in to X",
        hasUsernameInput: true,
        hasLoginHeading: true,
      }))?.kind,
    ).toBe("login");

    expect(
      detectAccessBlockFromSnapshot(snapshot({
        bodyText: "Sign in to continue",
        hasPasswordInput: true,
      }))?.kind,
    ).toBe("login");
  });

  test("does not block an ordinary login link on an article", () => {
    expect(
      detectAccessBlockFromSnapshot(snapshot({
        bodyText: `${"Long public article content. ".repeat(100)} Sign in`,
      })),
    ).toBeNull();
  });

  test("detects Cloudflare, reCAPTCHA, and hCaptcha", () => {
    expect(
      detectAccessBlockFromSnapshot(snapshot({
        title: "Just a moment...",
        hasCloudflareChallenge: true,
      }))?.kind,
    ).toBe("cloudflare");

    expect(
      detectAccessBlockFromSnapshot(snapshot({
        bodyText: "Please complete reCAPTCHA",
        hasRecaptcha: true,
      }))?.kind,
    ).toBe("recaptcha");

    expect(
      detectAccessBlockFromSnapshot(snapshot({
        bodyText: "Please complete hCaptcha",
        hasHcaptcha: true,
      }))?.kind,
    ).toBe("hcaptcha");
  });

  test("returns null when no access block is present", () => {
    expect(detectAccessBlockFromSnapshot(snapshot())).toBeNull();
  });
});
