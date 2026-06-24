import React, { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { checkHealth, ENGINE_RELEASE_URL, TOKEN_KEY } from "../lib/engineClient.js";

// Envolve ferramentas que dependem do motor local. So precisa do motor ligado;
// a autorizacao acontece pela origem permitida (sem token manual).
export default function EngineGate({ children }) {
  const [engine, setEngine] = useState("checking");
  const [presence, setPresence] = useState(null);

  const refresh = useCallback(async () => {
    setEngine("checking");
    try {
      const health = await checkHealth();
      setPresence(health);
      setEngine("online");
    } catch {
      setEngine("offline");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (engine === "checking") {
    return <div className="tool-shell"><p className="status-line">Procurando o motor local...</p></div>;
  }

  if (engine === "offline") {
    return (
      <div className="tool-shell downloader-offline">
        <div className="engine-state offline">
          <strong>Motor local desligado</strong>
          <span>
            Esta ferramenta usa o motor local opcional no seu PC — nada é enviado a servidores.
            Baixe e execute o THEbox Downloader.
          </span>
        </div>
        <div className="segments inline">
          <a className="download" href={ENGINE_RELEASE_URL}>
            <Download aria-hidden="true" size={16} /> Baixar motor (Windows)
          </a>
          <button type="button" onClick={refresh}>
            <RefreshCw aria-hidden="true" size={16} /> Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  const token = sessionStorage.getItem(TOKEN_KEY) || "";
  return children({ token, presence });
}
