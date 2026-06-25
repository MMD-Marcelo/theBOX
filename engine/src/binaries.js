// Localizacao e download de yt-dlp e ffmpeg. Mantem os binarios em engine/bin/.
import {
  existsSync,
  mkdirSync,
  createWriteStream,
  chmodSync,
  readdirSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
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
// Builds de ffmpeg recomendados pelo proprio yt-dlp (estaticos, sem instalacao).
const FFMPEG_RELEASE = "https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download";

export function binaryName(base, platform = process.platform) {
  return platform === "win32" ? `${base}.exe` : base;
}

export function ytdlpDownloadUrl(platform = process.platform) {
  if (platform === "win32") return `${YTDLP_RELEASE}/yt-dlp.exe`;
  if (platform === "darwin") return `${YTDLP_RELEASE}/yt-dlp_macos`;
  return `${YTDLP_RELEASE}/yt-dlp`;
}

// URL do archive de ffmpeg por plataforma. macOS nao tem build aqui (usa PATH/brew).
export function ffmpegDownloadUrl(platform = process.platform) {
  if (platform === "win32") return `${FFMPEG_RELEASE}/ffmpeg-master-latest-win64-gpl.zip`;
  if (platform === "linux") return `${FFMPEG_RELEASE}/ffmpeg-master-latest-linux64-gpl.tar.xz`;
  return null;
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

// Procura um arquivo por nome (recursivo) dentro de um diretorio.
function findFile(dir, name) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(full, name);
      if (found) return found;
    } else if (entry.name === name) {
      return full;
    }
  }
  return null;
}

// Garante o ffmpeg disponivel (necessario para juntar video+audio e gerar mp3).
// Baixa um build estatico e extrai com o `tar` do sistema. Best-effort: se algo
// falhar, segue sem ffmpeg (o downloader cai para formato progressivo ~720p).
export async function ensureFfmpeg() {
  if (checkPresence().ffmpeg) return checkPresence(); // ja existe (bin/ ou PATH)
  const url = ffmpegDownloadUrl();
  if (!url) return checkPresence(); // plataforma sem build automatico (mac)

  if (!existsSync(BIN_DIR)) mkdirSync(BIN_DIR, { recursive: true });
  const work = join(tmpdir(), `thebox-ffmpeg-${Date.now()}`);
  mkdirSync(work, { recursive: true });
  const archive = join(work, url.endsWith(".zip") ? "ffmpeg.zip" : "ffmpeg.tar.xz");

  try {
    console.log("Baixando ffmpeg (uma unica vez, ~150 MB)... isso pode levar alguns minutos.");
    await downloadFile(url, archive);
    // No Windows usa o tar do System32 (bsdtar) explicitamente — ele extrai .zip
    // e evita pegar um GNU tar de outro PATH (que nao abre zip). Linux: .tar.xz.
    const tarBin =
      process.platform === "win32"
        ? join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe")
        : "tar";
    execFileSync(tarBin, ["-xf", archive, "-C", work], { stdio: "ignore" });

    for (const tool of ["ffmpeg", "ffprobe"]) {
      const exe = binaryName(tool);
      const found = findFile(work, exe);
      if (found) {
        copyFileSync(found, join(BIN_DIR, exe));
        if (process.platform !== "win32") chmodSync(join(BIN_DIR, exe), 0o755);
      }
    }
  } catch {
    /* sem ffmpeg: o downloader usa fallback progressivo */
  } finally {
    try {
      rmSync(work, { recursive: true, force: true });
    } catch {
      /* ignora limpeza */
    }
  }
  return checkPresence();
}
