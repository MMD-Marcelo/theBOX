import React, { useState } from "react";
import { Download } from "lucide-react";
import QRCode from "qrcode";

export default function QrGenerator() {
  const [value, setValue] = useState("https://thebox.local");
  const [qr, setQr] = useState("");

  async function generate(nextValue = value) {
    setQr(await QRCode.toDataURL(nextValue, { margin: 2, width: 320 }));
  }

  return (
    <div className="tool-shell">
      <div className="ip-input-row">
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            generate(event.target.value);
          }}
          placeholder="Conteúdo do QR (URL, texto, etc.)"
          spellCheck="false"
        />
        <button onClick={() => generate()} type="button">Gerar QR</button>
      </div>
      {qr && (
        <div className="qr-output">
          <img alt="QR Code gerado" src={qr} />
          <a className="download" download="thebox-qr.png" href={qr}>
            <Download aria-hidden="true" size={18} />
            Baixar PNG
          </a>
        </div>
      )}
    </div>
  );
}
