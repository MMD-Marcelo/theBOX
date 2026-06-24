import { describe, it, expect } from "vitest";
import {
  toUpper,
  toLower,
  capitalizeWords,
  sentenceCase,
  reverseText,
  stripAccents,
  removeDoubleSpaces,
  removeEmptyLines,
  removeDuplicateLines,
  sortLines,
  toSlug,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  findReplace,
  countChars,
  countWords,
  countLines,
  removeLineBreaks,
  wordFrequency,
  numberToWordsPtBr,
} from "./textTransform.js";

describe("caixa", () => {
  it("maiusculas", () => {
    expect(toUpper("olá Mundo")).toBe("OLÁ MUNDO");
  });
  it("minusculas", () => {
    expect(toLower("Olá MUNDO")).toBe("olá mundo");
  });
  it("capitaliza cada palavra", () => {
    expect(capitalizeWords("olá mundo cruel")).toBe("Olá Mundo Cruel");
  });
  it("tipo frase capitaliza inicio de cada frase", () => {
    expect(sentenceCase("olá mundo. tudo bem? sim")).toBe("Olá mundo. Tudo bem? Sim");
  });
});

describe("transformacoes basicas", () => {
  it("inverte o texto", () => {
    expect(reverseText("abc")).toBe("cba");
  });
  it("remove acentos", () => {
    expect(stripAccents("ação coração ÀÉÎÕÜ")).toBe("acao coracao AEIOU");
  });
});

describe("limpeza de linhas", () => {
  it("remove espacos duplicados", () => {
    expect(removeDoubleSpaces("a   b  c")).toBe("a b c");
  });
  it("remove linhas vazias", () => {
    expect(removeEmptyLines("a\n\n\nb\n   \nc")).toBe("a\nb\nc");
  });
  it("remove linhas repetidas preservando ordem", () => {
    expect(removeDuplicateLines("a\nb\na\nc\nb")).toBe("a\nb\nc");
  });
  it("ordena linhas alfabeticamente", () => {
    expect(sortLines("banana\nabacaxi\ncaju")).toBe("abacaxi\nbanana\ncaju");
  });
});

describe("formatos de identificador", () => {
  it("slug", () => {
    expect(toSlug("Olá Mundo Cruel!")).toBe("ola-mundo-cruel");
  });
  it("camelCase", () => {
    expect(toCamelCase("olá mundo cruel")).toBe("olaMundoCruel");
  });
  it("PascalCase", () => {
    expect(toPascalCase("olá mundo cruel")).toBe("OlaMundoCruel");
  });
  it("snake_case", () => {
    expect(toSnakeCase("Olá Mundo Cruel")).toBe("ola_mundo_cruel");
  });
  it("kebab-case", () => {
    expect(toKebabCase("Olá Mundo Cruel")).toBe("ola-mundo-cruel");
  });
});

describe("localizar e substituir", () => {
  it("substitui texto literal (todas ocorrencias)", () => {
    expect(findReplace("a-b-a-b", { find: "a", replace: "X" })).toBe("X-b-X-b");
  });
  it("substitui com regex quando habilitado", () => {
    expect(findReplace("a1b2c3", { find: "\\d", replace: "#", regex: true })).toBe("a#b#c#");
  });
  it("find vazio retorna texto original", () => {
    expect(findReplace("abc", { find: "", replace: "X" })).toBe("abc");
  });
  it("regex invalida lanca erro", () => {
    expect(() => findReplace("abc", { find: "(", replace: "X", regex: true })).toThrow();
  });
});

describe("removeLineBreaks", () => {
  it("junta linhas com espaco", () => {
    expect(removeLineBreaks("a\nb\nc")).toBe("a b c");
  });
  it("colapsa espacos resultantes", () => {
    expect(removeLineBreaks("a\n\nb")).toBe("a b");
  });
});

describe("wordFrequency", () => {
  it("conta ocorrencias ignorando caixa, ordenado por frequencia", () => {
    const out = wordFrequency("Casa casa CARRO casa carro");
    expect(out[0]).toEqual({ word: "casa", count: 3 });
    expect(out[1]).toEqual({ word: "carro", count: 2 });
  });
});

describe("numberToWordsPtBr", () => {
  it("converte numeros basicos", () => {
    expect(numberToWordsPtBr(0)).toBe("zero");
    expect(numberToWordsPtBr(15)).toBe("quinze");
    expect(numberToWordsPtBr(100)).toBe("cem");
    expect(numberToWordsPtBr(101)).toBe("cento e um");
  });
  it("converte milhares", () => {
    expect(numberToWordsPtBr(1000)).toBe("mil");
    expect(numberToWordsPtBr(2500)).toBe("dois mil e quinhentos");
  });
});

describe("contadores", () => {
  it("conta caracteres", () => {
    expect(countChars("abc")).toBe(3);
  });
  it("conta palavras", () => {
    expect(countWords("  olá   mundo cruel ")).toBe(3);
  });
  it("conta palavras de texto vazio como zero", () => {
    expect(countWords("   ")).toBe(0);
  });
  it("conta linhas", () => {
    expect(countLines("a\nb\nc")).toBe(3);
  });
});
