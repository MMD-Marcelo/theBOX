import { describe, it, expect } from "vitest";
import { uuidV4, sha } from "./uuidHash.js";

describe("uuidV4", () => {
  it("gera no formato canonico v4", () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it("gera valores diferentes", () => {
    expect(uuidV4()).not.toBe(uuidV4());
  });
});

describe("sha", () => {
  it("SHA-256 de 'abc' (vetor conhecido)", async () => {
    const out = await sha("abc", "SHA-256");
    expect(out).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("SHA-1 de 'abc'", async () => {
    const out = await sha("abc", "SHA-1");
    expect(out).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });
});
