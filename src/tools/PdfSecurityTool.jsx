import React, { useState } from "react";
import createQpdfModule from "@neslinesli93/qpdf-wasm";
import qpdfWasmUrl from "@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url";
import { Download, FileText, Trash2 } from "lucide-react";
import DropZone from "../components/DropZone.jsx";
import { formatBytes, getExtension, stripExtension, triggerDownload, zipDownloads } from "../utils.js";

const securityModes = [
  { id: "protect", label: "Proteger" },
  { id: "unlock", label: "Desbloquear" },
];

let qpdfPromise;

export default function PdfSecurityTool() {
  const [mode, setMode] = useState("protect");
  const [items, setItems] = useState([]);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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

  async function runSecurity() {
    if (!password.trim()) {
      setMessage("Informe uma senha.");
      return;
    }
    try {
      const nextItems = [];
      for (const item of items) {
        const blob = mode === "protect"
          ? await protectPdf(item.file, password)
          : await unlockPdf(item.file, password);
        nextItems.push({
          ...item,
          status: mode === "protect" ? "Protegido" : "Livre",
          downloadUrl: URL.createObjectURL(blob),
          outputName: `${stripExtension(item.file.name)}-${mode === "protect" ? "protegido" : "desbloqueado"}.pdf`,
          outputSize: blob.size,
        });
      }
      setItems(nextItems);
      setMessage(`${nextItems.length} PDF(s) processados com qpdf`);
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
    await zipDownloads(outputItems, "thebox-pdfs-seguranca.zip");
  }

  return (
    <div className="tool-shell">
      <div className="pdf-mode-grid two-items">
        {securityModes.map((item) => (
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
        <span>Criptografar ou remover senha conhecida com qpdf.wasm</span>
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
        <div className="security-actions">
          <label className="security-password-field">
            <span>Senha</span>
            <input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
          </label>
          <button className="security-action-button" onClick={runSecurity} type="button">
            {mode === "protect" ? "Proteger" : "Desbloquear"}
          </button>
          <button className="security-action-button" disabled={!outputItems.length} onClick={downloadAll} type="button">Baixar todos</button>
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

async function getQpdf() {
  qpdfPromise ??= createQpdfModule({
    locateFile: () => qpdfWasmUrl,
    noInitialRun: true,
  });
  return qpdfPromise;
}

async function runQpdf(file, args) {
  const qpdf = await getQpdf();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const inputPath = `/input-${suffix}.pdf`;
  const outputPath = `/output-${suffix}.pdf`;
  qpdf.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
  try {
    qpdf.callMain(args(inputPath, outputPath));
    const output = qpdf.FS.readFile(outputPath);
    return new Blob([output], { type: "application/pdf" });
  } finally {
    try { qpdf.FS.unlink(inputPath); } catch {}
    try { qpdf.FS.unlink(outputPath); } catch {}
  }
}

async function protectPdf(file, password) {
  return runQpdf(file, (input, output) => [
    input,
    "--encrypt",
    password,
    password,
    "256",
    "--",
    output,
  ]);
}

async function unlockPdf(file, password) {
  return runQpdf(file, (input, output) => [
    `--password=${password}`,
    "--decrypt",
    input,
    output,
  ]);
}
