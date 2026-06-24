// Localizacao e download de yt-dlp e ffmpeg. Mantem os binarios em engine/bin/.
import { existsSync, mkdirSync, createWriteStream, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

// Resolve a base: em dev fica relativo ao modulo; como binario unico (SEA)
// import.meta.url nao existe, entao usamos a pasta do executavel.
let baseDir;
try {
  baseDir = join(dirname(fileURLToPath(import.meta.url)), "..");
} catch {
  baseDir = dirname(process.execPath);
}
const BIN_DIR = join(baseDir, "bin");
const YTDLP_RELEASE = "https://github.com/yt-dlp/yt-dlp/releases/latest/download";

export function binaryName(base, platform = process.platform) {
  return platform === "win32" ? `${base}.exe` : base;
}

export function ytdlpDownloadUrl(platform = process.platform) {
  if (platform === "win32") return `${YTDLP_RELEASE}/yt-dlp.exe`;
  if (platform === "darwin") return `${YTDLP_RELEASE}/yt-dlp_macos`;
  return `${YTDLP_RELEASE}/yt-dlp`;
}

export function binDir() {
  return BIN_DIR;
}

function ytdlpPath() {
  return join(BIN_DIR, binaryName("yt-dlp"));
}

// ffmpeg: usa o de engine/bin se existir, senao o do PATH.
function ffmpegPath() {
  const local = join(BIN_DIR, binaryName("ffmpeg"));
  if (existsSync(local)) return local;
  try {
    const probe = process.platform === "win32" ? "where" : "which";
    const found = execFileSync(probe, ["ffmpeg"], { encoding: "utf8" }).split(/\r?\n/)[0].trim();
    return found || null;
  } catch {
    return null;
  }
}

export function resolvePaths() {
  return { ytdlp: ytdlpPath(), ffmpeg: ffmpegPath() };
}

export function checkPresence() {
  return {
    ytdlp: existsSync(ytdlpPath()),
    ffmpeg: Boolean(ffmpegPath()),
  };
}

async function downloadFile(url, dest) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Falha ao baixar ${url} (HTTP ${response.status})`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(dest));
}

// Garante o yt-dlp baixado. Retorna a presenca atualizada.
export async function ensureYtdlp() {
  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
  const dest = ytdlpPath();
  if (!existsSync(dest)) {
    await downloadFile(ytdlpDownloadUrl(), dest);
    if (process.platform !== "win32") chmodSync(dest, 0o755);
  }
  return checkPresence();
}
