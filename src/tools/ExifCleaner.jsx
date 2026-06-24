import React, { useState } from "react";
import { loadImageSource, canvasToBlob, getExtension, stripExtension, zipDownloads } from "../utils.js";
import DropZone from "../components/DropZone.jsx";
import SimpleFileQueue from "../components/SimpleFileQueue.jsx";

export default function ExifCleaner() {
  const [items, setItems] = useState([]);
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
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeItem(id) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.downloadUrl) URL.revokeObjectURL(target.downloadUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function cleanOne(item) {
    try {
      updateItem(item.id, { status: "Limpando", downloadUrl: "" });
      const source = await loadImageSource(item.file);
      const bitmap = source.bitmap;
      const width = bitmap.naturalWidth || bitmap.width;
      const height = bitmap.naturalHeight || bitmap.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0);
      const extension = getExtension(item.file.name);
      const mime = extension === "png" ? "image/png" : "image/jpeg";
      const outputExtension = extension === "png" ? "png" : "jpg";
      const blob = await canvasToBlob(canvas, mime, 0.95);
      const url = URL.createObjectURL(blob);
      updateItem(item.id, {
        status: "Limpo",
        downloadUrl: url,
        outputName: `${stripExtension(item.file.name)}-sem-metadados.${outputExtension}`,
        outputSize: blob.size,
      });
      setMessage(`${item.file.name}: metadados removidos`);
    } catch (error) {
      updateItem(item.id, { status: "Erro" });
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function cleanAll() {
    for (const item of items) {
      await cleanOne(item);
    }
  }

  async function downloadAll() {
    await zipDownloads(items.filter((item) => item.downloadUrl), "thebox-sem-metadados.zip");
  }

  return (
    <div className="tool-shell">
      <DropZone accept="image/jpeg,image/png,image/webp" onFile={addFiles}>
        <strong>Enviar imagens</strong>
        <span>JPG, PNG, WebP</span>
      </DropZone>
      {items.length > 0 && (
        <SimpleFileQueue
          actionLabel="Limpar"
          items={items}
          onAction={cleanOne}
          onRemove={removeItem}
          statusClass={(status) => status.toLowerCase()}
        />
      )}
      {items.length > 0 && (
        <div className="batch-actions">
          <button onClick={cleanAll} type="button">Limpar</button>
          <button disabled={!items.some((item) => item.downloadUrl)} onClick={downloadAll} type="button">
            Baixar todos
          </button>
        </div>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
