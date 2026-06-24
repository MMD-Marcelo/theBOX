import React, { useState } from "react";
import { RefreshCw, Copy } from "lucide-react";
import { uuidV4, sha, SHA_ALGOS } from "../lib/uuidHash.js";

export default function UuidHashTool() {
  const [mode, setMode] = useState("uuid");
  const [count, setCount] = useState(5);
  const [algo, setAlgo] = useState("SHA-256");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  function gerarUuid() {
    setOutput(Array.from({ length: Math.max(1, count) }, uuidV4).join("\n"));
  }

  async function gerarHash() {
    setOutput(await sha(input, algo));
  }

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  return (
    <div className="tool-shell">
      <div className="segments inline">
        <button className={mode === "uuid" ? "active" : ""} type="button" onClick={() => setMode("uuid")}>UUID</button>
        <button className={mode === "hash" ? "active" : ""} type="button" onClick={() => setMode("hash")}>Hash</button>
      </div>

      {mode === "uuid" ? (
        <div className="controls">
          <label>Quantidade<input type="number" min="1" max="500" value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          <button type="button" onClick={gerarUuid}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
          <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
        </div>
      ) : (
        <>
          <textarea
            className="big-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Texto para gerar o hash"
            spellCheck="false"
          />
          <div className="controls">
            <label>
              Algoritmo
              <select value={algo} onChange={(e) => setAlgo(e.target.value)}>
                {SHA_ALGOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <button type="button" onClick={gerarHash}><RefreshCw aria-hidden="true" size={16} /> Gerar hash</button>
            <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
          </div>
        </>
      )}

      {output && <textarea className="big-input" readOnly value={output} />}
    </div>
  );
}
