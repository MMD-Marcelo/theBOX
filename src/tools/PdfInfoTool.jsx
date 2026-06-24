import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Download, FileText, Trash2 } from "lucide-react";
import DropZone from "../components/DropZone.jsx";
import { canvasToBlob, formatBytes, getExtension, stripExtension, triggerDownload, zipDownloads } from "../utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfInfoTool({ tool }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const outputItems = items.filter((item) => item.downloadUrl);

  function addFiles(files) {
    setItems((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: "Pronto",
      })),
    ]);
  }

  async function repairAll() {
    try {
      const nextItems = [];
      for (const item of items) {
        const result = await repairPdf(item.file);
        nextItems.push({
          ...item,
          status: "Reparado",
          downloadUrl: URL.createObjectURL(result.blob),
          outputName: `${stripExtension(item.file.name)}-reparado.pdf`,
          outputSize: result.blob.size,
          engine: result.engine,
        });
      }
      setItems(nextItems);
      setMessage(`${nextItems.length} PDF(s) reparados`);
    } catch (error) {
      setItems((current) => current.map((item) => ({ ...item, status: "Erro" })));
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function downloadAll() {
    if (outputItems.length === 1) {
      triggerDownload(outputItems[0].downloadUrl, outputItems[0].outputName);
      return;
    }
    await zipDownloads(outputItems, "thebox-pdfs-reparados.zip");
  }

  return (
    <div className="tool-shell">
      <DropZone accept="application/pdf" onFile={addFiles}>
        <strong>Enviar PDFs</strong>
        <span>{tool.name}: regravar estrutura ou rasterizar paginas</span>
      </DropZone>

      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => (
            <div className="file-row pdf-converter-row" key={item.id}>
              <div className="file-main">
                <FileText aria-hidden="true" size={20} />
                <div>
                  <strong>{item.file.name}</strong>
                  <span>{getExtension(item.file.name).toUpperCase() || "PDF"} / {formatBytes(item.file.size)}</span>
                </div>
              </div>
              <span className="compression-size">{item.outputSize ? formatBytes(item.outputSize) : "-"}</span>
              <span className={`queue-status ${item.status.toLowerCase()}`}>{item.status}</span>
              {item.downloadUrl ? (
                <a className="icon-button" download={item.outputName} href={item.downloadUrl}>
                  <Download aria-hidden="true" size={18} />
                </a>
              ) : <span aria-hidden="true" />}
              <button
                className="icon-button"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                type="button"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions">
          <button onClick={repairAll} type="button">Reparar</button>
          <button disabled={!outputItems.length} onClick={downloadAll} type="button">Baixar todos</button>
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

async function repairPdf(file) {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
    return {
      blob: new Blob([await output.save({ useObjectStreams: true })], { type: "application/pdf" }),
      engine: "Estrutural",
    };
  } catch {
    return { blob: await rasterRepairPdf(file), engine: "Raster" };
  }
}

async function rasterRepairPdf(file) {
  const { PDFDocument } = await import("pdf-lib");
  const data = new Uint8Array(await file.arrayBuffer());
  const source = await pdfjsLib.getDocument({ data }).promise;
  const output = await PDFDocument.create();
  for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
    const page = await source.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const jpg = await canvasToBlob(canvas, "image/jpeg", 0.9);
    const image = await output.embedJpg(await jpg.arrayBuffer());
    const outputPage = output.addPage([image.width, image.height]);
    outputPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  await source.destroy?.();
  return new Blob([await output.save({ useObjectStreams: true })], { type: "application/pdf" });
}
