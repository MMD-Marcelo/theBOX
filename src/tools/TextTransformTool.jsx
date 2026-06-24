import React, { useState } from "react";
import { Copy, RotateCcw, Trash2, Wand2 } from "lucide-react";
import {
  toUpper,
  toLower,
  capitalizeWords,
  sentenceCase,
  reverseText,
  stripAccents,
  removeDoubleSpaces,
  removeEmptyLines,
  removeDuplicateLines,
  sortLines,
  toSlug,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  findReplace,
  countChars,
  countWords,
  countLines,
  removeLineBreaks,
  wordFrequency,
  numberToWordsPtBr,
} from "../lib/textTransform.js";
import { STYLES } from "../lib/fancyText.js";

const operations = [
  { label: "MAIÚSCULAS", fn: toUpper },
  { label: "minúsculas", fn: toLower },
  { label: "Capitalizar", fn: capitalizeWords },
  { label: "Tipo frase", fn: sentenceCase },
  { label: "Inverter", fn: reverseText },
  { label: "Sem acentos", fn: stripAccents },
  { label: "Espaços duplos", fn: removeDoubleSpaces },
  { label: "Linhas vazias", fn: removeEmptyLines },
  { label: "Linhas repetidas", fn: removeDuplicateLines },
  { label: "Sem quebras", fn: removeLineBreaks },
  { label: "Ordenar linhas", fn: sortLines },
  { label: "Frequência", fn: (t) => wordFrequency(t).map(({ word, count }) => `${word}: ${count}`).join("\n") },
  { label: "Por extenso", fn: (t) => numberToWordsPtBr(Number(t.trim()) || 0) },
  { label: "slug", fn: toSlug },
  { label: "camelCase", fn: toCamelCase },
  { label: "PascalCase", fn: toPascalCase },
  { label: "snake_case", fn: toSnakeCase },
  { label: "kebab-case", fn: toKebabCase },
];

export default function TextTransformTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [regex, setRegex] = useState(false);
  const [message, setMessage] = useState("");
  const [flash, setFlash] = useState("");
  const [mode, setMode] = useState("transform");

  function runOperation(fn, label) {
    setMessage("");
    setFlash(label);
    setTimeout(() => setFlash(""), 250);
    try {
      setResult(fn(input));
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  function runFindReplace() {
    setMessage("");
    try {
      setResult(findReplace(input, { find, replace, regex }));
    } catch (error) {
      setMessage(`Regex inválida: ${error.message}`);
    }
  }

  function applyResult() {
    if (!result) return;
    setHistory((current) => [...current, input]);
    setInput(result);
    setResult("");
  }

  function undo() {
    setHistory((current) => {
      if (current.length === 0) return current;
      const previous = current[current.length - 1];
      setInput(previous);
      return current.slice(0, -1);
    });
  }

  function clearAll() {
    setHistory((current) => (input ? [...current, input] : current));
    setInput("");
    setResult("");
    setMessage("");
  }

  function copyResult() {
    const value = result || input;
    if (value) navigator.clipboard?.writeText(value);
  }

  return (
    <div className="tool-shell text-transform-tool">
      <div className="segments inline">
        <button className={mode === "transform" ? "active" : ""} type="button" onClick={() => setMode("transform")}>
          Transformar
        </button>
        <button className={mode === "estiloso" ? "active" : ""} type="button" onClick={() => setMode("estiloso")}>
          Texto estiloso
        </button>
      </div>

      {mode === "estiloso" && (
        <>
          <textarea
            className="big-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Digite seu texto"
            spellCheck="false"
          />
          {input && (
            <div className="fancy-list">
              {STYLES.map((style) => {
                const out = style.fn(input);
                return (
                  <div className="fancy-row" key={style.id}>
                    <span className="fancy-label">{style.label}</span>
                    <span className="fancy-out">{out}</span>
                    <button type="button" className="copy-btn" onClick={() => navigator.clipboard?.writeText(out)} title="Copiar">
                      <Copy aria-hidden="true" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {mode === "transform" && (
      <>
      <div className="segments inline wrap">
        {operations.map((operation) => (
          <button
            key={operation.label}
            type="button"
            className={flash === operation.label ? "flash" : ""}
            onClick={() => runOperation(operation.fn, operation.label)}
          >
            {operation.label}
          </button>
        ))}
      </div>

      <div className="find-replace-row">
        <input
          value={find}
          onChange={(event) => setFind(event.target.value)}
          placeholder="Localizar"
          spellCheck="false"
        />
        <input
          value={replace}
          onChange={(event) => setReplace(event.target.value)}
          placeholder="Substituir por"
          spellCheck="false"
        />
        <label className="checkbox">
          <input type="checkbox" checked={regex} onChange={(event) => setRegex(event.target.checked)} />
          Regex
        </label>
        <button type="button" onClick={runFindReplace}>Substituir</button>
      </div>

      <div className="two-pane">
        <textarea
          className="big-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Cole ou digite seu texto"
          spellCheck="false"
        />
        <textarea className="big-input" value={result} readOnly placeholder="Resultado" />
      </div>

      <div className="metrics">
        <Metric label="Caracteres" value={countChars(input)} />
        <Metric label="Palavras" value={countWords(input)} />
        <Metric label="Linhas" value={countLines(input)} />
      </div>

      <div className="segments inline">
        <button type="button" onClick={applyResult}>
          <Wand2 aria-hidden="true" size={16} /> Aplicar
        </button>
        <button type="button" onClick={undo} disabled={history.length === 0}>
          <RotateCcw aria-hidden="true" size={16} /> Desfazer
        </button>
        <button type="button" onClick={clearAll}>
          <Trash2 aria-hidden="true" size={16} /> Limpar
        </button>
        <button type="button" onClick={copyResult}>
          <Copy aria-hidden="true" size={16} /> Copiar
        </button>
      </div>
      </>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
