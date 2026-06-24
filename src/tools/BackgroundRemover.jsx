import React, { useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import { Download, Sparkles, Trash2 } from "lucide-react";
import { getExtension, stripExtension, formatBytes } from "../utils.js";
import DropZone from "../components/DropZone.jsx";

// Assets auto-hospedados em public/imgly (nada vai a servidor remoto).
// Modelo quint8 (42 MB) + runtime CPU, fixados para manter o THEBOX 100% local.
const bgRemovalConfig = {
  publicPath: `${import.meta.env.BASE_URL}imgly/`,
  model: "isnet_quint8",
  device: "cpu",
};

export default function BackgroundRemover() {
  const [items, setItems] = useState([]);
  const [batchDownloadUrl, setBatchDownloadUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  function addFiles(nextFiles) {
    const allowed = nextFiles.filter((file) =>
      ["jpg", "jpeg", "png", "webp"].includes(getExtension(file.name))
    );
    if (allowed.length !== nextFiles.length) {
      setMessage("Alguns arquivos foram ignorados. Use imagens suportadas (JPG, PNG, WebP).");
    }
    setItems((current) => [
      ...current,
      ...allowed.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: "Pronto",
        downloadUrl: "",
        outputName: "",
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeItem(id) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.downloadUrl) URL.revokeObjectURL(target.downloadUrl);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function processOne(item) {
    try {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "Removendo...", downloadUrl: "" } : entry
        )
      );

      const blob = await removeBackground(item.file, bgRemovalConfig);
      const url = URL.createObjectURL(blob);

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "Limpo",
                downloadUrl: url,
                outputName: `${stripExtension(item.file.name)}-transparente.png`,
              }
            : entry
        )
      );
      setMessage(`Fundo removido de ${item.file.name}`);
    } catch (error) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "Erro" } : entry
        )
      );
      setMessage(`Erro ao processar: ${error.message}`);
    }
  }

  async function processAll() {
    setIsProcessingAll(true);
    if (batchDownloadUrl) {
      URL.revokeObjectURL(batchDownloadUrl);
      setBatchDownloadUrl("");
    }

    setMessage("Preparando pacote IA (pode levar alguns segundos na primeira vez)...");

    for (const item of items) {
      if (!item.downloadUrl) {
        await processOne(item);
      }
    }
    
    setIsProcessingAll(false);
  }

  function downloadAll() {
    const converted = items.filter((item) => item.downloadUrl);
    if (!converted.length) return;
    
    converted.forEach((item, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.downloadUrl;
        a.download = item.outputName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 200);
    });

    setMessage(`${converted.length} imagens baixadas.`);
  }

  return (
    <div className="tool-shell">
      <DropZone accept="image/png, image/jpeg, image/webp" onFile={addFiles}>
        <strong>Enviar imagem</strong>
        <span>JPG, PNG, WebP</span>
      </DropZone>

      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => (
            <div className="file-row simple-row" key={item.id}>
              <div className="file-main">
                <div style={{ width: 24, height: 24, overflow: "hidden", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgvwEAAMBJM1oBwNKAyMDIwgE2NhmGjASNoaOAMxowMGw2YIKEBgwEAUhEID5Y6PwwAAAAASUVORK5CYII=') repeat" }}>
                   <img src={item.downloadUrl || item.previewUrl} alt="thumb" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <strong>{item.file.name}</strong>
                  <span>{formatBytes(item.file.size)}</span>
                </div>
              </div>

              <div />

              <span className={`queue-status ${item.status.toLowerCase().replace(" ", "-")}`}>
                {item.status}
              </span>

              {item.downloadUrl ? (
                <a className="icon-button" download={item.outputName} href={item.downloadUrl} title="Baixar">
                  <Download aria-hidden="true" size={18} />
                </a>
              ) : (
                <button
                  className="icon-button"
                  onClick={() => processOne(item)}
                  title="Remover Fundo"
                  type="button"
                  disabled={item.status === "Removendo..." || isProcessingAll}
                >
                  <Sparkles aria-hidden="true" size={18} />
                </button>
              )}
              
              <button
                className="icon-button"
                onClick={() => removeItem(item.id)}
                title="Remover arquivo"
                type="button"
                disabled={item.status === "Removendo..." || isProcessingAll}
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions">
          <button onClick={processAll} disabled={isProcessingAll || items.every((i) => i.downloadUrl)} type="button">
            Remover de Todos
          </button>
          <button
            disabled={!items.some((item) => item.downloadUrl)}
            onClick={downloadAll}
            type="button"
          >
            Baixar todos
          </button>
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
