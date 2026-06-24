import React, { useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Download, Image, Play, Trash2 } from "lucide-react";
import {
  exportImage,
  formatBytes,
  getExtension,
  imageFormats,
  imagesToAnimatedGif,
  imagesToMergedPdf,
  loadImageSource,
  stripExtension,
  triggerDownload,
} from "../utils.js";
import DropZone from "../components/DropZone.jsx";

export default function ImageConverter() {
  const [items, setItems] = useState([]);
  const [batchFormat, setBatchFormat] = useState("jpg");
  const [mergePdf, setMergePdf] = useState(true);
  const [gifFrameMs, setGifFrameMs] = useState(400);
  const [gifLoop, setGifLoop] = useState(true);
  const [icoSize, setIcoSize] = useState(256);
  const [gifPreviewUrl, setGifPreviewUrl] = useState("");
  const [batchDownloadUrl, setBatchDownloadUrl] = useState("");
  const [message, setMessage] = useState("");

  function addFiles(nextFiles) {
    const allowed = nextFiles.filter((file) =>
      ["jpg", "jpeg", "png", "webp", "avif", "gif", "bmp", "heic", "heif", "ico"].includes(getExtension(file.name))
    );
    if (allowed.length !== nextFiles.length) {
      setMessage("Alguns arquivos foram ignorados. Use formatos de imagem suportados.");
    }
    setItems((current) => [
      ...current,
      ...allowed.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        format: batchFormat,
        status: "Pronto",
        downloadUrl: "",
        outputName: "",
        frames: 1,
      })),
    ]);
  }

  function updateItem(id, patch) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateItemFormat(id, nextFormat) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
        return {
          ...item,
          format: nextFormat,
          status: "Pronto",
          downloadUrl: "",
          outputName: "",
        };
      })
    );
  }

  function moveItem(id, direction) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function removeItem(id) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.downloadUrl) URL.revokeObjectURL(target.downloadUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function setAllFormats(nextFormat) {
    setBatchFormat(nextFormat);
    if (batchDownloadUrl) {
      URL.revokeObjectURL(batchDownloadUrl);
      setBatchDownloadUrl("");
    }
    setItems((current) =>
      current.map((item) => {
        if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
        return {
          ...item,
          format: nextFormat,
          status: "Pronto",
          downloadUrl: "",
          outputName: "",
        };
      })
    );
  }

  async function convertOne(item) {
    try {
      updateItem(item.id, { status: "Convertendo", downloadUrl: "" });
      const target = imageFormats.find((formatItem) => formatItem.id === item.format);
      const source = await loadImageSource(item.file);
      const bitmap = source.bitmap;
      const width = bitmap.naturalWidth || bitmap.width;
      const height = bitmap.naturalHeight || bitmap.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);

      const blob = await exportImage(canvas, target, 0.92, { icoSize });
      if (item.downloadUrl) URL.revokeObjectURL(item.downloadUrl);
      const url = URL.createObjectURL(blob);
      updateItem(item.id, {
        downloadUrl: url,
        outputName: `${stripExtension(item.file.name)}.${target.extension}`,
        status: "Convertido",
      });
      setMessage(`${source.label} -> ${target.label}`);
    } catch (error) {
      updateItem(item.id, { status: "Erro" });
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function convertAll() {
    if (batchDownloadUrl) {
      URL.revokeObjectURL(batchDownloadUrl);
      setBatchDownloadUrl("");
    }

    if (batchFormat === "pdf" && mergePdf) {
      await convertMergedPdf();
      return;
    }

    if (batchFormat === "gif" && items.length > 1) {
      await convertAnimatedGif(false);
      return;
    }

    for (const item of items) {
      await convertOne(item);
    }
  }

  async function convertAnimatedGif(previewOnly) {
    try {
      setMessage(previewOnly ? "Gerando preview..." : "Gerando GIF...");
      const frameFiles = items.flatMap((item) =>
        Array.from({ length: item.frames }, () => item.file)
      );
      const gifBlob = await imagesToAnimatedGif(frameFiles, {
        delay: gifFrameMs,
        repeat: gifLoop ? 0 : -1,
      });
      const url = URL.createObjectURL(gifBlob);

      if (previewOnly) {
        if (gifPreviewUrl) URL.revokeObjectURL(gifPreviewUrl);
        setGifPreviewUrl(url);
        setMessage("Preview GIF pronto");
        return;
      }

      if (batchDownloadUrl) URL.revokeObjectURL(batchDownloadUrl);
      setBatchDownloadUrl(url);
      setItems((current) =>
        current.map((item) => ({ ...item, status: "Convertido", format: "gif" }))
      );
      setMessage(`${items.length} imagens -> GIF animado`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function convertMergedPdf() {
    try {
      setMessage("Juntando PDFs...");
      const pdfBlob = await imagesToMergedPdf(items.map((item) => item.file));
      const url = URL.createObjectURL(pdfBlob);
      setBatchDownloadUrl(url);
      setItems((current) =>
        current.map((item) => ({ ...item, status: "Convertido", format: "pdf" }))
      );
      setMessage(`${items.length} imagens -> PDF unico`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  async function downloadAll() {
    if (batchDownloadUrl) {
      const fileName = batchFormat === "pdf" && mergePdf
        ? "thebox-imagens.pdf"
        : batchFormat === "gif" && items.length > 1
          ? "thebox-animado.gif"
          : "thebox-imagens.zip";
      triggerDownload(batchDownloadUrl, fileName);
      return;
    }

    const converted = items.filter((item) => item.downloadUrl);
    if (!converted.length) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (const item of converted) {
      const blob = await fetch(item.downloadUrl).then((response) => response.blob());
      zip.file(item.outputName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    if (batchDownloadUrl) URL.revokeObjectURL(batchDownloadUrl);
    const url = URL.createObjectURL(zipBlob);
    setBatchDownloadUrl(url);
    triggerDownload(url, "thebox-imagens.zip");
    setMessage(`${converted.length} arquivos prontos para baixar`);
  }

  return (
    <div className="tool-shell">
      <DropZone
        accept="image/*,.heic,.heif"
        onFile={addFiles}
      >
        <strong>Enviar imagem</strong>
        <span>JPG, PNG, WebP, AVIF, GIF, BMP, HEIC, ICO</span>
      </DropZone>

      {items.length > 0 && (
        <div className="file-queue">
          {items.map((item) => (
            <div className={`file-row ${batchFormat === "gif" ? "gif-mode" : ""}`} key={item.id}>
              <div className="file-main">
                <Image aria-hidden="true" size={20} />
                <div>
                  <strong>{item.file.name}</strong>
                  <span>
                    {getExtension(item.file.name).toUpperCase() || "IMG"} / {formatBytes(item.file.size)}
                  </span>
                </div>
              </div>
              <span className="to-label">para</span>
              <select
                value={item.format}
                onChange={(event) => updateItemFormat(item.id, event.target.value)}
              >
                {imageFormats.map((formatItem) => (
                  <option key={formatItem.id} value={formatItem.id}>
                    {formatItem.label}
                  </option>
                ))}
              </select>
              {batchFormat === "gif" && (
                <div className="gif-row-tools">
                  <button className="icon-button" onClick={() => moveItem(item.id, -1)} type="button">
                    <ArrowUp aria-hidden="true" size={16} />
                  </button>
                  <button className="icon-button" onClick={() => moveItem(item.id, 1)} type="button">
                    <ArrowDown aria-hidden="true" size={16} />
                  </button>
                  <label>
                    Frames
                    <input
                      min="1"
                      onChange={(event) =>
                        updateItem(item.id, { frames: Number(event.target.value) })
                      }
                      type="number"
                      value={item.frames}
                    />
                  </label>
                </div>
              )}
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
                  onClick={() => convertOne(item)}
                  title="Converter este arquivo"
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
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="batch-actions">
          <label>
            Converter todos para
            <select
              value={batchFormat}
              onChange={(event) => setAllFormats(event.target.value)}
            >
              {imageFormats.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {batchFormat === "pdf" && (
            <label>
              PDFs
              <select
                value={mergePdf ? "merged" : "separate"}
                onChange={(event) => setMergePdf(event.target.value === "merged")}
              >
                <option value="merged">Juntar em um PDF</option>
                <option value="separate">Arquivos separados</option>
              </select>
            </label>
          )}
          {batchFormat === "gif" && (
            <>
              <label>
                Frame ms
                <input
                  min="40"
                  onChange={(event) => setGifFrameMs(Number(event.target.value))}
                  type="number"
                  value={gifFrameMs}
                />
              </label>
              <label>
                Loop
                <select
                  value={gifLoop ? "loop" : "once"}
                  onChange={(event) => setGifLoop(event.target.value === "loop")}
                >
                  <option value="loop">Sim</option>
                  <option value="once">Nao</option>
                </select>
              </label>
              <button disabled={items.length < 2} onClick={() => convertAnimatedGif(true)} type="button">
                <Play aria-hidden="true" size={18} />
                Preview
              </button>
            </>
          )}
          {batchFormat === "ico" && (
            <label>
              Tamanho
              <select
                value={icoSize}
                onChange={(event) => setIcoSize(Number(event.target.value))}
              >
                {[16, 32, 48, 64, 128, 256].map((size) => (
                  <option key={size} value={size}>
                    {size}x{size}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button onClick={convertAll} type="button">
            Converter
          </button>
          <button
            disabled={!batchDownloadUrl && !items.some((item) => item.downloadUrl)}
            onClick={downloadAll}
            type="button"
          >
            Baixar todos
          </button>
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
      {gifPreviewUrl && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="preview-modal">
            <div className="modal-top">
              <strong>Preview GIF</strong>
              <button onClick={() => setGifPreviewUrl("")} type="button">Fechar</button>
            </div>
            <img alt="Preview do GIF animado" src={gifPreviewUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
