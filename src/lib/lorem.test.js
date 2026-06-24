import { describe, it, expect } from "vitest";
import { words, sentences, paragraphs } from "./lorem.js";

describe("words", () => {
  it("gera a quantidade pedida de palavras", () => {
    expect(words(10).split(/\s+/)).toHaveLength(10);
  });
});

describe("sentences", () => {
  it("gera N frases terminadas em ponto", () => {
    const out = sentences(3);
    expect(out.match(/\./g)).toHaveLength(3);
  });
});

describe("paragraphs", () => {
  it("gera N paragrafos separados por linha em branco", () => {
    const out = paragraphs(2);
    expect(out.split(/\n\n/)).toHaveLength(2);
  });
});
