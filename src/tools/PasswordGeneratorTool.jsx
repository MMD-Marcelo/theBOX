import React, { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { buildPool, generatePassword, generatePassphrase, entropyBits } from "../lib/password.js";
import { WORDLIST } from "../lib/wordlist.js";

function strengthLabel(bits) {
  if (bits < 40) return "Fraca";
  if (bits < 60) return "Razoável";
  if (bits < 80) return "Forte";
  return "Excelente";
}

export default function PasswordGeneratorTool() {
  const [mode, setMode] = useState("senha");
  const [length, setLength] = useState(16);
  const [groups, setGroups] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [words, setWords] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [output, setOutput] = useState("");
  const [bits, setBits] = useState(0);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");

  function toggleGroup(key) {
    setGroups((current) => ({ ...current, [key]: !current[key] }));
  }

  function generate() {
    setMessage("");
    try {
      let value;
      let entropy;
      if (mode === "senha") {
        const options = { length, ...groups, excludeAmbiguous };
        value = generatePassword(options);
        entropy = entropyBits(length, buildPool(options).length);
      } else {
        value = generatePassphrase({ words, separator, wordlist: WORDLIST });
        entropy = entropyBits(words, WORDLIST.length);
      }
      setOutput(value);
      setBits(entropy);
      setHistory((current) => [value, ...current].slice(0, 20));
    } catch (error) {
      setMessage(error.message);
      setOutput("");
      setBits(0);
    }
  }

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  return (
    <div className="tool-shell password-tool">
      <div className="segments inline">
        <button className={mode === "senha" ? "active" : ""} type="button" onClick={() => setMode("senha")}>
          Senha
        </button>
        <button
          className={mode === "passphrase" ? "active" : ""}
          type="button"
          onClick={() => setMode("passphrase")}
        >
          Passphrase
        </button>
      </div>

      {mode === "senha" ? (
        <div className="password-controls">
          <label className="range-field">
            Tamanho: {length}
            <input
              type="range"
              min="4"
              max="64"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
            />
          </label>
          <div className="checkbox-grid">
            <label className="checkbox">
              <input type="checkbox" checked={groups.lower} onChange={() => toggleGroup("lower")} /> minúsculas
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={groups.upper} onChange={() => toggleGroup("upper")} /> MAIÚSCULAS
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={groups.digits} onChange={() => toggleGroup("digits")} /> números
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={groups.symbols} onChange={() => toggleGroup("symbols")} /> símbolos
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(event) => setExcludeAmbiguous(event.target.checked)}
              />
              excluir ambíguos
            </label>
          </div>
        </div>
      ) : (
        <div className="password-controls">
          <label className="range-field">
            Palavras: {words}
            <input
              type="range"
              min="3"
              max="10"
              value={words}
              onChange={(event) => setWords(Number(event.target.value))}
            />
          </label>
          <label>
            Separador
            <input
              value={separator}
              onChange={(event) => setSeparator(event.target.value)}
              maxLength={3}
              spellCheck="false"
            />
          </label>
        </div>
      )}

      <button type="button" onClick={generate}>
        <RefreshCw aria-hidden="true" size={16} /> Gerar
      </button>

      {output && (
        <div className="password-output">
          <code>{output}</code>
          <button type="button" onClick={copy} title="Copiar">
            <Copy aria-hidden="true" size={16} />
          </button>
        </div>
      )}

      {output && (
        <div className="entropy">
          <span className="queue-status">{strengthLabel(bits)}</span>
          <span>{Math.round(bits)} bits de entropia</span>
        </div>
      )}

      {history.length > 0 && (
        <div className="password-history">
          <span>Histórico da sessão</span>
          <ul>
            {history.map((item, index) => (
              <li key={`${index}-${item}`}><code>{item}</code></li>
            ))}
          </ul>
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
