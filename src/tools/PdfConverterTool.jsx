import React, { useMemo, useState } from "react";
import { Download, FileText, Trash2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import DropZone from "../components/DropZone.jsx";
import {
  canvasToBlob,
  formatBytes,
  getExtension,
  imagesToMergedPdf,
  stripExtension,
  triggerDownload,
  zipDownloads,
} from "../utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const modes = [
  { id: "images-to-pdf", label: "Imagem -> PDF", accept: "image/*", hint: "JPG, PNG, WebP, AVIF, BMP, HEIC, ICO" },
  { id: "pdf-to-image", label: "PDF -> imagem", accept: "application/pdf", hint: "Renderiza cada pagina em JPG ou PNG" },
  { id: "pdf-to-webp", label: "PDF -> WebP", accept: "application/pdf", hint: "Renderiza cada pagina em WebP" },
  { id: "pdf-grayscale", label: "PDF cinza", accept: "application/pdf", hint: "Converte paginas para tons de cinza" },
  { id: "pdf-a", label: "PDF -> PDF/A", accept: "application/pdf", hint: "Regrava com metadados basicos de arquivamento" },
  { id: "docx-to-pdf", label: "DOCX -> PDF", accept: ".docx", hint: "Renderiza Word DOCX com motor WASM" },
  { id: "pptx-to-pdf", label: "PPTX -> PDF", accept: ".pptx", hint: "Renderiza PowerPoint PPTX com motor WASM" },
];

const imageTargets = [
  { id: "jpg", label: "JPG", mime: "image/jpeg", extension: "jpg" },
  { id: "png", label: "PNG", mime: "image/png", extension: "png" },
  { id: "webp", label: "WebP", mime: "image/webp", extension: "webp" },
];

export default function PdfConverterTool() {
  const [mode, setMode] = useState("images-to-pdf");
  const [items, setItems] = useState([]);
  const [targetImage, setTargetImage] = useState("jpg");
  const [mergeImages, setMergeImages] = useState(true);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const activeMode = useMemo(() => modes.find((item) => item.id === mode) ?? modes[0], [mode]);
  const outputItems = items.filter((item) => item.downloadUrl);

  function addFiles(files) {
    setMessage("");
    setItems((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: "Pronto",
      })),
    ]);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setItems([]);
    setMessage("");
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function run() {
    if (!items.length || isProcessing) return;
    setMessage("");
    setIsProcessing(true);
    try {
      if (mode === "images-to-pdf") await convertImagesToPdf();
      if (mode === "pdf-to-image") await convertPdfToImages();
      if (mode === "pdf-to-webp") await convertPdfToWebp();
      if (mode === "pdf-grayscale") await convertPdfToGrayscale();
      if (mode === "pdf-a") await convertPdfToPdfA();
      if (mode === "docx-to-pdf" || mode === "pptx-to-pdf") await convertOfficeToPdf();
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
      setItems((current) => current.map((item) => ({ ...item, status: "Erro" })));
    } finally {
      setIsProcessing(false);
    }
  }

  async function convertImagesToPdf() {
    const blob = await imagesToMergedPdf(items.map((item) => item.file));
    const url = URL.createObjectURL(blob);
    const outputName = mergeImages || items.length > 1
      ? "thebox-imagens.pdf"
      : `${stripExtension(items[0].file.name)}.pdf`;
    setSingleOutput(blob, outputName, `${items.length} imagem(ns) convertida(s) para PDF`);
  }

  async function convertPdfToImages() {
    const target = imageTargets.find((item) => item.id === targetImage) ?? imageTargets[0];
    const nextItems = [];
    for (const item of items) {
      nextItems.push(...await renderPdfPages(item.file, target));
    }
    setItems(nextItems);
    setMessage(`${nextItems.length} imagem(ns) gerada(s)`);
  }

  async function convertPdfToPdfA() {
    const nextItems = [];
    for (const item of items) {
      const blob = await pdfToArchivePdf(item.file);
      nextItems.push(outputItemFromBlob(item, blob, `${stripExtension(item.file.name)}-pdfa-basico.pdf`));
    }
    setItems(nextItems);
    setMessage(`${nextItems.length} PDF(s) regravados com metadados basicos de arquivamento`);
  }

  async function convertPdfToWebp() {
    const nextItems = [];
    for (const item of items) {
      nextItems.push(...await renderPdfPages(item.file, imageTargets[2]));
    }
    setItems(nextItems);
    setMessage(`${nextItems.length} WebP gerado(s)`);
  }

  async function convertPdfToGrayscale() {
    const nextItems = [];
    for (const item of items) {
      const blob = await pdfToGrayscalePdf(item.file);
      nextItems.push(outputItemFromBlob(item, blob, `${stripExtension(item.file.name)}-cinza.pdf`));
    }
    setItems(nextItems);
    setMessage(`${nextItems.length} PDF(s) convertidos para tons de cinza`);
  }

  async function convertOfficeToPdf() {
    const nextItems = [];
    for (const item of items) {
      setItems((current) => current.map((currentItem) => (
        currentItem.id === item.id ? { ...currentItem, status: "Convertendo" } : currentItem
      )));
      try {
        const blob = await officeFileToPdf(item.file);
        const output = outputItemFromBlob(item, blob, `${stripExtension(item.file.name)}.pdf`);
        nextItems.push(output);
        setItems((current) => current.map((currentItem) => (
          currentItem.id === item.id ? output : currentItem
        )));
      } catch (error) {
        setItems((current) => current.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, status: "Erro", outputSize: undefined, downloadUrl: "", outputName: "" }
            : currentItem
        )));
        throw new Error(`${item.file.name}: ${error.message}`);
      }
      await yieldToBrowser();
    }
    setMessage(`${nextItems.length} arquivo(s) Office convertido(s) para PDF`);
  }

  function setSingleOutput(blob, outputName, nextMessage) {
    const url = URL.createObjectURL(blob);
    setItems((current) => current.map((item, index) => ({
      ...item,
      status: index === 0 ? "Convertido" : "Pronto",
      downloadUrl: index === 0 ? url : "",
      outputName: index === 0 ? outputName : "",
      outputSize: index === 0 ? blob.size : undefined,
    })));
    setMessage(nextMessage);
  }

  async function downloadAll() {
    if (outputItems.length === 1) {
      triggerDownload(outputItems[0].downloadUrl, outputItems[0].outputName);
      return;
    }
    await zipDownloads(outputItems, "thebox-pdf-conversoes.zip");
  }

  return (
    <div className="tool-shell">
      <div className="pdf-mode-grid">
        {modes.map((item) => (
          <button
            className={mode === item.id ? "active" : ""}
            key={item.id}
            onClick={() => changeMode(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <DropZone accept={activeMode.accept} onFile={addFiles}>
        <strong>Enviar arquivos</strong>
        <span>{activeMode.hint}</span>
      </DropZone>

      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => (
            <div className="file-row pdf-converter-row" key={item.id}>
              <div className="file-main">
                <FileText aria-hidden="true" size={20} />
                <div>
                  <strong>{item.file.name}</strong>
                  <span>{getExtension(item.file.name).toUpperCase() || "ARQUIVO"} / {formatBytes(item.file.size)}</span>
                </div>
              </div>
              <span className="compression-size">{item.outputSize ? formatBytes(item.outputSize) : "-"}</span>
              <span className={`queue-status ${item.status.toLowerCase()}`}>{item.status}</span>
              {item.downloadUrl ? (
                <a className="icon-button" download={item.outputName} href={item.downloadUrl}>
                  <Download aria-hidden="true" size={18} />
                </a>
              ) : (
                <span aria-hidden="true" />
              )}
              <button className="icon-button" onClick={() => removeItem(item.id)} type="button">
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions pdf-actions">
          {mode === "pdf-to-image" && (
            <label>
              Converter para
              <select value={targetImage} onChange={(event) => setTargetImage(event.target.value)}>
                {imageTargets.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          )}
          {mode === "images-to-pdf" && (
            <label className="toggle-label">
              <input
                checked={mergeImages}
                onChange={(event) => setMergeImages(event.target.checked)}
                type="checkbox"
              />
              Juntar em um PDF
            </label>
          )}
          <button disabled={isProcessing} onClick={run} type="button">
            {isProcessing ? "Convertendo" : "Converter"}
          </button>
          <button disabled={!outputItems.length} onClick={downloadAll} type="button">Baixar todos</button>
        </div>
      )}

      {(mode === "docx-to-pdf" || mode === "pptx-to-pdf" || mode === "pdf-a") && (
        <p className="status-line">Conversao local com renderizacao WASM. Arquivos grandes podem demorar mais no primeiro uso.</p>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

function outputItemFromBlob(item, blob, outputName) {
  return {
    ...item,
    file: new File([blob], outputName, { type: blob.type }),
    status: "Convertido",
    downloadUrl: URL.createObjectURL(blob),
    outputName,
    outputSize: blob.size,
  };
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function renderPdfPages(file, target, options = {}) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const items = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    if (options.grayscale) grayscaleCanvas(canvas);
    const blob = await canvasToBlob(canvas, target.mime, target.id === "jpg" ? 0.92 : 1);
    const outputName = `${stripExtension(file.name)}-pagina-${pageNumber}.${target.extension}`;
    items.push({
      id: `${file.name}-${pageNumber}-${crypto.randomUUID()}`,
      file: new File([blob], outputName, { type: target.mime }),
      status: "Convertido",
      downloadUrl: URL.createObjectURL(blob),
      outputName,
      outputSize: blob.size,
    });
  }
  await pdf.destroy?.();
  return items;
}

function grayscaleCanvas(canvas) {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const gray = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
    data[index] = gray;
    data[index + 1] = gray;
    data[index + 2] = gray;
  }
  context.putImageData(imageData, 0, 0);
}

async function textToPdf(text, title) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setCreator("THEBOX");
  pdf.setProducer("THEBOX");
  const font = await pdf.embedFont(StandardFonts.Courier);
  const fontSize = 11;
  const margin = 42;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const lineHeight = 15;
  const maxChars = 86;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const lines = wrapText(text || "(sem texto extraido)", maxChars);
  for (const line of lines) {
    if (y < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= lineHeight;
  }

  return new Blob([await pdf.save({ useObjectStreams: true })], { type: "application/pdf" });
}

function wrapText(text, maxChars) {
  const output = [];
  for (const rawLine of text.replace(/\r/g, "").split("\n")) {
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const word of words) {
      if (!word) continue;
      if ((line + " " + word).trim().length > maxChars) {
        output.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    }
    output.push(line);
  }
  return output;
}

async function pdfToArchivePdf(file) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  pdf.setTitle(stripExtension(file.name));
  pdf.setCreator("THEBOX");
  pdf.setProducer("THEBOX PDF/A basico");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());
  return new Blob([await pdf.save({ useObjectStreams: true })], { type: "application/pdf" });
}

async function pdfToGrayscalePdf(file) {
  const { PDFDocument } = await import("pdf-lib");
  const pages = await renderPdfPages(file, imageTargets[0], { grayscale: true });
  const output = await PDFDocument.create();
  for (const item of pages) {
    const image = await output.embedJpg(await item.file.arrayBuffer());
    const page = output.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return new Blob([await output.save({ useObjectStreams: true })], { type: "application/pdf" });
}

async function officeFileToPdf(file) {
  const extension = getExtension(file.name);
  if (extension === "docx") return docxToVisualPdf(file);
  if (extension === "pptx") return pptxToVisualPdf(file);
  throw new Error(`${extension.toUpperCase()} nao e suportado neste conversor.`);
}

async function docxToVisualPdf(file) {
  const { PDFDocument } = await import("pdf-lib");
  const { DocxDocument } = await import("@silurus/ooxml/docx");
  const docxDocument = await DocxDocument.load(await file.arrayBuffer(), {
    useGoogleFonts: false,
  });
  try {
    const pdf = await PDFDocument.create();
    for (let index = 0; index < docxDocument.pageCount; index += 1) {
      const canvas = document.createElement("canvas");
      await docxDocument.renderPage(canvas, index, {
        width: 1240,
        dpr: 1.5,
        showTrackChanges: false,
      });
      await appendCanvasAsPdfPage(pdf, canvas);
    }
    if (!pdf.getPageCount()) return textToPdf(await docxToText(file), stripExtension(file.name));
    return new Blob([await pdf.save({ useObjectStreams: true })], { type: "application/pdf" });
  } finally {
    docxDocument.destroy();
  }
}

async function appendCanvasAsPdfPage(pdf, canvas) {
  if (!canvas.width || !canvas.height) return;
  const png = await canvasToBlob(canvas, "image/png", 1);
  const image = await pdf.embedPng(await png.arrayBuffer());
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
}

async function pptxToVisualPdf(file) {
  const { PDFDocument } = await import("pdf-lib");
  const { PptxPresentation } = await import("@silurus/ooxml/pptx");
  const presentation = await PptxPresentation.load(await file.arrayBuffer(), {
    useGoogleFonts: false,
  });
  const pdf = await PDFDocument.create();
  try {
    for (let index = 0; index < presentation.slideCount; index += 1) {
      const canvas = document.createElement("canvas");
      await presentation.renderSlide(canvas, index, {
        width: 1400,
        dpr: 1.5,
      });
      await appendCanvasAsPdfPage(pdf, canvas);
    }
  } finally {
    presentation.destroy();
  }
  if (!pdf.getPageCount()) return textToPdf(await pptxToText(file), stripExtension(file.name));
  return new Blob([await pdf.save({ useObjectStreams: true })], { type: "application/pdf" });
}

async function pptxToJson(file) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] ?? 0) - Number(b.match(/slide(\d+)/)?.[1] ?? 0));
  const slides = [];
  for (const [index, name] of slideFiles.entries()) {
    const xml = await zip.file(name).async("text");
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const texts = [...doc.getElementsByTagName("a:t")]
      .map((node, textIndex) => ({
        index: textIndex + 1,
        text: node.textContent ?? "",
      }))
      .filter((item) => item.text.trim());
    slides.push({
      index: index + 1,
      path: name,
      texts,
    });
  }
  return slides;
}

async function docxToText(file) {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function pptxToText(file) {
  const slides = await pptxToJson(file);
  return slides.map((slide) => `Slide ${slide.index}\n${slide.texts.map((item) => item.text).join("\n")}`).join("\n\n");
}
