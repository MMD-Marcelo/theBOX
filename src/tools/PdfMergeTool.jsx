import React, { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { formatBytes } from "../utils.js";
import DropZone from "../components/DropZone.jsx";

export default function PdfMergeTool() {
  const [items, setItems] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");

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

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function merge() {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      for (const item of items) {
        const input = await PDFDocument.load(await item.file.arrayBuffer());
        const pages = await output.copyPages(input, input.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const blob = new Blob([await output.save()], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setMessage(`${items.length} PDFs juntados`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  return (
    <div className="tool-shell">
      <DropZone accept="application/pdf" onFile={addFiles}>
        <strong>Enviar PDFs</strong>
        <span>Juntar em um arquivo</span>
      </DropZone>
      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => (
            <div className="file-row pdf-row" key={item.id}>
              <div className="file-main">
                <FileText aria-hidden="true" size={20} />
                <div>
                  <strong>{item.file.name}</strong>
                  <span>{formatBytes(item.file.size)}</span>
                </div>
              </div>
              <button className="icon-button" onClick={() => removeItem(item.id)} type="button">
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="batch-actions">
          <button disabled={items.length < 2} onClick={merge} type="button">Juntar</button>
          {downloadUrl && <a className="download" download="thebox-pdfs.pdf" href={downloadUrl}>Baixar PDF</a>}
        </div>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
