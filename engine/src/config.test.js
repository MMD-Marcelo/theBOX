import { describe, it, expect } from "vitest";
import { parseArgs } from "./config.js";

describe("parseArgs", () => {
  it("usa defaults", () => {
    const cfg = parseArgs([], "/home/u");
    expect(cfg.port).toBe(7421);
    expect(cfg.outDir.replace(/\\/g, "/")).toMatch(/\/home\/u\/Downloads\/THEBOX$/);
  });
  it("le --port e --out", () => {
    const cfg = parseArgs(["--port", "8080", "--out", "/dados/videos"], "/home/u");
    expect(cfg.port).toBe(8080);
    expect(cfg.outDir).toBe("/dados/videos");
  });
  it("le --url e --no-open", () => {
    const cfg = parseArgs(["--url", "http://localhost:5173/", "--no-open"], "/home/u");
    expect(cfg.siteUrl).toBe("http://localhost:5173/");
    expect(cfg.open).toBe(false);
  });
  it("le --startup sem abrir o navegador", () => {
    const cfg = parseArgs(["--startup"], "/home/u");
    expect(cfg.startup).toBe(true);
    expect(cfg.open).toBe(false);
  });
  it("siteUrl default aponta para github pages", () => {
    expect(parseArgs([], "/home/u").siteUrl).toContain("github.io");
  });
});
