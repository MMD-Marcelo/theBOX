import React, { useState } from "react";
import { RefreshCw, Copy } from "lucide-react";
import { generateIps } from "../lib/ipGen.js";
import NumberField from "../components/NumberField.jsx";

export default function IpGeneratorTool() {
  const [version, setVersion] = useState("ipv4");
  const [count, setCount] = useState(10);
  const [ips, setIps] = useState([]);

  function generate() {
    setIps(generateIps(count, version));
  }

  function copyAll() {
    if (ips.length) navigator.clipboard?.writeText(ips.join("\n"));
  }

  return (
    <div className="tool-shell">
      <div className="controls">
        <label>
          Versão
          <select value={version} onChange={(e) => setVersion(e.target.value)}>
            <option value="ipv4">IPv4</option>
            <option value="ipv6">IPv6</option>
          </select>
        </label>
        <label>
          Quantidade
          <NumberField min="1" max="1000" value={count} onChange={setCount} />
        </label>
        <button type="button" onClick={generate}><RefreshCw aria-hidden="true" size={16} /> Gerar</button>
        <button type="button" onClick={copyAll} disabled={!ips.length}><Copy aria-hidden="true" size={16} /> Copiar</button>
      </div>
      {ips.length > 0 && <textarea className="big-input" readOnly value={ips.join("\n")} />}
    </div>
  );
}
