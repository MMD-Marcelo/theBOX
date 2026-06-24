// Detecta a plataforma a partir da URL (apenas para rotulo na UI).
// O download em si e generico via yt-dlp.
const MEDIA_EXT = /\.(mp4|webm|mkv|mov|avi|m4v|mp3|m4a|wav|flac|ogg|gif|jpg|jpeg|png|webp|pdf|zip)$/i;

export function detectPlatform(url) {
  let host;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Desconhecido";
  }
  if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
  if (host.includes("instagram.com")) return "Instagram";
  if (host.includes("tiktok.com")) return "TikTok";
  if (host.includes("twitter.com") || host === "x.com" || host.endsWith(".x.com")) return "Twitter/X";
  if (host.includes("soundcloud.com")) return "SoundCloud";
  if (host.includes("pinterest.")) return "Pinterest";
  if (host.includes("linkedin.com")) return "LinkedIn";
  if (host.includes("giphy.com")) return "Giphy";
  if (host.includes("tenor.com")) return "Tenor";
  if (MEDIA_EXT.test(new URL(url).pathname)) return "Arquivo direto";
  return "Site";
}
