// OCR via Tesseract (roda no motor local). Idiomas por+eng.
// O traineddata e baixado uma vez e cacheado em bin/tessdata.
import { createWorker } from "tesseract.js";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { getAsset, isSea } from "node:sea";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

let baseDir;
try {
  baseDir = join(dirname(fileURLToPath(import.meta.url)), "..");
} catch {
  baseDir = dirname(process.execPath);
}
const CACHE = join(baseDir, "bin", "tessdata");

const SUPPORTED_LANGUAGES = new Set(["por", "eng", "spa"]);
const PAGE_SEGMENTATION = {
  auto: "3",
  column: "4",
  block: "6",
  line: "7",
  sparse: "11",
};
const workerPromises = new Map();
let recognitionQueue = Promise.resolve();
const OCR_ASSETS = [
  "tesseract-worker.cjs",
  "tesseract-core-lstm.wasm",
  "tesseract-core-simd-lstm.wasm",
  "tesseract-core-relaxedsimd-lstm.wasm",
  "tesseract-core.wasm",
  "tesseract-core-simd.wasm",
  "tesseract-core-relaxedsimd.wasm",
];

export function normalizeOcrOptions(options = {}) {
  const requestedLanguages = String(options.languages || "por+eng")
    .split("+")
    .filter((language) => SUPPORTED_LANGUAGES.has(language));
  const languages = [...new Set(requestedLanguages)].join("+") || "por+eng";
  const layout = PAGE_SEGMENTATION[options.layout] ? options.layout : "auto";
  const dpi = Math.min(400, Math.max(150, Number(options.dpi) || 300));
  return { languages, layout, dpi, psm: PAGE_SEGMENTATION[layout] };
}

function getWorker(languages) {
  if (!workerPromises.has(languages)) {
    mkdirSync(CACHE, { recursive: true });
    const options = { cachePath: CACHE };
    if (isSea()) {
      const runtimeDir = join(tmpdir(), "thebox-engine", "ocr-runtime");
      mkdirSync(runtimeDir, { recursive: true });
      for (const asset of OCR_ASSETS) {
        const target = join(runtimeDir, asset);
        if (!existsSync(target)) writeFileSync(target, Buffer.from(getAsset(asset)));
      }
      options.workerPath = join(runtimeDir, "tesseract-worker.cjs");
    }
    workerPromises.set(languages, createWorker(languages, 1, options));
  }
  return workerPromises.get(languages);
}

export function ocrImage(input, options = {}) {
  const normalized = normalizeOcrOptions(options);
  const recognize = async () => {
    const worker = await getWorker(normalized.languages);
    await worker.setParameters({
      tessedit_pageseg_mode: normalized.psm,
      preserve_interword_spaces: "1",
      user_defined_dpi: String(normalized.dpi),
    });
    const { data } = await worker.recognize(input, { rotateAuto: true });
    return {
      text: data.text.trim(),
      confidence: Number.isFinite(data.confidence) ? data.confidence : null,
      languages: normalized.languages,
      layout: normalized.layout,
    };
  };
  const result = recognitionQueue.then(recognize, recognize);
  recognitionQueue = result.then(() => undefined, () => undefined);
  return result;
}
