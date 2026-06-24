import { describe, it, expect } from "vitest";
import {
  generateCpf,
  validateCpf,
  generateCnpj,
  validateCnpj,
  formatCpf,
  formatCnpj,
  randomName,
  randomEmail,
  randomPhone,
  randomCep,
  randomRg,
  randomBirthDate,
  randomAddress,
  randomCompanyName,
  randomNick,
} from "./fakerBr.js";

describe("CPF", () => {
  it("gera CPF que passa na propria validacao", () => {
    for (let i = 0; i < 50; i++) expect(validateCpf(generateCpf())).toBe(true);
  });
  it("rejeita CPF invalido", () => {
    expect(validateCpf("12345678900")).toBe(false);
    expect(validateCpf("11111111111")).toBe(false);
  });
  it("formata com mascara", () => {
    expect(formatCpf("12345678909")).toBe("123.456.789-09");
  });
});

describe("CNPJ", () => {
  it("gera CNPJ que passa na propria validacao", () => {
    for (let i = 0; i < 50; i++) expect(validateCnpj(generateCnpj())).toBe(true);
  });
  it("rejeita CNPJ invalido", () => {
    expect(validateCnpj("11222333000100")).toBe(false);
  });
  it("formata com mascara", () => {
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});

describe("dados diversos", () => {
  it("nome tem nome e sobrenome", () => {
    expect(randomName().trim().split(/\s+/).length).toBeGreaterThanOrEqual(2);
  });
  it("email tem formato valido", () => {
    expect(randomEmail()).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });
  it("telefone tem DDD e digitos", () => {
    expect(randomPhone().replace(/\D/g, "").length).toBeGreaterThanOrEqual(10);
  });
  it("CEP tem 8 digitos", () => {
    expect(randomCep().replace(/\D/g, "")).toHaveLength(8);
  });
  it("RG tem mascara", () => {
    expect(randomRg()).toMatch(/^\d{2}\.\d{3}\.\d{3}-[\dX]$/);
  });
  it("data de nascimento DD/MM/AAAA", () => {
    expect(randomBirthDate()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
  it("endereco tem cidade e estado", () => {
    const a = randomAddress();
    expect(a.cidade).toBeTruthy();
    expect(a.estado).toMatch(/^[A-Z]{2}$/);
  });
  it("empresa tem sufixo", () => {
    expect(randomCompanyName()).toMatch(/(Ltda|S\.A\.|ME|EIRELI)/);
  });
  it("nick sem espacos", () => {
    expect(randomNick()).not.toMatch(/\s/);
  });
});
