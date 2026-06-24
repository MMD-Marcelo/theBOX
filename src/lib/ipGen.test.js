import { describe, it, expect } from "vitest";
import { randomIPv4, randomIPv6, generateIps } from "./ipGen.js";

describe("randomIPv4", () => {
  it("gera 4 octetos validos (0-255)", () => {
    for (let i = 0; i < 50; i++) {
      const ip = randomIPv4();
      const parts = ip.split(".");
      expect(parts).toHaveLength(4);
      for (const p of parts) {
        const n = Number(p);
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe("randomIPv6", () => {
  it("gera 8 grupos hex de 1-4 digitos", () => {
    const ip = randomIPv6();
    const groups = ip.split(":");
    expect(groups).toHaveLength(8);
    for (const g of groups) expect(g).toMatch(/^[0-9a-f]{1,4}$/);
  });
});

describe("generateIps", () => {
  it("gera a quantidade pedida", () => {
    expect(generateIps(5, "ipv4")).toHaveLength(5);
    expect(generateIps(3, "ipv6")).toHaveLength(3);
  });
});
