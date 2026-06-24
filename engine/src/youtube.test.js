import { describe, it, expect } from "vitest";
import { parseFormats, parseProgress, buildDownloadArgs } from "./youtube.js";

const ytdlpJson = {
  title: "Video de Teste",
  thumbnail: "https://i.ytimg.com/vi/abc/maxres.jpg",
  formats: [
    { format_id: "sb0", ext: "mhtml", vcodec: "none", acodec: "none" },
    { format_id: "140", ext: "m4a", vcodec: "none", acodec: "mp4a.40.2", filesize: 3500000 },
    { format_id: "137", ext: "mp4", vcodec: "avc1.640028", acodec: "none", height: 1080, fps: 30, filesize: 50000000 },
    { format_id: "248", ext: "webm", vcodec: "vp9", acodec: "none", height: 1080, fps: 60, filesize_approx: 45000000 },
    { format_id: "22", ext: "mp4", vcodec: "avc1.64001F", acodec: "mp4a.40.2", height: 720, fps: 30 },
  ],
};

describe("parseFormats", () => {
  it("extrai titulo e thumbnail", () => {
    const result = parseFormats(ytdlpJson);
    expect(result.title).toBe("Video de Teste");
    expect(result.thumbnail).toContain("ytimg");
  });
  it("ignora storyboards (sem video e sem audio)", () => {
    const ids = parseFormats(ytdlpJson).formats.map((f) => f.id);
    expect(ids).not.toContain("sb0");
  });
  it("normaliza um formato de video", () => {
    const f = parseFormats(ytdlpJson).formats.find((x) => x.id === "137");
    expect(f).toMatchObject({
      id: "137",
      resolution: "1080p",
      fps: 30,
      ext: "mp4",
      filesize: 50000000,
      hasVideo: true,
      hasAudio: false,
    });
    expect(f.codec).toContain("avc1");
  });
  it("usa filesize_approx quando filesize falta", () => {
    const f = parseFormats(ytdlpJson).formats.find((x) => x.id === "248");
    expect(f.filesize).toBe(45000000);
    expect(f.fps).toBe(60);
  });
  it("marca audio-only corretamente", () => {
    const f = parseFormats(ytdlpJson).formats.find((x) => x.id === "140");
    expect(f.hasVideo).toBe(false);
    expect(f.hasAudio).toBe(true);
  });
});

describe("parseProgress", () => {
  it("le linha de progresso completa", () => {
    const p = parseProgress("[download]  45.2% of 10.00MiB at 1.50MiB/s ETA 00:05");
    expect(p).toMatchObject({ percent: 45.2, speed: "1.50MiB/s", eta: "00:05" });
  });
  it("le 100%", () => {
    expect(parseProgress("[download] 100% of 10.00MiB in 00:06").percent).toBe(100);
  });
  it("retorna null para linha sem progresso", () => {
    expect(parseProgress("[download] Destination: video.mp4")).toBe(null);
    expect(parseProgress("texto qualquer")).toBe(null);
  });
});

describe("buildDownloadArgs", () => {
  it("mp4: seleciona formato + bestaudio e faz merge", () => {
    const args = buildDownloadArgs({ url: "U", formatId: "137", output: "mp4", outDir: "/out" });
    expect(args).toContain("-f");
    expect(args.join(" ")).toContain("137+bestaudio");
    expect(args.join(" ")).toContain("--merge-output-format");
    expect(args).toContain("U");
  });
  it("mp3: extrai audio", () => {
    const args = buildDownloadArgs({ url: "U", output: "mp3", outDir: "/out" });
    expect(args).toContain("-x");
    expect(args.join(" ")).toContain("mp3");
  });
});
