import React, { useState } from "react";
import { ChevronRight, Download, Images, Trash2 } from "lucide-react";
import { compressImage, getExtension, stripExtension, formatBytes, triggerDownload } from "../utils.js";
import DropZone from "../components/DropZone.jsx";

export default function ImageCompressor() {
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(78);
  const [pngColors, setPngColors] = useState(256);
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");
  const [batchDownloadUrl, setBatchDownloadUrl] = useState("");
  const [message, setMessage] = useState("");

  function addFiles(nextFiles) {
    const allowed = nextFiles.filter((file) =>
      ["jpg", "jpeg", "png", "webp", "avif"].includes(getExtension(file.name))
    );
    if (allowed.length !== nextFiles.length) {
      setMessage("Alguns arquivos foram ignorados. Use JPG, PNG, WebP ou AVIF.");
    }
    setItems((current) => [
      ...current,
      ...allowed.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: "Pronto",
        downloadUrl: "",
        outputName: "",
        outputSize: 0,
      })),
    ]);
  }

  function updateCompressionSettings(patch) {
    if (batchDownloadUrl) {
      URL.revokeObjectURL(batchDownloadUrl);
      setBatchDownloadUrl("");
    }
    Object.entries(patch).forEach(([key, value]) => {
      if (key === "quality") setQuality(value);
      if (key === "pngColors") setPngColors(value);
      if (key === "maxWidth") setMaxWidth(value);
      if (key === "maxHeight") setMaxHeight(value);
    });
    setItems((current) =>
      current.map((item) => {
        if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
        return {
          ...item,
          status: "Pronto",
          downloadUrl: "",
          outputName: "",
          outputSize: 0,
        };
      })
    );
  }

  function removeItem(id) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.downloadUrl) URL.revokeObjectURL(target.downloadUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function compressOne(item) {
    try {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "Comprimindo", downloadUrl: "" } : entry
        )
      );
      const result = await compressImage(item.file, {
        quality: quality / 100,
        pngColors,
        maxWidth: Number(maxWidth) || null,
        maxHeight: Number(maxHeight) || null,
      });
      const url = URL.createObjectURL(result.blob);
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "Comprimido",
                downloadUrl: url,
                outputName: `${stripExtension(item.file.name)}-comprimido.${result.extension}`,
                outputSize: result.blob.size,
              }
            : entry
        )
      );
      setMessage(`${item.file.name}: ${formatBytes(item.file.size)} -> ${formatBytes(result.blob.size)}`);
    } catch (error) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "Erro" } : entry
        )
      );
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function compressAll() {
    if (batchDownloadUrl) {
      URL.revokeObjectURL(batchDownloadUrl);
      setBatchDownloadUrl("");
    }
    for (const item of items) {
      await compressOne(item);
    }
  }

  async function downloadAll() {
    const compressed = items.filter((item) => item.downloadUrl);
    if (!compressed.length) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const item of compressed) {
      const blob = await fetch(item.downloadUrl).then((response) => response.blob());
      zip.file(item.outputName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    if (batchDownloadUrl) URL.revokeObjectURL(batchDownloadUrl);
    const url = URL.createObjectURL(zipBlob);
    setBatchDownloadUrl(url);
    triggerDownload(url, "thebox-imagens-comprimidas.zip");
    setMessage(`${compressed.length} imagens prontas para baixar`);
  }

  return (
    <div className="tool-shell">
      <DropZone accept="image/jpeg,image/png,image/webp,image/avif" onFile={addFiles}>
        <strong>Enviar imagens</strong>
        <span>JPG, PNG, WebP, AVIF</span>
      </DropZone>

      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => {
            const savings = item.outputSize
              ? Math.max(0, 100 - (item.outputSize / item.file.size) * 100)
              : 0;
            return (
              <div className="file-row compressor-row" key={item.id}>
                <div className="file-main">
                  <Images aria-hidden="true" size={20} />
                  <div>
                    <strong>{item.file.name}</strong>
                    <span>
                      {getExtension(item.file.name).toUpperCase() || "IMG"} / {formatBytes(item.file.size)}
                    </span>
                  </div>
                </div>
                <span className="compression-size">
                  {item.outputSize ? formatBytes(item.outputSize) : "-"}
                </span>
                <span className="compression-size">
                  {item.outputSize ? `${savings.toFixed(1)}%` : "-"}
                </span>
                <span className={`queue-status ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
                {item.downloadUrl ? (
                  <a className="icon-button" download={item.outputName} href={item.downloadUrl}>
                    <Download aria-hidden="true" size={18} />
                  </a>
                ) : (
                  <button
                    className="icon-button"
                    onClick={() => compressOne(item)}
                    title="Comprimir este arquivo"
                    type="button"
                  >
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                )}
                <button
                  className="icon-button"
                  onClick={() => removeItem(item.id)}
                  title="Remover arquivo"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions">
          <label>
            Qualidade
            <input
              max="100"
              min="20"
              onChange={(event) =>
                updateCompressionSettings({ quality: Number(event.target.value) })
              }
              type="number"
              value={quality}
            />
          </label>
          <label>
            Cores PNG
            <select
              value={pngColors}
              onChange={(event) =>
                updateCompressionSettings({ pngColors: Number(event.target.value) })
              }
            >
              {[256, 128, 64, 32, 16].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <label>
            Largura max
            <input
              min="1"
              onChange={(event) =>
                updateCompressionSettings({ maxWidth: event.target.value })
              }
              placeholder="auto"
              type="number"
              value={maxWidth}
            />
          </label>
          <label>
            Altura max
            <input
              min="1"
              onChange={(event) =>
                updateCompressionSettings({ maxHeight: event.target.value })
              }
              placeholder="auto"
              type="number"
              value={maxHeight}
            />
          </label>
          <button onClick={compressAll} type="button">
            Comprimir
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
