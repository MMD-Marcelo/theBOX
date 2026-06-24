import { describe, it, expect } from "vitest";
import { buildConvertArgs, parseDuration, parseProgressTime, percentFrom } from "./media.js";

describe("buildConvertArgs", () => {
  it("mp4 usa H.264 + aac", () => {
    const args = buildConvertArgs({ input: "in.mov", output: "out.mp4", format: "mp4" });
    expect(args.join(" ")).toContain("libx264");
    expect(args.join(" ")).toContain("aac");
    expect(args).toContain("out.mp4");
  });
  it("mp3 extrai audio com bitrate", () => {
    const args = buildConvertArgs({ input: "in.mp4", output: "out.mp3", format: "mp3", bitrate: 320 });
    expect(args).toContain("-vn");
    expect(args.join(" ")).toContain("libmp3lame");
    expect(args.join(" ")).toContain("320k");
  });
  it("webm usa VP9 + Opus (nao H.264)", () => {
    const args = buildConvertArgs({ input: "i.mp4", output: "o.webm", format: "webm" });
    expect(args.join(" ")).toContain("libvpx-vp9");
    expect(args.join(" ")).toContain("libopus");
    expect(args.join(" ")).not.toContain("libx264");
  });
  it("inclui -progress pipe:1 para acompanhar", () => {
    const args = buildConvertArgs({ input: "i", output: "o.mp4", format: "mp4" });
    expect(args.join(" ")).toContain("-progress pipe:1");
  });
});

describe("parseDuration", () => {
  it("le Duration do stderr do ffmpeg", () => {
    expect(parseDuration("  Duration: 00:01:23.45, start: 0.0, bitrate: 1000 kb/s")).toBeCloseTo(83.45, 1);
  });
  it("retorna null sem duracao", () => {
    expect(parseDuration("frame= 10 fps=5")).toBe(null);
  });
});

describe("parseProgressTime", () => {
  it("le out_time do -progress", () => {
    expect(parseProgressTime("out_time=00:00:05.00")).toBeCloseTo(5.0, 1);
  });
  it("retorna null em linha sem out_time", () => {
    expect(parseProgressTime("progress=continue")).toBe(null);
  });
});

describe("percentFrom", () => {
  it("calcula percentual limitado a 100", () => {
    expect(percentFrom(5, 10)).toBe(50);
    expect(percentFrom(20, 10)).toBe(100);
  });
  it("sem duracao retorna null", () => {
    expect(percentFrom(5, 0)).toBe(null);
  });
});
