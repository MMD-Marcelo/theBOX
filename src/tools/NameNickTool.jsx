import React, { useState } from "react";
import { RefreshCw, Copy } from "lucide-react";
import { randomName, randomNick } from "../lib/fakerBr.js";

export default function NameNickTool() {
  const [tipo, setTipo] = useState("nome");
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState("");

  function generate() {
    const fn = tipo === "nick" ? randomNick : randomName;
    setOutput(Array.from({ length: Math.max(1, count) }, fn).join("\n"));
  }

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  return (
    <div className="tool-shell">
      <div className="controls">
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="nome">Nomes</option>
            <option value="nick">Nicks</option>
          </select>
        </label>
        <label>
          Quantidade
          <input type="number" min="1" max="500" value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </label>
        <button type="button" onClick={generate}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
        <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
      </div>
      {output && <textarea className="big-input" readOnly value={output} />}
    </div>
  );
}
