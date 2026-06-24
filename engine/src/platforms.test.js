import { describe, it, expect } from "vitest";
import { detectPlatform } from "./platforms.js";

describe("detectPlatform", () => {
  const cases = [
    ["https://www.youtube.com/watch?v=abc", "YouTube"],
    ["https://youtu.be/abc", "YouTube"],
    ["https://www.instagram.com/p/abc/", "Instagram"],
    ["https://www.tiktok.com/@u/video/1", "TikTok"],
    ["https://twitter.com/u/status/1", "Twitter/X"],
    ["https://x.com/u/status/1", "Twitter/X"],
    ["https://soundcloud.com/u/track", "SoundCloud"],
    ["https://www.pinterest.com/pin/1/", "Pinterest"],
    ["https://www.linkedin.com/posts/abc", "LinkedIn"],
    ["https://media.site.com/file.mp4", "Arquivo direto"],
  ];
  for (const [url, expected] of cases) {
    it(`${url} -> ${expected}`, () => {
      expect(detectPlatform(url)).toBe(expected);
    });
  }
  it("URL invalida -> Desconhecido", () => {
    expect(detectPlatform("nao e url")).toBe("Desconhecido");
  });
});
