import { describe, expect, it } from "vitest";
import { normalizeOcrOptions } from "./ocr.js";

describe("normalizeOcrOptions", () => {
  it("usa portugues e ingles, layout automatico e 300 DPI por padrao", () => {
    expect(normalizeOcrOptions()).toEqual({
      languages: "por+eng",
      layout: "auto",
      dpi: 300,
      psm: "3",
    });
  });

  it("aceita idiomas, layout e DPI suportados", () => {
    expect(normalizeOcrOptions({ languages: "spa+por", layout: "sparse", dpi: 400 })).toEqual({
      languages: "spa+por",
      layout: "sparse",
      dpi: 400,
      psm: "11",
    });
  });

  it("remove idiomas invalidos e limita DPI", () => {
    expect(normalizeOcrOptions({ languages: "xxx", layout: "desconhecido", dpi: 900 })).toEqual({
      languages: "por+eng",
      layout: "auto",
      dpi: 400,
      psm: "3",
    });
    expect(normalizeOcrOptions({ dpi: 20 }).dpi).toBe(150);
  });
});
