import React, { useState } from "react";
import { RefreshCw, Copy, Dice5 } from "lucide-react";
import { randomNumbers, draw } from "../lib/randomGen.js";
import { parseOptions } from "../lib/wheel.js";
import NumberField from "../components/NumberField.jsx";

export default function RandomNumberTool() {
  const [mode, setMode] = useState("numeros");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(6);
  const [items, setItems] = useState("");
  const [drawCount, setDrawCount] = useState(1);
  const [output, setOutput] = useState("");

  function gerarNumeros() {
    setOutput(randomNumbers(count, min, max).join("\n"));
  }

  function sortear() {
    const list = parseOptions(items);
    setOutput(draw(list, drawCount).join("\n") || "(sem itens)");
  }

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  return (
    <div className="tool-shell">
      <div className="segments inline">
        <button className={mode === "numeros" ? "active" : ""} type="button" onClick={() => setMode("numeros")}>Números</button>
        <button className={mode === "sorteio" ? "active" : ""} type="button" onClick={() => setMode("sorteio")}>Sorteio</button>
      </div>

      {mode === "numeros" ? (
        <div className="controls">
          <label>Mínimo<NumberField value={min} onChange={setMin} /></label>
          <label>Máximo<NumberField value={max} onChange={setMax} /></label>
          <label>Quantidade<NumberField min="1" max="1000" value={count} onChange={setCount} /></label>
          <button type="button" onClick={gerarNumeros}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
          <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
        </div>
      ) : (
        <>
          <textarea
            className="big-input"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            placeholder="Um item por linha"
            spellCheck="false"
          />
          <div className="controls">
            <label>Quantos sortear<NumberField min="1" value={drawCount} onChange={setDrawCount} /></label>
            <button type="button" onClick={sortear}><Dice5 aria-hidden="true" size={16} /> Sortear</button>
            <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
          </div>
        </>
      )}

      {output && <textarea className="big-input" readOnly value={output} />}
    </div>
  );
}
