import { describe, it, expect } from "vitest";
import { checkHealth, analyze, startDownload, startDirect, convertFile, ocr, parseTokenFromHash, fileUrl, progressUrl, ENGINE_URL } from "./engineClient.js";

const TOKEN = "tok123";

function okFetch(payload, captured = {}) {
  return async (url, options) => {
    captured.url = url;
    captured.options = options;
    return { ok: true, status: 200, json: async () => payload };
  };
}

describe("checkHealth", () => {
  it("retorna dados quando o motor responde", async () => {
    const health = await checkHealth({ fetchImpl: okFetch({ ok: true, ytdlp: true, ffmpeg: true }) });
    expect(health.ytdlp).toBe(true);
  });
  it("bate em /health do motor", async () => {
    const cap = {};
    await checkHealth({ fetchImpl: okFetch({ ok: true }, cap) });
    expect(cap.url).toBe(`${ENGINE_URL}/health`);
  });
  it("lanca quando o motor esta offline", async () => {
    const failFetch = async () => {
      throw new Error("ECONNREFUSED");
    };
    await expect(checkHealth({ fetchImpl: failFetch })).rejects.toThrow();
  });
});

describe("analyze", () => {
  it("envia token e url e retorna formatos", async () => {
    const cap = {};
    const data = await analyze("https://yt/abc", TOKEN, {
      fetchImpl: okFetch({ title: "X", formats: [{ id: "137" }] }, cap),
    });
    expect(cap.url).toBe(`${ENGINE_URL}/analyze`);
    expect(cap.options.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(cap.options.body).url).toBe("https://yt/abc");
    expect(data.formats[0].id).toBe("137");
  });
  it("lanca em resposta de erro", async () => {
    const errFetch = async () => ({ ok: false, status: 401, json: async () => ({ error: "Token invalido" }) });
    await expect(analyze("u", "bad", { fetchImpl: errFetch })).rejects.toThrow(/Token invalido/);
  });
});

describe("startDownload", () => {
  it("posta url/formato/output e retorna jobId", async () => {
    const cap = {};
    const res = await startDownload(
      { url: "u", formatId: "137", output: "mp4" },
      TOKEN,
      { fetchImpl: okFetch({ jobId: "job-1" }, cap) }
    );
    expect(cap.url).toBe(`${ENGINE_URL}/download`);
    const body = JSON.parse(cap.options.body);
    expect(body).toMatchObject({ url: "u", formatId: "137", output: "mp4" });
    expect(res.jobId).toBe("job-1");
  });
});

describe("startDirect", () => {
  it("posta a url para /direct e retorna jobId", async () => {
    const cap = {};
    const res = await startDirect("https://x/a.zip", TOKEN, { fetchImpl: okFetch({ jobId: "d-1" }, cap) });
    expect(cap.url).toBe(`${ENGINE_URL}/direct`);
    expect(JSON.parse(cap.options.body).url).toBe("https://x/a.zip");
    expect(res.jobId).toBe("d-1");
  });
});

describe("convertFile", () => {
  it("envia arquivo no corpo com name/to/bitrate na query", async () => {
    const cap = {};
    const file = { name: "video.mov" };
    const res = await convertFile(file, { to: "mp3", bitrate: 320 }, TOKEN, { fetchImpl: okFetch({ jobId: "c-1" }, cap) });
    expect(cap.url).toContain(`${ENGINE_URL}/convert?`);
    expect(cap.url).toContain("name=video.mov");
    expect(cap.url).toContain("to=mp3");
    expect(cap.url).toContain("bitrate=320");
    expect(cap.options.body).toBe(file);
    expect(res.jobId).toBe("c-1");
  });
});

describe("ocr", () => {
  it("envia imagem e configuracao na query", async () => {
    const cap = {};
    const image = { name: "scan.png" };
    const result = await ocr(
      image,
      TOKEN,
      { languages: "por+eng", layout: "sparse", dpi: 300 },
      { fetchImpl: okFetch({ text: "texto", confidence: 91 }, cap) }
    );
    expect(cap.url).toContain(`${ENGINE_URL}/ocr?`);
    expect(cap.url).toContain("languages=por%2Beng");
    expect(cap.url).toContain("layout=sparse");
    expect(cap.url).toContain("dpi=300");
    expect(cap.options.body).toBe(image);
    expect(result.confidence).toBe(91);
  });
});

describe("parseTokenFromHash", () => {
  it("extrai token do fragmento", () => {
    expect(parseTokenFromHash("#thebox-token=abc123")).toBe("abc123");
  });
  it("funciona com outros params antes", () => {
    expect(parseTokenFromHash("#foo=1&thebox-token=xyz")).toBe("xyz");
  });
  it("retorna null sem token", () => {
    expect(parseTokenFromHash("#nada")).toBe(null);
    expect(parseTokenFromHash("")).toBe(null);
  });
});

describe("fileUrl", () => {
  it("monta URL do arquivo com token", () => {
    expect(fileUrl("job-1", TOKEN)).toBe(`${ENGINE_URL}/file/job-1?token=${TOKEN}`);
  });
});

describe("progressUrl", () => {
  it("monta URL SSE com token na query", () => {
    expect(progressUrl("job-1", TOKEN)).toBe(`${ENGINE_URL}/progress/job-1?token=${TOKEN}`);
  });
});
