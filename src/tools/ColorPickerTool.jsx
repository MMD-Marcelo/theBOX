import React, { useState, useRef, useEffect } from "react";
import { Palette, Trash2 } from "lucide-react";
import {
  drawMagnifier,
  drawPickerImage,
  formatBytes,
  getReadableTextColor,
  readCanvasPoint,
  rgbToHex,
} from "../utils.js";
import DropZone from "../components/DropZone.jsx";

export default function ColorPickerTool() {
  const [item, setItem] = useState(null);
  const [baseColor, setBaseColor] = useState("#ff5a00");
  const [activeImage, setActiveImage] = useState(null);
  const [pickedColor, setPickedColor] = useState("");
  const [hoverColor, setHoverColor] = useState("");
  const [magnifier, setMagnifier] = useState(null);
  const [message, setMessage] = useState("");
  const canvasRef = useRef(null);
  const magnifierRef = useRef(null);

  useEffect(() => {
    if (activeImage) drawPickerImage(activeImage.file, canvasRef.current);
  }, [activeImage]);

  function addFiles(files) {
    const file = files[0];
    if (!file) return;
    const nextItem = {
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      status: "Pronto",
    };
    setItem(nextItem);
    setActiveImage(nextItem);
    setPickedColor("");
    setHoverColor("");
    setMagnifier(null);
    setMessage(`${file.name}: imagem ativa`);
  }

  function removeItem() {
    setItem(null);
    setActiveImage(null);
    setPickedColor("");
    setHoverColor("");
    setMagnifier(null);
    setMessage("");
  }

  function pickFromCanvas(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y, color: pixel } = readCanvasPoint(canvas, event);
    const [red, green, blue] = pixel;
    const hex = rgbToHex(red, green, blue);
    setPickedColor(hex);
    setBaseColor(hex);
    navigator.clipboard?.writeText(hex);
    setMessage(`${hex} copiado em ${x},${y}`);
  }

  function hoverCanvas(event) {
    const canvas = canvasRef.current;
    const magnifierCanvas = magnifierRef.current;
    if (!canvas || !magnifierCanvas) return;
    const point = readCanvasPoint(canvas, event);
    const [red, green, blue] = point.color;
    setHoverColor(rgbToHex(red, green, blue));
    setMagnifier({ x: point.x, y: point.y });
    drawMagnifier(canvas, magnifierCanvas, point.x, point.y);
  }

  return (
    <div className="tool-shell">
      <DropZone accept="image/jpeg,image/png,image/webp,image/avif" multiple={false} onFile={addFiles}>
        <strong>Enviar imagem</strong>
        <span>Color picker com lupa e Ctrl+V</span>
      </DropZone>
      {item && (
        <div className="file-queue">
          <div className="palette-row" key={item.id}>
            <div className="file-main">
              <Palette aria-hidden="true" size={20} />
              <div>
                <button className="file-name-button" onClick={() => setActiveImage(item)} type="button">
                  {item.file.name}
                </button>
                <span>{formatBytes(item.file.size)}</span>
              </div>
            </div>
            <button className="icon-button" onClick={removeItem} type="button">
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
      )}
      {activeImage && (
        <div className="picker-panel">
          <div className="picker-image-wrap">
            <canvas
              className="picker-canvas"
              onClick={pickFromCanvas}
              onMouseLeave={() => setMagnifier(null)}
              onMouseMove={hoverCanvas}
              ref={canvasRef}
              title="Clique para copiar a cor"
            />
          </div>
          <div className="picker-side">
            <div className="magnifier-box">
              <canvas ref={magnifierRef} width="108" height="108" />
              <span>{magnifier ? `${magnifier.x},${magnifier.y}` : "Passe o mouse"}</span>
            </div>
            <div className="picked-color">
              <span>Hover</span>
              <button
                onClick={() => hoverColor && navigator.clipboard?.writeText(hoverColor)}
                style={{
                  background: hoverColor || "#0a0a0a",
                  color: getReadableTextColor(hoverColor || "#0a0a0a"),
                }}
                type="button"
              >
                {hoverColor || "-"}
              </button>
            </div>
            <div className="picked-color">
              <span>Cor selecionada</span>
              <button
                onClick={() => pickedColor && navigator.clipboard?.writeText(pickedColor)}
                style={{
                  background: pickedColor || baseColor,
                  color: getReadableTextColor(pickedColor || baseColor),
                }}
                type="button"
              >
                {pickedColor || baseColor}
              </button>
            </div>
            <div className="batch-actions">
              <label>
                <input
                  className="hex-input"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(value)) setBaseColor(value);
                  }}
                  value={baseColor}
                />
              </label>
            </div>
          </div>
        </div>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
