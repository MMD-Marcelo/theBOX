import React, { useState } from "react";
import { RefreshCw, Copy } from "lucide-react";
import {
  generateCpf,
  generateCnpj,
  formatCpf,
  formatCnpj,
  randomName,
  randomEmail,
  randomPhone,
  randomCep,
} from "../lib/fakerBr.js";
import NumberField from "../components/NumberField.jsx";

const TYPES = [
  { id: "cpf", label: "CPF", gen: () => formatCpf(generateCpf()) },
  { id: "cnpj", label: "CNPJ", gen: () => formatCnpj(generateCnpj()) },
  { id: "nome", label: "Nome", gen: () => randomName() },
  { id: "email", label: "E-mail", gen: () => randomEmail() },
  { id: "telefone", label: "Telefone", gen: () => randomPhone() },
  { id: "cep", label: "CEP", gen: () => randomCep() },
];

export default function FakeDataBrTool() {
  const [typeId, setTypeId] = useState("cpf");
  const [mask, setMask] = useState(true);
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState("");

  function generate() {
    const type = TYPES.find((t) => t.id === typeId);
    const lines = Array.from({ length: Math.max(1, count) }, () => {
      const value = type.gen();
      if (!mask && (typeId === "cpf" || typeId === "cnpj")) return value.replace(/\D/g, "");
      return value;
    });
    setOutput(lines.join("\n"));
  }

  function copy() {
    if (output) navigator.clipboard?.writeText(output);
  }

  return (
    <div className="tool-shell">
      <div className="segments inline wrap">
        {TYPES.map((t) => (
          <button key={t.id} className={typeId === t.id ? "active" : ""} type="button" onClick={() => setTypeId(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="controls">
        <label>
          Quantidade
          <NumberField min="1" max="500" value={count} onChange={setCount} />
        </label>
        {(typeId === "cpf" || typeId === "cnpj") && (
          <label className="checkbox">
            <input type="checkbox" checked={mask} onChange={(e) => setMask(e.target.checked)} /> com máscara
          </label>
        )}
        <button type="button" onClick={generate}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
        <button type="button" onClick={copy} disabled={!output}><Copy aria-hidden="true" size={16} /> Copiar</button>
      </div>
      {output && <textarea className="big-input" readOnly value={output} />}
    </div>
  );
}
