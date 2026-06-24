import { describe, it, expect } from "vitest";
import { ytdlpDownloadUrl, binaryName } from "./binaries.js";

describe("binaryName", () => {
  it("adiciona .exe no windows", () => {
    expect(binaryName("yt-dlp", "win32")).toBe("yt-dlp.exe");
    expect(binaryName("ffmpeg", "win32")).toBe("ffmpeg.exe");
  });
  it("sem extensao em linux/mac", () => {
    expect(binaryName("yt-dlp", "linux")).toBe("yt-dlp");
    expect(binaryName("yt-dlp", "darwin")).toBe("yt-dlp");
  });
});

describe("ytdlpDownloadUrl", () => {
  it("windows usa yt-dlp.exe", () => {
    expect(ytdlpDownloadUrl("win32")).toMatch(/yt-dlp\.exe$/);
  });
  it("macos usa build macos", () => {
    expect(ytdlpDownloadUrl("darwin")).toMatch(/yt-dlp_macos$/);
  });
  it("linux usa binario generico", () => {
    expect(ytdlpDownloadUrl("linux")).toMatch(/yt-dlp$/);
  });
  it("aponta para releases do yt-dlp", () => {
    expect(ytdlpDownloadUrl("linux")).toContain("github.com/yt-dlp/yt-dlp/releases");
  });
});
