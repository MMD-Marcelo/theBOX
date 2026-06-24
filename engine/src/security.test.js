import { describe, it, expect } from "vitest";
import {
  generateToken,
  validateToken,
  isAllowedOrigin,
  isLoopbackHost,
  corsHeaders,
} from "./security.js";

describe("generateToken", () => {
  it("gera string longa", () => {
    expect(generateToken().length).toBeGreaterThanOrEqual(32);
  });
  it("gera tokens diferentes a cada chamada", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("validateToken", () => {
  const token = "a".repeat(40);
  it("aceita token igual", () => {
    expect(validateToken(token, token)).toBe(true);
  });
  it("rejeita token diferente", () => {
    expect(validateToken("b".repeat(40), token)).toBe(false);
  });
  it("rejeita ausente ou vazio", () => {
    expect(validateToken("", token)).toBe(false);
    expect(validateToken(undefined, token)).toBe(false);
  });
  it("rejeita comprimento diferente sem quebrar", () => {
    expect(validateToken("abc", token)).toBe(false);
  });
});

describe("isAllowedOrigin", () => {
  const allow = ["https://mmd-marcelo.github.io", "https://thebox.tche.studio"];
  it("aceita origem da allowlist", () => {
    expect(isAllowedOrigin("https://thebox.tche.studio", allow)).toBe(true);
  });
  it("rejeita origem fora da allowlist", () => {
    expect(isAllowedOrigin("https://evil.com", allow)).toBe(false);
  });
  it("aceita ausencia de Origin (ferramenta nao-browser)", () => {
    expect(isAllowedOrigin(undefined, allow)).toBe(true);
    expect(isAllowedOrigin(null, allow)).toBe(true);
  });
});

describe("isLoopbackHost", () => {
  it("aceita loopback com porta", () => {
    expect(isLoopbackHost("127.0.0.1:7421")).toBe(true);
    expect(isLoopbackHost("localhost:7421")).toBe(true);
    expect(isLoopbackHost("[::1]:7421")).toBe(true);
  });
  it("rejeita host nao-loopback (anti DNS-rebinding)", () => {
    expect(isLoopbackHost("evil.com:7421")).toBe(false);
    expect(isLoopbackHost("127.0.0.1.evil.com:7421")).toBe(false);
  });
  it("rejeita ausente", () => {
    expect(isLoopbackHost(undefined)).toBe(false);
  });
});

describe("corsHeaders", () => {
  const allow = ["https://thebox.tche.studio"];
  it("inclui ACAO e PNA para origem permitida", () => {
    const headers = corsHeaders("https://thebox.tche.studio", allow);
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://thebox.tche.studio");
    expect(headers["Access-Control-Allow-Private-Network"]).toBe("true");
    expect(headers["Access-Control-Allow-Headers"]).toMatch(/authorization/i);
  });
  it("nao inclui ACAO para origem negada", () => {
    const headers = corsHeaders("https://evil.com", allow);
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});
