import { describe, it, expect } from "vitest";
import { randomInt, randomNumbers, draw, pickOne } from "./randomGen.js";

describe("randomInt", () => {
  it("fica no intervalo inclusivo", () => {
    for (let i = 0; i < 100; i++) {
      const n = randomInt(5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });
});

describe("randomNumbers", () => {
  it("gera a quantidade pedida", () => {
    expect(randomNumbers(7, 1, 100)).toHaveLength(7);
  });
});

describe("draw", () => {
  it("sorteia N itens sem repeticao", () => {
    const res = draw(["a", "b", "c", "d", "e"], 3);
    expect(res).toHaveLength(3);
    expect(new Set(res).size).toBe(3);
  });
  it("limita ao tamanho da lista", () => {
    expect(draw(["a", "b"], 5)).toHaveLength(2);
  });
});

describe("pickOne", () => {
  it("retorna um item da lista", () => {
    const list = ["x", "y", "z"];
    expect(list).toContain(pickOne(list));
  });
});
