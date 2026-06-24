import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES } from "../lib/symbols.js";

export default function SymbolsTool() {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");

  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = norm(query.trim());

  const filtered = useMemo(() => {
    if (!q) return CATEGORIES;
    const matches = (item) => item[0] === query.trim() || norm(item[1]).includes(q);
    return CATEGORIES.map((group) => ({ ...group, items: group.items.filter(matches) })).filter(
      (group) => group.items.length > 0
    );
  }, [q, query]);

  function copy(sym) {
    navigator.clipboard?.writeText(sym);
    setCopied(sym);
    setTimeout(() => setCopied(""), 1000);
  }

  return (
    <div className="tool-shell">
      <label className="search">
        <Search aria-hidden="true" size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar símbolo ou emoji (ex: coração, seta, fogo, dólar)"
          spellCheck="false"
        />
      </label>

      {copied && <p className="status-line">Copiado: {copied}</p>}

      <div className="symbols-scroll">
        {filtered.length === 0 && <p className="status-line">Nada encontrado para “{query}”.</p>}
        {filtered.map((group) => (
          <div className="symbol-group" key={group.label}>
            <span className="fancy-label">{group.label}</span>
            <div className="symbol-grid">
              {group.items.map((item) => (
                <button
                  key={item[0] + item[1]}
                  type="button"
                  className="symbol-cell"
                  onClick={() => copy(item[0])}
                  title={item[1]}
                >
                  {item[0]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
