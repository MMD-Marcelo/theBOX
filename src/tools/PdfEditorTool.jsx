import React, { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { stripExtension, zipDownloads } from "../utils.js";
import DropZone from "../components/DropZone.jsx";
import SimpleFileQueue from "../components/SimpleFileQueue.jsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const editModes = [
  { id: "rotate", label: "Girar" },
  { id: "organize", label: "Organizar" },
  { id: "watermark", label: "Marca d'agua" },
  { id: "sign", label: "Assinar" },
  { id: "number", label: "Numerar paginas" },
];

export default function PdfEditorTool() {
  const [mode, setMode] = useState("rotate");
  const [items, setItems] = useState([]);
  const [degrees, setDegrees] = useState(90);
  const [pageOrder, setPageOrder] = useState("");
  const [watermark, setWatermark] = useState("THEBOX");
  const [watermarkKind, setWatermarkKind] = useState("text");
  const [watermarkImageFile, setWatermarkImageFile] = useState(null);
  const [watermarkPattern, setWatermarkPattern] = useState("center");
  const [watermarkOpacity, setWatermarkOpacity] = useState(22);
  const [watermarkRotation, setWatermarkRotation] = useState(32);
  const [watermarkWidth, setWatermarkWidth] = useState(260);
  const [watermarkGap, setWatermarkGap] = useState(400);
  const [numberStartPage, setNumberStartPage] = useState(1);
  const [numberPosition, setNumberPosition] = useState("bottom-center");
  const [numberSize, setNumberSize] = useState(18);
  const [numberColor, setNumberColor] = useState("#0a0a0a");
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePage, setSignaturePage] = useState(1);
  const [signaturePoint, setSignaturePoint] = useState({ x: 0.68, y: 0.78 });
  const [signatureWidth, setSignatureWidth] = useState(150);
  const [pageCount, setPageCount] = useState(0);
  const [previewSize, setPreviewSize] = useState({ width: 1, height: 1 });
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);
  const [message, setMessage] = useState("");
  const previewRef = useRef(null);
  const previewWrapRef = useRef(null);
  const previewItem = items[0];
  const signaturePreviewUrl = useMemo(
    () => (signatureFile ? URL.createObjectURL(signatureFile) : ""),
    [signatureFile]
  );
  const previewPage = mode === "sign"
    ? signaturePage
    : mode === "number"
      ? numberStartPage
      : 1;
  const previewCanvasWidth = previewRef.current?.clientWidth || previewRef.current?.width || 1;
  const previewCanvasHeight = previewRef.current?.clientHeight || previewRef.current?.height || 1;
  const previewScale = previewCanvasWidth / previewSize.width || 1;
  const previewNumberFontSize = Math.max(5, numberSize * previewScale);
  const signatureWidthPercent = Math.min(80, Math.max(8, (signatureWidth / previewSize.width) * 100));
  const previewNumberStyle = resolvePreviewNumberStyle({
    canvasHeight: previewCanvasHeight,
    canvasWidth: previewCanvasWidth,
    fontSize: previewNumberFontSize,
    label: String(Math.max(1, previewPage - numberStartPage + 1)),
    outputFontSize: numberSize,
    position: numberPosition,
  });

  useEffect(() => {
    if (!previewItem || !previewRef.current) return;
    renderPreview(previewItem, previewRef.current, previewPage).then((info) => {
      setPageCount(info.pageCount);
      setPreviewSize({ width: info.width, height: info.height });
      setSignaturePage((current) => Math.min(Math.max(Number(current) || 1, 1), info.pageCount));
      setNumberStartPage((current) => Math.min(Math.max(Number(current) || 1, 1), info.pageCount));
    }).catch((error) => {
      setMessage(`Erro no preview: ${error.message}`);
    });
  }, [previewItem?.id, previewItem?.downloadUrl, previewItem?.file, previewPage]);

  useEffect(() => () => {
    if (signaturePreviewUrl) URL.revokeObjectURL(signaturePreviewUrl);
  }, [signaturePreviewUrl]);

  function addFiles(files) {
    setMessage("");
    setItems((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: "Pronto",
        downloadUrl: "",
        outputName: "",
        outputSize: 0,
      })),
    ]);
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function updateItem(id, patch) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function runOne(item) {
    try {
      updateItem(item.id, { status: "Editando" });
      const blob = await editPdf(item.file, {
        degrees,
        mode,
        pageOrder,
        signatureFile,
        signaturePage,
        signaturePoint,
        signatureWidth,
        numberPosition,
        numberSize,
        numberColor,
        numberStartPage,
        watermarkImageFile,
        watermarkKind,
        watermark,
        watermarkGap,
        watermarkOpacity,
        watermarkPattern,
        watermarkRotation,
        watermarkWidth,
      });
      updateItem(item.id, {
        status: "Editado",
        downloadUrl: URL.createObjectURL(blob),
        outputName: `${stripExtension(item.file.name)}-${mode}.pdf`,
        outputSize: blob.size,
      });
    } catch (error) {
      updateItem(item.id, { status: "Erro" });
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function runAll() {
    for (const item of items) await runOne(item);
  }

  async function downloadAll() {
    await zipDownloads(items.filter((item) => item.downloadUrl), "thebox-pdfs-editados.zip");
  }

  function moveSignature(event) {
    if (!isDraggingSignature || !previewWrapRef.current) return;
    const rect = previewWrapRef.current.getBoundingClientRect();
    const widthOffset = (signatureWidthPercent / 100) / 2;
    const nextX = ((event.clientX - rect.left) / rect.width) - widthOffset;
    const nextY = ((event.clientY - rect.top) / rect.height) - widthOffset / Math.max(rect.height / rect.width, 0.1);
    setSignaturePoint({
      x: Math.min(0.96, Math.max(0, nextX)),
      y: Math.min(0.96, Math.max(0, nextY)),
    });
  }

  return (
    <div className="tool-shell">
      <div className="pdf-mode-grid five-items">
        {editModes.map((item) => (
          <button
            className={mode === item.id ? "active" : ""}
            key={item.id}
            onClick={() => {
              setMode(item.id);
              setMessage("");
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <DropZone accept="application/pdf" onFile={addFiles}>
        <strong>Enviar PDFs</strong>
        <span>Girar, organizar, assinar, marcar ou numerar</span>
      </DropZone>

      {items.length > 0 && (
        <SimpleFileQueue actionLabel="Editar" items={items} onAction={runOne} onRemove={removeItem} />
      )}

      {items.length > 0 && (
        <div className="pdf-preview-panel">
          <div>
            <strong>Preview</strong>
            <span>{previewItem?.downloadUrl ? "Resultado" : `Pagina ${previewPage}${pageCount ? ` / ${pageCount}` : ""}`}</span>
          </div>
          <div
            className="pdf-preview-canvas-wrap"
            onPointerLeave={() => setIsDraggingSignature(false)}
            onPointerMove={moveSignature}
            onPointerUp={() => setIsDraggingSignature(false)}
            ref={previewWrapRef}
          >
            <canvas ref={previewRef} />
            {mode === "sign" && signaturePreviewUrl && (
              <img
                alt=""
                className="signature-preview"
                draggable="false"
                onPointerDown={(event) => {
                  event.preventDefault();
                  setIsDraggingSignature(true);
                }}
                src={signaturePreviewUrl}
                style={{
                  left: `${signaturePoint.x * 100}%`,
                  top: `${signaturePoint.y * 100}%`,
                  width: `${signatureWidthPercent}%`,
                }}
              />
            )}
            {mode === "number" && !previewItem?.downloadUrl && Number(previewPage) >= Number(numberStartPage) && (
              <span
                className="page-number-preview"
                style={{
                  fontSize: `${previewNumberFontSize}px`,
                  color: numberColor,
                  ...previewNumberStyle,
                }}
              >
                {previewPage - numberStartPage + 1}
              </span>
            )}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions">
          {mode === "rotate" && (
            <label>
              Graus
              <select value={degrees} onChange={(event) => setDegrees(Number(event.target.value))}>
                <option value={90}>90</option>
                <option value={180}>180</option>
                <option value={270}>270</option>
                <option value={0}>0</option>
              </select>
            </label>
          )}
          {mode === "organize" && (
            <label>
              Ordem
              <input
                onChange={(event) => setPageOrder(event.target.value)}
                placeholder="3,1,2 ou 1-4,8"
                value={pageOrder}
              />
            </label>
          )}
          {mode === "watermark" && (
            <>
              <label>
                Tipo
                <select value={watermarkKind} onChange={(event) => setWatermarkKind(event.target.value)}>
                  <option value="text">Texto</option>
                  <option value="image">Imagem</option>
                </select>
              </label>
              {watermarkKind === "text" ? (
                <label>
                  Texto
                  <input onChange={(event) => setWatermark(event.target.value)} value={watermark} />
                </label>
              ) : (
                <label>
                  Imagem
                  <input accept="image/*" onChange={(event) => setWatermarkImageFile(event.target.files?.[0] ?? null)} type="file" />
                </label>
              )}
              <label>
                Largura
                <input min="80" max="700" onChange={(event) => setWatermarkWidth(Number(event.target.value))} type="number" value={watermarkWidth} />
              </label>
              <label>
                Padrao
                <select value={watermarkPattern} onChange={(event) => setWatermarkPattern(event.target.value)}>
                  <option value="center">Central</option>
                  <option value="repeat">Repetir grade</option>
                  <option value="corners">Cantos</option>
                </select>
              </label>
              <label>
                Opacidade
                <input min="5" max="80" onChange={(event) => setWatermarkOpacity(Number(event.target.value))} type="number" value={watermarkOpacity} />
              </label>
              <label>
                Rotacao
                <input min="-90" max="90" onChange={(event) => setWatermarkRotation(Number(event.target.value))} type="number" value={watermarkRotation} />
              </label>
              <label>
                Espaco
                <input min="80" max="600" onChange={(event) => setWatermarkGap(Number(event.target.value))} type="number" value={watermarkGap} />
              </label>
            </>
          )}
          {mode === "sign" && (
            <>
              <label>
                Assinatura
                <input accept="image/*" onChange={(event) => setSignatureFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
              <label>
                Pagina
                <select value={signaturePage} onChange={(event) => setSignaturePage(Number(event.target.value))}>
                  {Array.from({ length: pageCount || 1 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>{index + 1}</option>
                  ))}
                </select>
              </label>
              <label>
                Largura
                <input min="40" max="500" onChange={(event) => setSignatureWidth(Number(event.target.value))} type="number" value={signatureWidth} />
              </label>
            </>
          )}
          {mode === "number" && (
            <>
              <label>
                Comecar na pagina
                <input min="1" max={pageCount || 999} onChange={(event) => setNumberStartPage(Number(event.target.value))} type="number" value={numberStartPage} />
              </label>
              <label>
                Posicao
                <select value={numberPosition} onChange={(event) => setNumberPosition(event.target.value)}>
                  <option value="top-left">Topo esquerda</option>
                  <option value="top-center">Topo centro</option>
                  <option value="top-right">Topo direita</option>
                  <option value="middle-left">Centro esquerda</option>
                  <option value="middle-center">Centro</option>
                  <option value="middle-right">Centro direita</option>
                  <option value="bottom-left">Rodape esquerda</option>
                  <option value="bottom-center">Rodape centro</option>
                  <option value="bottom-right">Rodape direita</option>
                </select>
              </label>
              <label>
                Tamanho
                <input min="8" max="72" onChange={(event) => setNumberSize(Number(event.target.value))} type="number" value={numberSize} />
              </label>
              <label>
                Cor
                <input onChange={(event) => setNumberColor(event.target.value)} type="color" value={numberColor} />
              </label>
            </>
          )}
          <button onClick={runAll} type="button">Aplicar</button>
          <button disabled={!items.some((item) => item.downloadUrl)} onClick={downloadAll} type="button">
            Baixar todos
          </button>
        </div>
      )}

      {mode === "organize" && <p className="status-line">Use numeros de paginas com virgula ou intervalo. Exemplo: 3,1,2 ou 1-4,8.</p>}
      {mode === "sign" && <p className="status-line">Escolha a pagina e arraste a assinatura no preview.</p>}
      {mode === "number" && <p className="status-line">Numerar paginas detecta o total sozinho e comeca a partir da pagina escolhida.</p>}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

async function renderPreview(item, canvas, pageNumber = 1) {
  const source = item.downloadUrl
    ? await fetch(item.downloadUrl).then((response) => response.arrayBuffer())
    : await item.file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(source) }).promise;
  const safePage = Math.min(Math.max(Number(pageNumber) || 1, 1), pdf.numPages);
  const page = await pdf.getPage(safePage);
  const viewport = page.getViewport({ scale: 0.7 });
  const baseViewport = page.getViewport({ scale: 1 });
  const pageCount = pdf.numPages;
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  await pdf.destroy?.();
  return {
    pageCount,
    width: baseViewport.width,
    height: baseViewport.height,
  };
}

async function editPdf(file, options) {
  const { PDFDocument, StandardFonts, degrees: pdfDegrees, rgb } = await import("pdf-lib");
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const output = await PDFDocument.create();
  const pageIndices = options.mode === "organize"
    ? parsePageOrder(options.pageOrder, source.getPageCount())
    : source.getPageIndices();
  const pages = await output.copyPages(source, pageIndices);
  pages.forEach((page) => output.addPage(page));
  const font = await output.embedFont(StandardFonts.HelveticaBold);

  if (options.mode === "rotate") {
    output.getPages().forEach((page) => page.setRotation(pdfDegrees(options.degrees)));
  }

  if (options.mode === "watermark") {
    const opacity = Math.min(Math.max((options.watermarkOpacity ?? 22) / 100, 0.05), 0.8);
    if (options.watermarkKind === "image") {
      if (!options.watermarkImageFile) throw new Error("Envie uma imagem para marca d'agua.");
      const watermarkImage = await embedImage(output, options.watermarkImageFile);
      output.getPages().forEach((page) => {
        drawImageWatermark(page, watermarkImage, {
          gap: options.watermarkGap,
          opacity,
          pdfDegrees,
          pattern: options.watermarkPattern,
          rotation: options.watermarkRotation,
          width: options.watermarkWidth,
        });
      });
    } else {
      output.getPages().forEach((page) => {
        drawTextWatermark(page, options.watermark || "THEBOX", {
          font,
          gap: options.watermarkGap,
          opacity,
          pattern: options.watermarkPattern,
          rotation: options.watermarkRotation,
          rgb,
          pdfDegrees,
        });
      });
    }
  }

  if (options.mode === "number") {
    const pagesToNumber = output.getPages();
    pagesToNumber.forEach((page, index) => {
      const startPage = Math.max(1, Number(options.numberStartPage) || 1);
      if (index + 1 < startPage) return;
      const label = String(index - startPage + 2);
      const fontSize = Math.min(Math.max(Number(options.numberSize) || 18, 8), 72);
      const { x, y } = resolveNumberPlacement(options.numberPosition, page, label.length, fontSize);
      page.drawText(label, { x, y, size: fontSize, font, color: hexToRgb(options.numberColor, rgb) });
    });
  }

  if (options.mode === "sign") {
    if (!options.signatureFile) throw new Error("Envie uma imagem de assinatura.");
    const signature = await embedImage(output, options.signatureFile);
    const pagesToSign = output.getPages();
    const pageIndex = resolvePageIndex(options.signaturePage, pagesToSign.length);
    const page = pagesToSign[pageIndex];
    const { width, height } = page.getSize();
    const signatureWidth = Math.min(Math.max(options.signatureWidth || 150, 40), width * 0.8);
    const signatureHeight = (signature.height / signature.width) * signatureWidth;
    const { x, y } = resolveSignaturePoint(options.signaturePoint, width, height, signatureWidth, signatureHeight);
    page.drawImage(signature, { x, y, width: signatureWidth, height: signatureHeight });
  }

  return new Blob([await output.save({ useObjectStreams: true })], { type: "application/pdf" });
}

async function embedImage(pdf, file) {
  const bytes = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "jpg" || extension === "jpeg" || extension === "jfif" || file.type === "image/jpeg"
    ? pdf.embedJpg(bytes)
    : pdf.embedPng(bytes);
}

function resolvePageIndex(value, pageCount) {
  if (String(value).trim().toLowerCase() === "ultima") return pageCount - 1;
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1 || page > pageCount) {
    throw new Error("Pagina de assinatura invalida.");
  }
  return page - 1;
}

function drawTextWatermark(page, text, options) {
  const { width, height } = page.getSize();
  const size = Math.max(18, Math.min(width, height) / 13);
  const color = options.rgb(1, 0.35, 0);
  const rotate = options.pdfDegrees(Number(options.rotation) || 0);
  const draw = (x, y) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: options.font,
      color,
      opacity: options.opacity,
      rotate,
    });
  };

  if (options.pattern === "repeat") {
    const gap = Math.max(80, Number(options.gap) || 180);
    for (let y = -gap; y < height + gap; y += gap) {
      for (let x = -gap; x < width + gap; x += gap) {
        draw(x, y);
      }
    }
    return;
  }

  if (options.pattern === "corners") {
    draw(42, height - 72);
    draw(width - options.font.widthOfTextAtSize(text, size) - 42, 42);
    return;
  }

  draw(width * 0.18, height * 0.48);
}

function drawImageWatermark(page, image, options) {
  const { width, height } = page.getSize();
  const imageWidth = Math.min(Number(options.width) || 260, width * 0.72);
  const imageHeight = (image.height / image.width) * imageWidth;
  const rotate = options.rotation ? { rotate: options.pdfDegrees(Number(options.rotation) || 0) } : {};
  const draw = (x, y) => {
    page.drawImage(image, {
      x,
      y,
      width: imageWidth,
      height: imageHeight,
      opacity: options.opacity,
      ...rotate,
    });
  };

  if (options.pattern === "repeat") {
    const gap = Math.max(80, Number(options.gap) || 180);
    for (let y = -gap; y < height + gap; y += gap) {
      for (let x = -gap; x < width + gap; x += gap) {
        draw(x, y);
      }
    }
    return;
  }

  if (options.pattern === "corners") {
    draw(42, height - imageHeight - 42);
    draw(width - imageWidth - 42, 42);
    return;
  }

  draw((width - imageWidth) / 2, (height - imageHeight) / 2);
}

function resolveSignaturePoint(point, pageWidth, pageHeight, itemWidth, itemHeight) {
  const x = Math.min(pageWidth - itemWidth, Math.max(0, (point?.x ?? 0.68) * pageWidth));
  const top = Math.min(pageHeight - itemHeight, Math.max(0, (point?.y ?? 0.78) * pageHeight));
  return {
    x,
    y: pageHeight - top - itemHeight,
  };
}

function resolveNumberPlacement(position, page, labelLength, fontSize) {
  const { width, height } = page.getSize();
  const textWidth = estimateTextWidth(labelLength, fontSize);
  const margin = getNumberMargin(fontSize);
  const point = resolveNumberTopLeftPoint(position, width, height, textWidth, fontSize, margin);
  return {
    x: point.x,
    y: height - point.top - fontSize,
  };
}

function resolvePreviewNumberStyle({ canvasHeight, canvasWidth, fontSize, label, outputFontSize, position }) {
  const scale = fontSize / outputFontSize || 1;
  const textWidth = estimateTextWidth(label.length, fontSize);
  const margin = getNumberMargin(outputFontSize) * scale;
  const { x, top } = resolveNumberTopLeftPoint(position, canvasWidth, canvasHeight, textWidth, fontSize, margin);
  return {
    left: `${x}px`,
    top: `${top}px`,
  };
}

function resolveNumberTopLeftPoint(position, width, height, textWidth, fontSize, margin) {
  const [vertical = "bottom", horizontal = "center"] = String(position || "bottom-center").split("-");
  const xByPosition = {
    left: margin,
    center: width / 2 - textWidth / 2,
    right: width - textWidth - margin,
  };
  const topByPosition = {
    top: margin,
    middle: height / 2 - fontSize / 2,
    bottom: height - margin - fontSize,
  };
  return {
    x: Math.min(width - textWidth, Math.max(0, xByPosition[horizontal] ?? xByPosition.center)),
    top: Math.min(height - fontSize, Math.max(0, topByPosition[vertical] ?? topByPosition.bottom)),
  };
}

function estimateTextWidth(labelLength, fontSize) {
  return Math.max(8, labelLength * fontSize * 0.58);
}

function getNumberMargin(fontSize) {
  return Math.max(28, fontSize * 2.2);
}

function hexToRgb(hex, rgb) {
  const clean = String(hex || "#0a0a0a").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return rgb(0, 0, 0);
  const red = parseInt(clean.slice(0, 2), 16) / 255;
  const green = parseInt(clean.slice(2, 4), 16) / 255;
  const blue = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
}

function parsePageOrder(value, pageCount) {
  if (!value.trim()) return Array.from({ length: pageCount }, (_, index) => index);
  const pages = [];
  for (const part of value.split(",")) {
    const clean = part.trim();
    if (!clean) continue;
    if (clean.includes("-")) {
      const [start, end] = clean.split("-").map((item) => Number(item.trim()));
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const step = start <= end ? 1 : -1;
      for (let page = start; step > 0 ? page <= end : page >= end; page += step) {
        if (page >= 1 && page <= pageCount) pages.push(page - 1);
      }
    } else {
      const page = Number(clean);
      if (page >= 1 && page <= pageCount) pages.push(page - 1);
    }
  }
  if (!pages.length) throw new Error("Ordem de paginas invalida.");
  return pages;
}
