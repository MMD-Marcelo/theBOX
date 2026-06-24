import React, { useState } from "react";
import { stripExtension, zipDownloads } from "../utils.js";
import DropZone from "../components/DropZone.jsx";
import SimpleFileQueue from "../components/SimpleFileQueue.jsx";

export default function PdfRotateTool() {
  const [items, setItems] = useState([]);
  const [degrees, setDegrees] = useState(90);
  const [message, setMessage] = useState("");

  function addFiles(files) {
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

  function updateItem(id, patch) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function rotateOne(item) {
    try {
      const { PDFDocument, degrees: pdfDegrees } = await import("pdf-lib");
      updateItem(item.id, { status: "Girando" });
      const pdf = await PDFDocument.load(await item.file.arrayBuffer());
      pdf.getPages().forEach((page) => page.setRotation(pdfDegrees(degrees)));
      const blob = new Blob([await pdf.save()], { type: "application/pdf" });
      updateItem(item.id, {
        status: "Convertido",
        downloadUrl: URL.createObjectURL(blob),
        outputName: `${stripExtension(item.file.name)}-girado.pdf`,
        outputSize: blob.size,
      });
    } catch (error) {
      updateItem(item.id, { status: "Erro" });
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function rotateAll() {
    for (const item of items) await rotateOne(item);
  }

  async function downloadAll() {
    await zipDownloads(items.filter((item) => item.downloadUrl), "thebox-pdfs-girados.zip");
  }

  return (
    <div className="tool-shell">
      <DropZone accept="application/pdf" onFile={addFiles}>
        <strong>Enviar PDFs</strong>
        <span>Girar todas as paginas</span>
      </DropZone>
      {items.length > 0 && (
        <SimpleFileQueue actionLabel="Girar" items={items} onAction={rotateOne} onRemove={removeItem} />
      )}
      {items.length > 0 && (
        <div className="batch-actions">
          <label>
            Graus
            <select value={degrees} onChange={(event) => setDegrees(Number(event.target.value))}>
              <option value={90}>90</option>
              <option value={180}>180</option>
              <option value={270}>270</option>
            </select>
          </label>
          <button onClick={rotateAll} type="button">Girar</button>
          <button disabled={!items.some((item) => item.downloadUrl)} onClick={downloadAll} type="button">Baixar todos</button>
        </div>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
