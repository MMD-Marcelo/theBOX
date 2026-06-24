// Conversao de midia via ffmpeg. Helpers puros + parsing de progresso.

export function buildConvertArgs({ input, output, format, bitrate }) {
  const base = ["-i", input, "-progress", "pipe:1", "-nostats", "-y"];
  if (format === "mp3") {
    return [...base, "-vn", "-c:a", "libmp3lame", "-b:a", `${bitrate || 192}k`, output];
  }
  if (format === "webm") {
    // WEBM exige VP9 + Opus (H.264/AAC nao sao validos no container webm)
    return [...base, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "33", "-row-mt", "1", "-c:a", "libopus", output];
  }
  // mp4 / mov / mkv: H.264 + AAC
  return [...base, "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", output];
}

export function parseDuration(line) {
  const m = line.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function parseProgressTime(line) {
  const m = line.match(/out_time=(\d+):(\d+):(\d+\.\d+)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function percentFrom(timeSec, durationSec) {
  if (!durationSec) return null;
  return Math.min(100, (timeSec / durationSec) * 100);
}
