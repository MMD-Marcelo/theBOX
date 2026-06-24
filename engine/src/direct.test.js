import { describe, it, expect } from "vitest";
import { filenameFromUrl } from "./direct.js";

describe("filenameFromUrl", () => {
  it("usa Content-Disposition quando presente", () => {
    expect(filenameFromUrl("https://x.com/a", 'attachment; filename="relatorio.pdf"')).toBe("relatorio.pdf");
  });
  it("suporta filename* (RFC 5987)", () => {
    expect(filenameFromUrl("https://x.com/a", "attachment; filename*=UTF-8''arq%20final.zip")).toBe("arq final.zip");
  });
  it("cai para o ultimo segmento da URL", () => {
    expect(filenameFromUrl("https://x.com/path/video.mp4?token=1")).toBe("video.mp4");
  });
  it("usa nome generico quando nao da pra inferir", () => {
    expect(filenameFromUrl("https://x.com/")).toMatch(/^download/);
  });
});
