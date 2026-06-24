// Servidor HTTP local. Compoe seguranca + jobs + analyze.
// Bind apenas em 127.0.0.1.
import { createServer as createHttpServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { basename } from "node:path";
import { corsHeaders, isAllowedOrigin, isLoopbackHost, validateToken } from "./security.js";

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error("payload grande"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
  });
}

export function createServer({ token, allowlist, registry, getPresence, analyzeImpl, handleConvert, ocrImpl }) {
  return createHttpServer(async (req, res) => {
    const origin = req.headers.origin;
    const cors = corsHeaders(origin, allowlist);

    // Preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      res.end();
      return;
    }

    // Guards: Origin allowlist + Host loopback (anti DNS-rebinding)
    if (!isAllowedOrigin(origin, allowlist)) {
      send(res, 403, { error: "Origin nao permitida" }, cors);
      return;
    }
    if (!isLoopbackHost(req.headers.host)) {
      send(res, 403, { error: "Host invalido" }, cors);
      return;
    }

    const url = new URL(req.url, "http://127.0.0.1");
    const path = url.pathname;

    const tokenFromReq =
      (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || url.searchParams.get("token") || "";
    // Autoriza por Origin permitida (navegador nao forja Origin) OU por token.
    // Requisicoes sem Origin (ferramentas externas) ainda exigem token.
    const originAllowed = Boolean(origin) && allowlist.includes(origin);
    const authed = originAllowed || validateToken(tokenFromReq, token);

    try {
      // /health (sem token)
      if (req.method === "GET" && path === "/health") {
        send(res, 200, { ok: true, ...getPresence() }, cors);
        return;
      }

      // /analyze
      if (req.method === "POST" && path === "/analyze") {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const { url: target } = await readJson(req);
        if (!target) return send(res, 400, { error: "URL ausente" }, cors);
        const data = await analyzeImpl(target);
        return send(res, 200, data, cors);
      }

      // /download
      if (req.method === "POST" && path === "/download") {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const { url: target, formatId, output } = await readJson(req);
        if (!target) return send(res, 400, { error: "URL ausente" }, cors);
        const jobId = registry.start({ url: target, formatId, output: output || "mp4" });
        return send(res, 200, { jobId }, cors);
      }

      // /ocr (extrai texto de uma imagem via Tesseract)
      if (req.method === "POST" && path === "/ocr") {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const result = await ocrImpl(req, {
          languages: url.searchParams.get("languages") || undefined,
          layout: url.searchParams.get("layout") || undefined,
          dpi: url.searchParams.get("dpi") || undefined,
        });
        return send(res, 200, result, cors);
      }

      // /convert (recebe arquivo no corpo, converte com ffmpeg)
      if (req.method === "POST" && path === "/convert") {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const name = url.searchParams.get("name") || "arquivo";
        const format = url.searchParams.get("to") || "mp4";
        const bitrate = Number(url.searchParams.get("bitrate")) || undefined;
        const jobId = await handleConvert(req, { name, format, bitrate });
        return send(res, 200, { jobId }, cors);
      }

      // /direct (download direto de arquivo arbitrario)
      if (req.method === "POST" && path === "/direct") {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const { url: target } = await readJson(req);
        if (!target) return send(res, 400, { error: "URL ausente" }, cors);
        const jobId = registry.startDirect({ url: target });
        return send(res, 200, { jobId }, cors);
      }

      // /file/:id (stream do arquivo concluido para o navegador salvar)
      if (req.method === "GET" && path.startsWith("/file/")) {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const id = path.slice("/file/".length);
        const filePath = registry.filePath(id);
        if (!filePath || !existsSync(filePath)) return send(res, 404, { error: "Arquivo nao encontrado" }, cors);
        const name = basename(filePath);
        res.writeHead(200, {
          ...cors,
          "Content-Type": "application/octet-stream",
          "Content-Length": statSync(filePath).size,
          "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
        });
        createReadStream(filePath).pipe(res);
        return;
      }

      // /progress/:id (SSE; token via query, pois EventSource nao envia header)
      if (req.method === "GET" && path.startsWith("/progress/")) {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const id = path.slice("/progress/".length);
        const current = registry.get(id);
        if (!current) return send(res, 404, { error: "Job nao encontrado" }, cors);
        res.writeHead(200, {
          ...cors,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        const write = (snap) => res.write(`data: ${JSON.stringify(snap)}\n\n`);
        write(current);
        const unsubscribe = registry.subscribe(id, (snap) => {
          write(snap);
          if (["done", "error", "canceled"].includes(snap.status)) {
            unsubscribe();
            res.end();
          }
        });
        req.on("close", unsubscribe);
        return;
      }

      // /cancel/:id
      if (req.method === "POST" && path.startsWith("/cancel/")) {
        if (!authed) return send(res, 401, { error: "Token invalido" }, cors);
        const id = path.slice("/cancel/".length);
        const ok = registry.cancel(id);
        return send(res, ok ? 200 : 404, { ok }, cors);
      }

      send(res, 404, { error: "Rota nao encontrada" }, cors);
    } catch (error) {
      send(res, 500, { error: error.message }, cors);
    }
  });
}
