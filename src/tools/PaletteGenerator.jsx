import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import DropZone from "../components/DropZone.jsx";
import {
  extractPalette,
  generatePalette,
  getContrastRatio,
  getReadableTextColor,
  normalizePalette,
  starterPalettes,
} from "../utils.js";

export default function PaletteGenerator() {
  const [palette, setPalette] = useState(starterPalettes[0]);
  const [savedPalettes, setSavedPalettes] = useState([
    { id: crypto.randomUUID(), name: "1", colors: starterPalettes[0] },
  ]);
  const [mode, setMode] = useState("analogous");
  const [contrastPair, setContrastPair] = useState([0, 2]);
  const contrast = getContrastRatio(palette[contrastPair[0]], palette[contrastPair[1]]);

  function updateColor(index, value) {
    setPalette((current) =>
      current.map((color, colorIndex) => (colorIndex === index ? value : color))
    );
  }

  function generate() {
    const seed = Math.floor(Math.random() * 360);
    setPalette(generatePalette(seed, mode));
  }

  async function fromImage(files) {
    const colors = await extractPalette(files[0]);
    if (colors.length) setPalette(normalizePalette(colors));
  }

  function savePalette() {
    setSavedPalettes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: String(current.length + 1),
        colors: palette,
      },
    ]);
  }

  function renamePalette(id, name) {
    setSavedPalettes((current) =>
      current.map((saved) => (saved.id === id ? { ...saved, name } : saved))
    );
  }

  function removeSavedPalette(id) {
    setSavedPalettes((current) => current.filter((saved) => saved.id !== id));
  }

  return (
    <div className="tool-shell palette-tool">
      <div className="palette-board">
        {palette.map((color, index) => (
          <div
            className="palette-strip"
            key={`${color}-${index}`}
            style={{ background: color, color: getReadableTextColor(color) }}
          >
            <button
              onClick={() => navigator.clipboard?.writeText(color)}
              style={{ color: getReadableTextColor(color) }}
              type="button"
            >
              {color.replace("#", "").toUpperCase()}
            </button>
            <input
              onChange={(event) => {
                const value = event.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(value)) updateColor(index, value);
              }}
              value={color}
            />
          </div>
        ))}
      </div>

      <div className="palette-controls">
        <label>
          Harmonia
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="analogous">Analogas</option>
            <option value="complementary">Complementar</option>
            <option value="triadic">Triade</option>
            <option value="mono">Monocromatica</option>
          </select>
        </label>
        <button onClick={generate} type="button">Gerar</button>
        <button onClick={savePalette} type="button">Salvar paleta</button>
      </div>

      <div className="palette-section image-palette-section">
        <DropZone accept="image/jpeg,image/png,image/webp,image/avif" onFile={fromImage}>
          <strong>Extrair de imagem</strong>
          <span>Usa as cores dominantes como paleta</span>
        </DropZone>
      </div>

      <div className="palette-section saved-palette-section">
        <h3>Paletas salvas</h3>
        <div className="saved-palettes">
          {savedPalettes.map((saved) => (
            <div className="saved-palette-row" key={saved.id}>
              <input
                aria-label="Nome da paleta"
                onChange={(event) => renamePalette(saved.id, event.target.value)}
                value={saved.name}
              />
              <button
                className="preset-palette"
                onClick={() => setPalette(saved.colors)}
                type="button"
              >
                {saved.colors.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </button>
              <button
                className="icon-button"
                onClick={() => removeSavedPalette(saved.id)}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="palette-section contrast-panel">
        <h3>Contraste</h3>
        <label>
          Texto
          <select
            value={contrastPair[0]}
            onChange={(event) => setContrastPair([Number(event.target.value), contrastPair[1]])}
          >
            {palette.map((color, index) => (
              <option key={color} value={index}>{color}</option>
            ))}
          </select>
        </label>
        <label>
          Fundo
          <select
            value={contrastPair[1]}
            onChange={(event) => setContrastPair([contrastPair[0], Number(event.target.value)])}
          >
            {palette.map((color, index) => (
              <option key={color} value={index}>{color}</option>
            ))}
          </select>
        </label>
        <div
          className="contrast-sample"
          style={{
            background: palette[contrastPair[1]],
            color: palette[contrastPair[0]],
          }}
        >
          <strong>{contrast.toFixed(2)}:1</strong>
          <span>{contrast >= 4.5 ? "AA normal" : contrast >= 3 ? "AA grande" : "baixo"}</span>
        </div>
      </div>
    </div>
  );
}
