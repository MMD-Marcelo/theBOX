#!/usr/bin/env node
// Entry do THEbox Downloader. Sobe o motor local em 127.0.0.1.
import { execFile } from "node:child_process";
import { spawn } from "node:child_process";
import { mkdirSync, createWriteStream, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, extname, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { parseArgs, ALLOWED_ORIGINS } from "./config.js";
import { generateToken } from "./security.js";
import { ensureYtdlp, ensureFfmpeg, checkPresence, resolvePaths } from "./binaries.js";
import { parseFormats } from "./youtube.js";
import { downloadDirect } from "./direct.js";
import { ocrImage } from "./ocr.js";
import { createRegistry } from "./jobs.js";
import { createServer } from "./server.js";
import { launchControlPanel, readAutoStart, setAutoStart } from "./windows-controller.js";

const execFileAsync = promisify(execFile);

function openBrowser(url) {
  try {
    if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    else if (process.platform === "darwin") spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    else spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  } catch {
    /* sem navegador: usuario abre manualmente */
  }
}

async function main() {
  const cfg = parseArgs(process.argv.slice(2));
  mkdirSync(cfg.outDir, { recursive: true });

  console.log("THEbox Downloader — preparando binarios...");
  await ensureYtdlp().catch((e) => console.warn("Aviso: nao consegui baixar yt-dlp:", e.message));
  await ensureFfmpeg().catch((e) => console.warn("Aviso: nao consegui baixar ffmpeg:", e.message));

  const { ytdlp, ffmpeg } = resolvePaths();
  const presence = checkPresence();

  // Token persistente: mantem o mesmo entre reinicios (nao quebra abas abertas).
  const tokenPath = join(homedir(), ".thebox-downloader-token");
  let token;
  try {
    token = readFileSync(tokenPath, "utf8").trim();
  } catch {
    /* sem token salvo */
  }
  if (!token) {
    token = generateToken();
    try {
      writeFileSync(tokenPath, token);
    } catch {
      /* segue sem persistir */
    }
  }

  const tmpRoot = join(tmpdir(), "thebox-engine");
  mkdirSync(tmpRoot, { recursive: true });

  const registry = createRegistry({
    spawnImpl: spawn,
    ytdlpPath: ytdlp,
    ffmpegPath: ffmpeg,
    outDir: cfg.outDir,
    directImpl: downloadDirect,
    cleanup: (p) => rmSync(p, { force: true }),
  });

  async function handleConvert(req, { name, format, bitrate }) {
    const inputPath = join(tmpRoot, `${randomUUID()}${extname(name) || ""}`);
    await pipeline(req, createWriteStream(inputPath));
    const outputName = `${basename(name, extname(name))}.${format}`;
    return registry.startConvert({ inputPath, outputName, format, bitrate });
  }

  async function analyzeImpl(url) {
    const { stdout } = await execFileAsync(ytdlp, ["-J", "--no-playlist", url], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return parseFormats(JSON.parse(stdout));
  }

  function getPresence() {
    return { ...checkPresence(), folder: cfg.outDir };
  }

  const server = createServer({
    token,
    allowlist: ALLOWED_ORIGINS,
    registry,
    getPresence,
    analyzeImpl,
    handleConvert,
    ocrImpl: async (req, options) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      return ocrImage(Buffer.concat(chunks), options);
    },
  });

  let running = false;
  let shuttingDown = false;
  const separator = cfg.siteUrl.includes("#") ? "&" : "#";
  const handshakeUrl = cfg.siteUrl + separator + "thebox-token=" + token;

  function printStatus() {
    console.log("\n========================================");
    console.log("  THEBOX Engine ligado");
    console.log("  URL:    http://127.0.0.1:" + cfg.port);
    console.log("  Pasta:  " + cfg.outDir);
    console.log("  yt-dlp: " + (presence.ytdlp ? "ok" : "FALTANDO") + "   ffmpeg: " + (presence.ffmpeg ? "ok" : "FALTANDO"));
    console.log("========================================\n");
  }

  function startServer({ openSite = false } = {}) {
    if (running) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onError = (error) => {
        server.off("error", onError);
        reject(error);
      };
      server.once("error", onError);
      server.listen(cfg.port, "127.0.0.1", () => {
        server.off("error", onError);
        running = true;
        printStatus();
        if (openSite) openBrowser(handshakeUrl);
        resolve();
      });
    });
  }

  function stopServer() {
    if (!running) return Promise.resolve();
    return new Promise((resolve) => {
      server.close(() => {
        running = false;
        console.log("THEBOX Engine desligado.");
        resolve();
      });
      server.closeAllConnections?.();
    });
  }

  await startServer({ openSite: cfg.open });

  let panel;
  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    await stopServer();
    if (panel && !panel.killed) panel.kill();
    process.exit(0);
  }

  async function handleControlCommand(command) {
    if (command === "toggle:on") await startServer();
    else if (command === "toggle:off") await stopServer();
    else if (command === "autostart:on") setAutoStart(true);
    else if (command === "autostart:off") setAutoStart(false);
    else if (command === "exit") await shutdown();
  }

  panel = launchControlPanel({
    enabled: running,
    autoStart: readAutoStart(),
    startHidden: cfg.startup,
    port: cfg.port,
    onCommand: (command) => {
      handleControlCommand(command).catch((error) => console.error("Controle:", error.message));
    },
  });
  panel?.once("exit", () => {
    if (!shuttingDown) shutdown();
  });

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Erro ao iniciar o THEBOX Engine:", error.message);
  process.exitCode = 1;
});
