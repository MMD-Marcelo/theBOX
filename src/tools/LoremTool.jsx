import React, { useState } from "react";
import { RefreshCw, Copy } from "lucide-react";
import { words, sentences, paragraphs } from "../lib/lorem.js";
import NumberField from "../components/NumberField.jsx";

export default function LoremTool() {
  const [mode, setMode] = useState("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState("");

  function generate() {
    const fn = mode === "words" ? words : mode === "sentences" ? sentences : paragraphs;
    setOutput(fn(count));
  }

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  return (
    <div className="tool-shell">
      <div className="controls">
        <label>
          Tipo
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="paragraphs">Parágrafos</option>
            <option value="sentences">Frases</option>
            <option value="words">Palavras</option>
          </select>
        </label>
        <label>
          Quantidade
          <NumberField min="1" max="100" value={count} onChange={setCount} />
        </label>
        <button type="button" onClick={generate}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
        <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
      </div>
      {output && <textarea className="big-input" readOnly value={output} />}
    </div>
  );
}
