import { describe, it, expect } from "vitest";
import {
  buildPool,
  generatePassword,
  generatePassphrase,
  entropyBits,
  AMBIGUOUS,
} from "./password.js";

describe("buildPool", () => {
  it("inclui grupos selecionados", () => {
    const pool = buildPool({ lower: true, upper: true, digits: true, symbols: false });
    expect(pool).toMatch(/[a-z]/);
    expect(pool).toMatch(/[A-Z]/);
    expect(pool).toMatch(/[0-9]/);
    expect(pool).not.toMatch(/[!@#]/);
  });
  it("excluir ambiguos remove caracteres confusos", () => {
    const pool = buildPool({ lower: true, upper: true, digits: true, excludeAmbiguous: true });
    for (const ch of AMBIGUOUS) {
      expect(pool.includes(ch)).toBe(false);
    }
  });
  it("sem grupos resulta em pool vazio", () => {
    expect(buildPool({})).toBe("");
  });
});

describe("generatePassword", () => {
  it("respeita o tamanho", () => {
    const pwd = generatePassword({ length: 20, lower: true, upper: true, digits: true, symbols: true });
    expect(pwd).toHaveLength(20);
  });
  it("usa apenas caracteres do pool", () => {
    const pwd = generatePassword({ length: 40, lower: true, digits: true });
    expect(pwd).toMatch(/^[a-z0-9]+$/);
  });
  it("garante ao menos um caractere de cada grupo escolhido", () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword({ length: 4, lower: true, upper: true, digits: true, symbols: true });
      expect(pwd).toMatch(/[a-z]/);
      expect(pwd).toMatch(/[A-Z]/);
      expect(pwd).toMatch(/[0-9]/);
      expect(pwd).toMatch(/[^a-zA-Z0-9]/);
    }
  });
  it("lanca erro se nenhum grupo for selecionado", () => {
    expect(() => generatePassword({ length: 10 })).toThrow();
  });
  it("lanca erro se tamanho menor que numero de grupos", () => {
    expect(() =>
      generatePassword({ length: 2, lower: true, upper: true, digits: true, symbols: true })
    ).toThrow();
  });
});

describe("generatePassphrase", () => {
  const wordlist = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot"];
  it("retorna o numero de palavras pedido", () => {
    const phrase = generatePassphrase({ words: 4, separator: "-", wordlist });
    expect(phrase.split("-")).toHaveLength(4);
  });
  it("usa apenas palavras da lista", () => {
    const phrase = generatePassphrase({ words: 5, separator: " ", wordlist });
    for (const word of phrase.split(" ")) {
      expect(wordlist).toContain(word);
    }
  });
});

describe("entropyBits", () => {
  it("calcula comprimento x log2(pool)", () => {
    expect(entropyBits(10, 26)).toBeCloseTo(47.0, 1);
  });
  it("pool de 1 ou menos da zero", () => {
    expect(entropyBits(10, 1)).toBe(0);
  });
});
