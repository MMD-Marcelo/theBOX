import React, { useState } from "react";
import { RefreshCw, Copy } from "lucide-react";
import {
  generateCpf,
  formatCpf,
  generateCnpj,
  formatCnpj,
  randomName,
  randomEmail,
  randomPhone,
  randomRg,
  randomBirthDate,
  randomAddress,
  randomCompanyName,
} from "../lib/fakerBr.js";

function buildPessoa() {
  const nome = randomName();
  const addr = randomAddress();
  return [
    ["Nome", nome],
    ["CPF", formatCpf(generateCpf())],
    ["RG", randomRg()],
    ["Nascimento", randomBirthDate()],
    ["E-mail", randomEmail(nome)],
    ["Telefone", randomPhone()],
    ["Endereço", `${addr.logradouro} - ${addr.bairro}`],
    ["Cidade/UF", `${addr.cidade}/${addr.estado}`],
    ["CEP", addr.cep],
  ];
}

function buildEmpresa() {
  const nome = randomCompanyName();
  const addr = randomAddress();
  return [
    ["Razão social", nome],
    ["CNPJ", formatCnpj(generateCnpj())],
    ["E-mail", randomEmail(nome.replace(/\s+(Ltda|S\.A\.|ME|EIRELI)$/i, ""))],
    ["Telefone", randomPhone()],
    ["Endereço", `${addr.logradouro} - ${addr.bairro}`],
    ["Cidade/UF", `${addr.cidade}/${addr.estado}`],
    ["CEP", addr.cep],
  ];
}

export default function FakeProfileTool() {
  const [tipo, setTipo] = useState("pessoa");
  const [rows, setRows] = useState([]);

  function generate() {
    setRows(tipo === "pessoa" ? buildPessoa() : buildEmpresa());
  }

  function copy(value) {
    if (value) navigator.clipboard?.writeText(value);
  }

  function copyAll() {
    copy(rows.map(([k, v]) => `${k}: ${v}`).join("\n"));
  }

  return (
    <div className="tool-shell">
      <div className="controls">
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="pessoa">Pessoa</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>
        <button type="button" onClick={generate}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
        <button type="button" onClick={copyAll} disabled={!rows.length}><Copy aria-hidden="true" size={16} /> Copiar tudo</button>
      </div>

      {rows.length > 0 && (
        <div className="whois-summary">
          {rows.map(([key, value]) => (
            <div className="whois-row" key={key}>
              <span className="whois-key">{key}</span>
              <span className="whois-value">{value}</span>
              <button type="button" className="copy-btn" onClick={() => copy(value)} title="Copiar">
                <Copy aria-hidden="true" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
