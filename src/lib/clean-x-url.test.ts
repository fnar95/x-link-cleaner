import { describe, expect, it } from "vitest";
import { cleanXUrl, EXAMPLE_URL } from "./clean-x-url";

describe("cleanXUrl", () => {
  it("removes query parameters and returns the canonical x.com URL", () => {
    const r = cleanXUrl("https://x.com/jack/status/20?a=abc123&s=48");
    expect(r).toMatchObject({ ok: true, url: "https://x.com/jack/status/20" });
    if (r.ok) expect(r.removedParams).toEqual(["a=abc123", "s=48"]);
  });

  it("cleans the built-in example", () => {
    const r = cleanXUrl(EXAMPLE_URL);
    expect(r.ok && r.url).toBe("https://x.com/NASA/status/1834567890123456789");
  });

  it.each([
    "https://www.x.com/jack/status/20",
    "https://twitter.com/jack/status/20",
    "https://www.twitter.com/jack/status/20",
    "https://mobile.twitter.com/jack/status/20",
    "http://TWITTER.com/jack/status/20",
    "x.com/jack/status/20",
  ])("accepts %s and rewrites to x.com", (input) => {
    const r = cleanXUrl(input);
    expect(r.ok && r.url).toBe("https://x.com/jack/status/20");
  });

  it.each([
    "https://evilx.com/jack/status/20",
    "https://x.com.evil.com/jack/status/20",
    "https://m.twitter.com/jack/status/20",
    "https://facebook.com/jack/status/20",
  ])("rejects unsupported host %s", (input) => {
    expect(cleanXUrl(input)).toEqual({ ok: false, error: "unsupported_host" });
  });

  it.each([
    "https://x.com/jack",
    "https://x.com/jack/status/abc",
    "https://x.com/jack/status/",
    "https://x.com/home",
  ])("rejects non-post path %s", (input) => {
    expect(cleanXUrl(input)).toEqual({ ok: false, error: "not_a_post" });
  });

  it("rejects non-http schemes and credentials", () => {
    expect(cleanXUrl("javascript:alert(1)//x.com/a/status/1")).toEqual({ ok: false, error: "invalid_url" });
    expect(cleanXUrl("javascript:alert(1)")).toEqual({ ok: false, error: "invalid_url" });
    expect(cleanXUrl("https://user:pw@x.com/jack/status/20")).toEqual({
      ok: false,
      error: "invalid_url",
    });
  });

  it("rejects empty input", () => {
    expect(cleanXUrl("   ")).toEqual({ ok: false, error: "empty" });
  });

  it("removes /photo/1 and /video/1 by default", () => {
    expect(cleanXUrl("https://x.com/jack/status/20/photo/1?s=20")).toMatchObject({
      url: "https://x.com/jack/status/20",
      removedPath: "/photo/1",
    });
    expect(cleanXUrl("https://x.com/jack/status/20/video/1")).toMatchObject({
      url: "https://x.com/jack/status/20",
    });
  });

  it("keeps /photo/N when stripMedia is off", () => {
    expect(cleanXUrl("https://x.com/jack/status/20/photo/2", { stripMedia: false })).toMatchObject(
      { url: "https://x.com/jack/status/20/photo/2", removedPath: null },
    );
  });

  it("removes the fragment and extracts the URL from surrounding text", () => {
    const r = cleanXUrl("شوف هذا https://twitter.com/jack/status/20?s=48#m رائع");
    expect(r).toMatchObject({ ok: true, url: "https://x.com/jack/status/20", removedHash: "m" });
  });

  it("supports /i/web/status/{id}", () => {
    expect(cleanXUrl("https://twitter.com/i/web/status/20?s=1")).toMatchObject({
      url: "https://x.com/i/status/20",
    });
  });
});
