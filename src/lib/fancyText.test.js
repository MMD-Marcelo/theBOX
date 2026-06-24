import { describe, it, expect } from "vitest";
import { bold, italic, boldItalic, monospace, sansBold, strike, underline, upsideDown, STYLES } from "./fancyText.js";

const cp = (s) => s.codePointAt(0);

describe("bold", () => {
  it("mapeia A/a/0 para negrito matematico", () => {
    expect(cp(bold("A"))).toBe(0x1d400);
    expect(cp(bold("a"))).toBe(0x1d41a);
    expect(cp(bold("0"))).toBe(0x1d7ce);
  });
  it("mantem caracteres nao mapeados", () => {
    expect(bold("A!")).toMatch(/!$/);
  });
});

describe("monospace", () => {
  it("mapeia A", () => {
    expect(cp(monospace("A"))).toBe(0x1d670);
  });
});

describe("sansBold", () => {
  it("mapeia A", () => {
    expect(cp(sansBold("A"))).toBe(0x1d5d4);
  });
});

describe("italic", () => {
  it("usa o h especial (sem buraco)", () => {
    expect(cp(italic("h"))).toBe(0x210e);
  });
  it("mapeia a", () => {
    expect(cp(italic("a"))).toBe(0x1d44e);
  });
});

describe("boldItalic", () => {
  it("mapeia A", () => {
    expect(cp(boldItalic("A"))).toBe(0x1d468);
  });
});

describe("strike / underline", () => {
  it("adiciona combinante de tachado", () => {
    expect(strike("a")).toBe("a̶");
  });
  it("adiciona combinante de sublinhado", () => {
    expect(underline("a")).toBe("a̲");
  });
});

describe("upsideDown", () => {
  it("inverte e mapeia", () => {
    expect(upsideDown("a")).toBe("ɐ");
    expect(upsideDown("ab")).toBe("qɐ");
  });
});

describe("STYLES", () => {
  it("lista os estilos com nome e funcao", () => {
    expect(STYLES.length).toBeGreaterThanOrEqual(6);
    for (const s of STYLES) {
      expect(typeof s.label).toBe("string");
      expect(typeof s.fn).toBe("function");
    }
  });
});
