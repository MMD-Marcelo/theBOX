// Adaptador YouTube: parsing de metadados/formatos do yt-dlp e montagem de args.
// Funcoes puras (sem subprocesso) para serem testaveis.

export function parseFormats(json) {
  const formats = (json.formats || [])
    .filter((f) => {
      const hasVideo = f.vcodec && f.vcodec !== "none";
      const hasAudio = f.acodec && f.acodec !== "none";
      return hasVideo || hasAudio;
    })
    .map((f) => {
      const hasVideo = Boolean(f.vcodec && f.vcodec !== "none");
      const hasAudio = Boolean(f.acodec && f.acodec !== "none");
      return {
        id: f.format_id,
        resolution: f.height ? `${f.height}p` : f.resolution || "audio",
        fps: f.fps || null,
        codec: hasVideo ? f.vcodec : f.acodec,
        ext: f.ext,
        filesize: f.filesize ?? f.filesize_approx ?? null,
        hasVideo,
        hasAudio,
      };
    });
  return {
    title: json.title || null,
    thumbnail: json.thumbnail || null,
    formats,
  };
}

const PROGRESS_RE =
  /\[download\]\s+([\d.]+)%(?:\s+of\s+~?\s*[\d.]+\w+)?(?:\s+at\s+([\d.]+\w+\/s|\S+))?(?:\s+ETA\s+([\d:]+))?/;

export function parseProgress(line) {
  const match = line.match(PROGRESS_RE);
  if (!match) return null;
  return {
    percent: Number(match[1]),
    speed: match[2] || null,
    eta: match[3] || null,
  };
}

export function buildDownloadArgs({ url, formatId, output, outDir, hasFfmpeg = true }) {
  const template = `${outDir}/%(title)s.%(ext)s`;
  const base = ["--newline", "--no-playlist", "-o", template];

  if (output === "mp3") {
    // Converter para mp3 exige ffmpeg. Sem ele, baixa o melhor audio como esta
    // (m4a/webm) para ao menos entregar um arquivo de audio tocavel.
    if (!hasFfmpeg) return [...base, "-f", "bestaudio/best", url];
    return [...base, "-x", "--audio-format", "mp3", "--audio-quality", "0", url];
  }

  // Sem ffmpeg nao da para juntar video+audio separados. Cai para o melhor
  // formato progressivo (video+audio num unico arquivo, ~720p no YouTube).
  if (!hasFfmpeg) {
    return [...base, "-f", "best[acodec!=none][vcodec!=none]/best", url];
  }

  const format = formatId ? `${formatId}+bestaudio/best` : "bestvideo+bestaudio/best";
  return [...base, "-f", format, "--merge-output-format", "mp4", url];
}
