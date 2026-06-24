// Seguranca do motor local: token, allowlist de Origin, guard de Host
// (anti DNS-rebinding) e headers CORS + Private Network Access.
import { randomBytes, timingSafeEqual } from "node:crypto";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function generateToken() {
  return randomBytes(24).toString("hex"); // 48 chars
}

export function validateToken(provided, expected) {
  if (!provided || !expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function isAllowedOrigin(origin, allowlist) {
  if (origin === undefined || origin === null) return true; // ferramentas nao-browser
  return allowlist.includes(origin);
}

export function isLoopbackHost(host) {
  if (!host) return false;
  // remove porta: "127.0.0.1:7421" -> "127.0.0.1"; "[::1]:7421" -> "[::1]"
  const hostname = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : host.split(":")[0];
  return LOOPBACK_HOSTS.has(hostname);
}

export function corsHeaders(origin, allowlist) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Private-Network": "true",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin, allowlist) && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
