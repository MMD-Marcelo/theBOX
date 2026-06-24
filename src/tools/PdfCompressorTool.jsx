import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Download, FileText, Trash2 } from "lucide-react";
import DropZone from "../components/DropZone.jsx";
import {
  canvasToBlob,
  formatBytes,
  getExtension,
  stripExtension,
  triggerDownload,
  zipDownloads,
} from "../utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfCompressorTool() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("structure");
  const [quality, setQuality] = useState(55);
  const [scale, setScale] = useState(1);
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

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function compressAll() {
    if (!items.length) return;
    try {
      const nextItems = [];
      for (const item of items) {
        const result = mode === "raster"
          ? await compressPdfBestEffort(item.file, { quality: quality / 100, scale })
          : await compressPdfStructure(item.file);
        nextItems.push({
          ...item,
          status: result.blob.size < item.file.size ? "Comprimido" : "Sem ganho",
          downloadUrl: result.blob.size < item.file.size ? URL.createObjectURL(result.blob) : "",
          outputName: `${stripExtension(item.file.name)}-comprimido.pdf`,
          outputSize: result.blob.size,
          engine: result.engine,
        });
      }
      setItems(nextItems);
      const gains = nextItems.filter((item) => item.downloadUrl).length;
      setMessage(gains
        ? `${gains} PDF(s) reduzidos. O compressor sempre escolhe o menor resultado.`
        : "Nenhum PDF ficou menor que o original com os motores atuais.");
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
      setItems((current) => current.map((item) => ({
        ...item,
        status: "Erro",
        downloadUrl: "",
        outputName: "",
        outputSize: 0,
      })));
    }
  }

  async function downloadAll() {
    if (outputItems.length === 1) {
      triggerDownload(outputItems[0].downloadUrl, outputItems[0].outputName);
      return;
    }
    await zipDownloads(outputItems, "thebox-pdfs-comprimidos.zip");
  }

  return (
    <div className="tool-shell">
      <DropZone accept="application/pdf" onFile={addFiles}>
        <strong>Enviar PDFs</strong>
        <span>Otimizar leve ou recomprimir pesado</span>
      </DropZone>

      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => (
            <div className="file-row pdf-compressor-row" key={item.id}>
              <div className="file-main">
                <FileText aria-hidden="true" size={20} />
                <div>
                  <strong>{item.file.name}</strong>
                  <span>{getExtension(item.file.name).toUpperCase() || "PDF"} / {formatBytes(item.file.size)}</span>
                </div>
              </div>
              <span className="compression-size">{item.outputSize ? formatBytes(item.outputSize) : "-"}</span>
              <span className="compression-size">
                {item.outputSize ? `${Math.max(0, 100 - (item.outputSize / item.file.size) * 100).toFixed(1)}%` : "-"}
              </span>
              <span className={`queue-status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span>
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
        <div className="batch-actions">
          <label>
            Motor
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="structure">Estrutural</option>
              <option value="raster">Pesado</option>
            </select>
          </label>
          {mode === "raster" && (
            <>
              <label>
                Qualidade
                <input
                  max="95"
                  min="30"
                  onChange={(event) => setQuality(Number(event.target.value))}
                  type="number"
                  value={quality}
                />
              </label>
              <label>
                Escala
                <select value={scale} onChange={(event) => setScale(Number(event.target.value))}>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </label>
            </>
          )}
          <button onClick={compressAll} type="button">Comprimir</button>
          <button disabled={!outputItems.length} onClick={downloadAll} type="button">Baixar todos</button>
        </div>
      )}

      {mode === "raster" && (
        <p className="status-line">Modo pesado rasteriza o PDF. Se ele gerar arquivo maior, o THEBOX tenta uma versao mais agressiva e compara com o motor estrutural.</p>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

async function compressPdfStructure(file) {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setProducer("THEBOX");
  pdf.setCreator("THEBOX");
  const bytes = await pdf.save({
    addDefaultPage: false,
    objectsPerTick: 50,
    useObjectStreams: true,
  });
  return { blob: new Blob([bytes], { type: "application/pdf" }), engine: "Estrutural" };
}

async function compressPdfBestEffort(file, options) {
  const candidates = [];
  const selectedRaster = await compressPdfByRasterizing(file, options);
  candidates.push({ blob: selectedRaster, engine: "Pesado" });

  if (options.scale > 0.75 || options.quality > 0.45) {
    const aggressiveRaster = await compressPdfByRasterizing(file, {
      quality: Math.min(options.quality, 0.45),
      scale: Math.min(options.scale, 0.75),
    });
    candidates.push({ blob: aggressiveRaster, engine: "Pesado agressivo" });
  }

  candidates.push(await compressPdfStructure(file));
  return candidates.sort((a, b) => a.blob.size - b.blob.size)[0];
}

async function compressPdfByRasterizing(file, options) {
  const { PDFDocument } = await import("pdf-lib");
  const data = new Uint8Array(await file.arrayBuffer());
  const source = await pdfjsLib.getDocument({ data }).promise;
  const output = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
    const page = await source.getPage(pageNumber);
    const viewport = page.getViewport({ scale: options.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const jpeg = await canvasToBlob(canvas, "image/jpeg", options.quality);
    const embedded = await output.embedJpg(await jpeg.arrayBuffer());
    const outputPage = output.addPage([embedded.width, embedded.height]);
    outputPage.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }

  await source.destroy?.();
  return new Blob([await output.save({ useObjectStreams: true })], { type: "application/pdf" });
}
