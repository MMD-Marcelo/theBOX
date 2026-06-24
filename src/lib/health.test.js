import { describe, it, expect } from "vitest";
import { bmi, bmiCategory, idealWeight, bmr, tdee, ageDetailed } from "./health.js";

describe("bmi", () => {
  it("calcula IMC", () => {
    expect(bmi(70, 176)).toBeCloseTo(22.6, 1);
  });
  it("classifica", () => {
    expect(bmiCategory(17)).toBe("Abaixo do peso");
    expect(bmiCategory(22)).toBe("Peso normal");
    expect(bmiCategory(27)).toBe("Sobrepeso");
    expect(bmiCategory(32)).toBe("Obesidade I");
  });
});

describe("idealWeight", () => {
  it("retorna formulas e media plausiveis", () => {
    const r = idealWeight(175, "m");
    expect(r.media).toBeGreaterThan(55);
    expect(r.media).toBeLessThan(80);
    expect(r.formulas.Devine).toBeGreaterThan(0);
  });
});

describe("bmr / tdee", () => {
  it("Mifflin-St Jeor masculino", () => {
    // 10*75 + 6.25*175 - 5*28 + 5 = 750 + 1093.75 - 140 + 5 = 1708.75
    expect(bmr(75, 175, 28, "m")).toBeCloseTo(1708.75, 1);
  });
  it("tdee aplica fator de atividade", () => {
    expect(tdee(1700, "sedentario")).toBeCloseTo(2040, 0);
  });
});

describe("ageDetailed", () => {
  it("calcula anos/meses/dias", () => {
    const now = new Date(2026, 5, 23); // 23/06/2026
    const r = ageDetailed("23/06/2000", now);
    expect(r.years).toBe(26);
    expect(r.months).toBe(0);
    expect(r.days).toBe(0);
  });
  it("lida com dia/mes antes do aniversario", () => {
    const now = new Date(2026, 5, 23);
    const r = ageDetailed("24/12/2000", now);
    expect(r.years).toBe(25);
  });
});
