import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Copy, Download, FileText, Trash2 } from "lucide-react";
import DropZone from "../components/DropZone.jsx";
import {
  formatBytes,
  getExtension,
  stripExtension,
  triggerDownload,
} from "../utils.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfScanTool() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const outputText = items
    .filter((item) => item.text)
    .map((item) => `# ${item.file.name}\n\n${item.text.trim()}`)
    .join("\n\n---\n\n");

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

  async function runScan() {
    try {
      const nextItems = [];
      for (const item of items) {
        const text = isPdfFile(item.file) ? await extractPdfText(item.file) : "";
        nextItems.push({
          ...item,
          status: text.trim() ? "Extraido" : "Sem texto",
          text,
          textLength: text.trim().length,
        });
      }
      setItems(nextItems);
      setMessage(`${nextItems.length} arquivo(s) lidos para texto`);
    } catch (error) {
      setItems((current) => current.map((item) => ({ ...item, status: "Erro" })));
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function copyText() {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setMessage("Texto copiado para a area de transferencia");
  }

  function downloadText() {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, items.length === 1 ? `${stripExtension(items[0].file.name)}.txt` : "thebox-ocr.txt");
    URL.revokeObjectURL(url);
  }

  return (
    <div className="tool-shell">
      <DropZone accept="application/pdf,image/*" onFile={addFiles}>
        <strong>Enviar arquivo</strong>
        <span>PDF com texto selecionavel, ou imagem para catalogar sem OCR</span>
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
              <span className="compression-size">{item.textLength ? `${item.textLength} chars` : "-"}</span>
              <span className={`queue-status ${item.status.toLowerCase()}`}>{item.status}</span>
              {item.text ? (
                <button className="icon-button" onClick={() => navigator.clipboard.writeText(item.text)} type="button">
                  <Copy aria-hidden="true" size={18} />
                </button>
              ) : <span aria-hidden="true" />}
              <button className="icon-button" onClick={() => removeItem(item.id)} type="button">
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions">
          <button onClick={runScan} type="button">Extrair texto</button>
          <button disabled={!outputText} onClick={copyText} type="button">Copiar texto</button>
          <button disabled={!outputText} onClick={downloadText} type="button">
            <Download aria-hidden="true" size={18} />
            Baixar TXT
          </button>
        </div>
      )}

      {outputText && (
        <textarea className="big-input scan-text-output" readOnly value={outputText} />
      )}

      <p className="status-line">Extrai texto selecionavel de PDF. Imagem entra no fluxo, mas sem OCR lento nao ha texto interno para copiar.</p>
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

function isPdfFile(file) {
  return file.type === "application/pdf" || getExtension(file.name) === "pdf";
}

async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  await pdf.destroy?.();
  return pages.join("\n\n");
}
