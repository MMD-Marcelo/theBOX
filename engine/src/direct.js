// Download direto de arquivo arbitrario (burla CORS no servidor, sem recompressao).
import { createWriteStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export function filenameFromUrl(url, contentDisposition) {
  if (contentDisposition) {
    const star = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
    if (star) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    const plain = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (plain) return plain[1].trim();
  }
  try {
    const last = new URL(url).pathname.split("/").filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {
    /* ignora */
  }
  return `download-${Date.now()}`;
}

// Baixa e grava em outDir, reportando progresso. fetchImpl injetavel para testes.
export async function downloadDirect({ url, outDir, fetchImpl = fetch, onProgress }) {
  const response = await fetchImpl(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const name = filenameFromUrl(url, response.headers.get?.("content-disposition"));
  const total = Number(response.headers.get?.("content-length")) || 0;
  let received = 0;
  const body = Readable.fromWeb(response.body);
  body.on("data", (chunk) => {
    received += chunk.length;
    if (onProgress && total) onProgress(Math.min(100, (received / total) * 100));
  });
  await pipeline(body, createWriteStream(join(outDir, name)));
  return name;
}
