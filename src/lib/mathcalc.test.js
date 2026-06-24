import { describe, it, expect } from "vitest";
import { percentOf, whatPercent, percentChange, ruleOfThree } from "./mathcalc.js";

describe("porcentagem", () => {
  it("percentOf: X% de N", () => {
    expect(percentOf(10, 200)).toBe(20);
  });
  it("whatPercent: parte e quanto % do total", () => {
    expect(whatPercent(50, 200)).toBe(25);
  });
  it("percentChange: variacao percentual", () => {
    expect(percentChange(100, 150)).toBe(50);
    expect(percentChange(100, 80)).toBe(-20);
  });
});

describe("ruleOfThree", () => {
  it("a -> b, c -> x", () => {
    expect(ruleOfThree(2, 10, 6)).toBe(30);
  });
  it("retorna null se a for 0", () => {
    expect(ruleOfThree(0, 10, 6)).toBe(null);
  });
});
