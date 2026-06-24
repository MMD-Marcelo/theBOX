import { describe, it, expect } from "vitest";
import { parseOptions, pickWinnerIndex, angleForIndex } from "./wheel.js";

describe("parseOptions", () => {
  it("quebra por linha e remove vazias", () => {
    expect(parseOptions("a\n\nb\n  \nc")).toEqual(["a", "b", "c"]);
  });
});

describe("pickWinnerIndex", () => {
  it("retorna indice valido", () => {
    const i = pickWinnerIndex(4, () => 0.5);
    expect(i).toBe(2);
  });
  it("0 opcoes retorna -1", () => {
    expect(pickWinnerIndex(0)).toBe(-1);
  });
});

describe("angleForIndex", () => {
  it("aponta o ponteiro (topo) para o setor do vencedor", () => {
    // 4 setores de 90 graus; vencedor 0 deve trazer rotacao multipla de volta inteira + meio setor no topo
    const a = angleForIndex(0, 4, 0);
    expect(a % 360).toBeCloseTo(360 - 45, 0);
  });
});
