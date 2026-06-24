import UPNG from "upng-js";

export const imageFormats = [
  { id: "jpg", label: "JPG", mime: "image/jpeg", extension: "jpg" },
  { id: "png", label: "PNG", mime: "image/png", extension: "png" },
  { id: "webp", label: "WebP", mime: "image/webp", extension: "webp" },
  { id: "avif", label: "AVIF", mime: "image/avif", extension: "avif" },
  { id: "bmp", label: "BMP", mime: "image/bmp", extension: "bmp" },
  { id: "gif", label: "GIF", mime: "image/gif", extension: "gif" },
  { id: "ico", label: "ICO", mime: "image/x-icon", extension: "ico" },
  { id: "pdf", label: "PDF", mime: "application/pdf", extension: "pdf" },
];

export async function imagesToMergedPdf(files) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const source = await loadImageSource(file);
    const bitmap = source.bitmap;
    const width = bitmap.naturalWidth || bitmap.width;
    const height = bitmap.naturalHeight || bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0);
    const png = await canvasToBlob(canvas, "image/png", 1);
    const embedded = await pdf.embedPng(await png.arrayBuffer());
    const page = pdf.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }

  return new Blob([await pdf.save()], { type: "application/pdf" });
}

export async function compressImage(file, options) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const { width, height } = fitWithinBounds(
    sourceWidth,
    sourceHeight,
    options.maxWidth,
    options.maxHeight
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);

  const target = resolveCompressionTarget(file);
  const blob = target.kind === "png-quant"
    ? await canvasToQuantizedPng(canvas, options.pngColors)
    : await canvasToBlob(canvas, target.mime, options.quality);
  return { blob, extension: target.extension };
}

export function fitWithinBounds(width, height, maxWidth, maxHeight) {
  const widthRatio = maxWidth ? maxWidth / width : 1;
  const heightRatio = maxHeight ? maxHeight / height : 1;
  const ratio = Math.min(widthRatio, heightRatio, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function resolveCompressionTarget(file) {
  const extension = getExtension(file.name);
  if (extension === "png") {
    return { mime: "image/png", extension: "png", kind: "png-quant" };
  }
  if (extension === "webp") {
    return { mime: "image/webp", extension: "webp" };
  }
  if (extension === "avif") {
    return { mime: "image/avif", extension: "avif" };
  }
  return { mime: "image/jpeg", extension: "jpg" };
}

export async function canvasToQuantizedPng(canvas, colorCount) {
  const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  const rgba = imageData.data.buffer.slice(
    imageData.data.byteOffset,
    imageData.data.byteOffset + imageData.data.byteLength
  );
  const buffer = UPNG.encode(
    [rgba],
    canvas.width,
    canvas.height,
    Math.max(2, Math.min(256, colorCount))
  );
  return new Blob([buffer], { type: "image/png" });
}

export async function loadImageSource(file) {
  const extension = getExtension(file.name);
  if (extension === "heic" || extension === "heif") {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/png" });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return { bitmap: await createImageBitmap(blob), label: extension.toUpperCase() };
  }

  return { bitmap: await createImageBitmap(file), label: extension.toUpperCase() || "Imagem" };
}

export async function exportImage(canvas, target, quality, options = {}) {
  if (target.id === "bmp") {
    return new Blob([canvasToBmp(canvas)], { type: target.mime });
  }

  if (target.id === "pdf") {
    const { PDFDocument } = await import("pdf-lib");
    const png = await canvasToBlob(canvas, "image/png", 1);
    const pdf = await PDFDocument.create();
    const pngBytes = await png.arrayBuffer();
    const embedded = await pdf.embedPng(pngBytes);
    const page = pdf.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    const bytes = await pdf.save();
    return new Blob([bytes], { type: target.mime });
  }

  if (target.id === "ico") {
    const iconCanvas = resizeCanvas(canvas, options.icoSize ?? 256, options.icoSize ?? 256);
    const png = await canvasToBlob(iconCanvas, "image/png", 1);
    const pngBytes = new Uint8Array(await png.arrayBuffer());
    return new Blob([pngToIco(pngBytes, iconCanvas.width, iconCanvas.height)], { type: target.mime });
  }

  if (target.id === "gif") {
    return new Blob([await canvasToGif(canvas)], { type: target.mime });
  }

  return canvasToBlob(canvas, target.mime, quality);
}

export async function imagesToAnimatedGif(files, { delay, repeat }) {
  const module = await import("gifenc");
  const GIFEncoder = module.GIFEncoder ?? module.default;
  const { applyPalette, quantize } = module;
  const frames = [];

  for (const file of files) {
    const source = await loadImageSource(file);
    const bitmap = source.bitmap;
    const width = bitmap.naturalWidth || bitmap.width;
    const height = bitmap.naturalHeight || bitmap.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0);
    frames.push(canvas);
  }

  const width = frames[0].width;
  const height = frames[0].height;
  const gif = GIFEncoder();

  frames.forEach((frame, index) => {
    const normalized = frame.width === width && frame.height === height
      ? frame
      : resizeCanvas(frame, width, height);
    const data = normalized.getContext("2d").getImageData(0, 0, width, height).data;
    const palette = quantize(data, 256);
    const indexed = applyPalette(data, palette);
    gif.writeFrame(indexed, width, height, {
      palette,
      delay,
      repeat: index === 0 ? repeat : undefined,
    });
  });

  gif.finish();
  return new Blob([gif.bytesView()], { type: "image/gif" });
}

export function resizeCanvas(sourceCanvas, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(sourceCanvas, 0, 0, width, height);
  return canvas;
}

export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(`${mime} nao e suportado neste navegador.`));
    }, mime, quality);
  });
}

export function canvasToBmp(canvas) {
  const { width, height } = canvas;
  const imageData = canvas.getContext("2d").getImageData(0, 0, width, height);
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint16(offset, 0x4d42, true);
  offset += 2;
  view.setUint32(offset, fileSize, true);
  offset += 4;
  view.setUint32(offset, 0, true);
  offset += 4;
  view.setUint32(offset, 54, true);
  offset += 4;
  view.setUint32(offset, 40, true);
  offset += 4;
  view.setInt32(offset, width, true);
  offset += 4;
  view.setInt32(offset, height, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, 24, true);
  offset += 2;
  view.setUint32(offset, 0, true);
  offset += 4;
  view.setUint32(offset, pixelArraySize, true);
  offset += 16;

  const data = imageData.data;
  for (let y = height - 1; y >= 0; y -= 1) {
    let rowOffset = 54 + (height - 1 - y) * rowSize;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      view.setUint8(rowOffset, data[index + 2]);
      view.setUint8(rowOffset + 1, data[index + 1]);
      view.setUint8(rowOffset + 2, data[index]);
      rowOffset += 3;
    }
  }

  return buffer;
}

export function pngToIco(pngBytes, width, height) {
  const size = pngBytes.length;
  const buffer = new ArrayBuffer(22 + size);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, width >= 256 ? 0 : width);
  view.setUint8(7, height >= 256 ? 0 : height);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, size, true);
  view.setUint32(18, 22, true);
  bytes.set(pngBytes, 22);
  return buffer;
}

export function canvasToGif(canvas) {
  return import("gifenc").then((module) => {
    const GIFEncoder = module.GIFEncoder ?? module.default;
    const { applyPalette, quantize } = module;
    const { width, height } = canvas;
    const data = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    const palette = quantize(data, 256);
    const indexed = applyPalette(data, palette);
    const gif = GIFEncoder();
    gif.writeFrame(indexed, width, height, { palette });
    gif.finish();
    return gif.bytesView();
  });
}

export function getExtension(name) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function stripExtension(name) {
  return name.replace(/\.[^/.]+$/, "");
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function triggerDownload(url, fileName) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
export async function zipDownloads(items, fileName) {
  if (!items.length) return;
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const item of items) {
    const blob = await fetch(item.downloadUrl).then((response) => response.blob());
    zip.file(item.outputName, blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  triggerDownload(url, fileName);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const starterPalettes = [
  ["#0a0a0a", "#ff5a00", "#ffffff", "#f3f3f3", "#9b9b9b"],
];

export function normalizePalette(colors) {
  const filled = [...colors, ...starterPalettes[0]].slice(0, 5);
  return filled.map((color) => color.toLowerCase());
}

export function generatePalette(seed, mode) {
  const offsets = {
    analogous: [0, 18, 36, 180, 210],
    complementary: [0, 20, 180, 200, 220],
    triadic: [0, 120, 140, 240, 260],
    mono: [0, 0, 0, 0, 0],
  }[mode];
  return offsets.map((offset, index) => {
    const lightness = mode === "mono" ? 22 + index * 14 : 28 + (index % 3) * 18;
    const saturation = mode === "mono" ? 74 - index * 8 : 82 - index * 7;
    return hslToHex((seed + offset) % 360, saturation, lightness);
  });
}

export function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = l - c / 2;
  const [r, g, b] = hue < 60
    ? [c, x, 0]
    : hue < 120
      ? [x, c, 0]
      : hue < 180
        ? [0, c, x]
        : hue < 240
          ? [0, x, c]
          : hue < 300
            ? [x, 0, c]
            : [c, 0, x];
  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

export function getContrastRatio(first, second) {
  const a = getRelativeLuminance(first);
  const b = getRelativeLuminance(second);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

export function getRelativeLuminance(hex) {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export async function extractPalette(file) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, 80, 80);
  bitmap.close?.();
  const data = context.getImageData(0, 0, 80, 80).data;
  const buckets = new Map();
  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 80) continue;
    const red = Math.round(data[index] / 24) * 24;
    const green = Math.round(data[index + 1] / 24) * 24;
    const blue = Math.round(data[index + 2] / 24) * 24;
    const key = `${red},${green},${blue}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key]) => {
      const [red, green, blue] = key.split(",").map(Number);
      return rgbToHex(red, green, blue);
    });
}

export async function drawPickerImage(file, canvas) {
  if (!canvas) return;
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const maxWidth = 900;
  const ratio = Math.min(1, maxWidth / sourceWidth);
  canvas.width = Math.max(1, Math.round(sourceWidth * ratio));
  canvas.height = Math.max(1, Math.round(sourceHeight * ratio));
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
}

export function readCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)));
  const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)));
  const color = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
  return { x, y, color };
}

export function drawMagnifier(sourceCanvas, targetCanvas, x, y) {
  const context = targetCanvas.getContext("2d");
  const zoom = 11;
  const sample = 11;
  const half = Math.floor(sample / 2);
  context.imageSmoothingEnabled = false;
  context.fillStyle = "#0a0a0a";
  context.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  context.drawImage(
    sourceCanvas,
    Math.max(0, x - half),
    Math.max(0, y - half),
    sample,
    sample,
    0,
    0,
    sample * zoom,
    sample * zoom
  );
  context.strokeStyle = "#ff5a00";
  context.lineWidth = 2;
  context.strokeRect(half * zoom, half * zoom, zoom, zoom);
}

export function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function getReadableTextColor(hex) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#ffffff";
  const red = parseInt(clean.slice(0, 2), 16);
  const green = parseInt(clean.slice(2, 4), 16);
  const blue = parseInt(clean.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 150 ? "#0a0a0a" : "#ffffff";
}

export async function imageToVTracerSvg(file, options) {
  if (!options.canvas || !options.svg) throw new Error("Preview tecnico indisponivel.");
  const vtracer = await import("./vendor/vtracer_webapp.js");
  await vtracer.default(`${import.meta.env.BASE_URL}vtracer_webapp_bg.wasm`);
  await drawFileToCanvas(file, options.canvas, 900);
  options.svg.setAttribute("viewBox", `0 0 ${options.canvas.width} ${options.canvas.height}`);
  options.svg.setAttribute("width", String(options.canvas.width));
  options.svg.setAttribute("height", String(options.canvas.height));
  while (options.svg.firstChild) options.svg.removeChild(options.svg.firstChild);
  const params = JSON.stringify({
    canvas_id: options.canvasId,
    svg_id: options.svgId,
    mode: options.mode,
    clustering_mode: "color",
    hierarchical: options.hierarchical,
    corner_threshold: degreesToRadians(60),
    length_threshold: 4,
    max_iterations: 10,
    splice_threshold: degreesToRadians(45),
    filter_speckle: options.filterSpeckle * options.filterSpeckle,
    color_precision: 8 - options.colorPrecision,
    layer_difference: 32,
    path_precision: 8,
  });
  const converter = vtracer.ColorImageConverter.new_with_string(params);
  try {
    await runVTracerConverter(converter);
    return new XMLSerializer().serializeToString(options.svg);
  } finally {
    converter.free();
  }
}

export async function drawFileToCanvas(file, canvas, maxSide) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
}

export function runVTracerConverter(converter) {
  converter.init();
  return new Promise((resolve) => {
    function tick() {
      let done = false;
      const started = performance.now();
      while (!done && performance.now() - started < 25) {
        done = converter.tick();
      }
      if (done) resolve();
      else setTimeout(tick, 1);
    }
    setTimeout(tick, 1);
  });
}

export function degreesToRadians(degrees) {
  return (degrees / 180) * Math.PI;
}

export async function imageToBlockSvg(file, threshold, cellSize) {
  const source = await loadImageSource(file);
  const bitmap = source.bitmap;
  const sourceWidth = bitmap.naturalWidth || bitmap.width;
  const sourceHeight = bitmap.naturalHeight || bitmap.height;
  const width = Math.min(180, sourceWidth);
  const height = Math.round((sourceHeight / sourceWidth) * width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const data = context.getImageData(0, 0, width, height).data;
  const rects = [];
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      const index = (y * width + x) * 4;
      const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      if (luminance < threshold) {
        rects.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/><g fill="black">${rects.join("")}</g></svg>`;
}
