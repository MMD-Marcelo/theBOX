import React, { useState } from "react";
import { stripExtension, zipDownloads } from "../utils.js";
import DropZone from "../components/DropZone.jsx";
import SimpleFileQueue from "../components/SimpleFileQueue.jsx";

export default function PdfSplitTool() {
  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  async function split() {
    if (!file) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const input = await PDFDocument.load(await file.arrayBuffer());
      const nextItems = [];
      for (const index of input.getPageIndices()) {
        const output = await PDFDocument.create();
        const [page] = await output.copyPages(input, [index]);
        output.addPage(page);
        const blob = new Blob([await output.save()], { type: "application/pdf" });
        nextItems.push({
          id: `${file.name}-${index}`,
          file: new File([blob], `${stripExtension(file.name)}-pagina-${index + 1}.pdf`, { type: "application/pdf" }),
          status: "Pronto",
          downloadUrl: URL.createObjectURL(blob),
          outputName: `${stripExtension(file.name)}-pagina-${index + 1}.pdf`,
          outputSize: blob.size,
        });
      }
      setItems(nextItems);
      setMessage(`${nextItems.length} paginas separadas`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function downloadAll() {
    await zipDownloads(items, "thebox-pdf-dividido.zip");
  }

  return (
    <div className="tool-shell">
      <DropZone accept="application/pdf" onFile={(files) => setFile(files[0])}>
        <strong>Enviar PDF</strong>
        <span>Dividir pagina por pagina</span>
      </DropZone>
      {file && (
        <div className="batch-actions">
          <span className="status-line">{file.name}</span>
          <button onClick={split} type="button">Dividir</button>
          <button disabled={!items.length} onClick={downloadAll} type="button">Baixar todos</button>
        </div>
      )}
      {items.length > 0 && (
        <SimpleFileQueue actionLabel="Baixar" items={items} onAction={() => {}} onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))} />
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
