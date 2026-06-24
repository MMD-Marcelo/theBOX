import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Copy } from "lucide-react";
import EngineGate from "../components/EngineGate.jsx";
import DropZone from "../components/DropZone.jsx";
import { ocr } from "../lib/engineClient.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

async function nativePageText(page) {
  const content = await page.getTextContent();
  return content.items.map((item) => item.str.trim()).filter(Boolean).join(" ").trim();
}

async function rasterizePage(page, dpi) {
  const baseViewport = page.getViewport({ scale: dpi / 72 });
  const maxDimension = Math.max(baseViewport.width, baseViewport.height);
  const scale = maxDimension > 4096 ? (dpi / 72) * (4096 / maxDimension) : dpi / 72;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: canvas.getContext("2d", { alpha: false }), viewport }).promise;
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Falha ao rasterizar pagina")), "image/png");
  });
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

function Inner({ token }) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [languages, setLanguages] = useState("por+eng");
  const [layout, setLayout] = useState("auto");
  const [dpi, setDpi] = useState(300);
  const [forceOcr, setForceOcr] = useState(false);

  async function handle(files) {
    setBusy(true);
    setText("");
    let out = "";
    const confidences = [];
    const options = { languages, layout, dpi };
    try {
      for (const file of files) {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const data = new Uint8Array(await file.arrayBuffer());
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const selectedText = forceOcr ? "" : await nativePageText(page);
            if (selectedText.length >= 20) {
              setStatus(`Extraindo texto nativo: ${file.name} ${pageNumber}/${pdf.numPages}`);
              out += `${selectedText}\n\n`;
            } else {
              setStatus(`OCR ${file.name}: pagina ${pageNumber}/${pdf.numPages}`);
              const pageBlob = await rasterizePage(page, dpi);
              const result = await ocr(pageBlob, token, options);
              out += `${result.text}\n\n`;
              if (Number.isFinite(result.confidence)) confidences.push(result.confidence);
            }
            setText(out.trim());
            page.cleanup();
          }
          await pdf.destroy();
        } else {
          setStatus(`OCR ${file.name}...`);
          const result = await ocr(file, token, options);
          out += `${result.text}\n\n`;
          if (Number.isFinite(result.confidence)) confidences.push(result.confidence);
          setText(out.trim());
        }
      }
      setText(out.trim());
      const average = confidences.length
        ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
        : null;
      setStatus(average === null ? "Concluido" : `Concluido - confianca media ${average.toFixed(0)}%`);
    } catch (error) {
      setStatus(`Erro: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tool-shell">
      <div className="controls">
        <label>
          Idioma
          <select disabled={busy} value={languages} onChange={(event) => setLanguages(event.target.value)}>
            <option value="por+eng">Portugues + Ingles</option>
            <option value="por">Portugues</option>
            <option value="eng">Ingles</option>
            <option value="spa">Espanhol</option>
            <option value="por+eng+spa">PT + EN + ES</option>
          </select>
        </label>
        <label>
          Layout
          <select disabled={busy} value={layout} onChange={(event) => setLayout(event.target.value)}>
            <option value="auto">Automatico</option>
            <option value="column">Coluna unica</option>
            <option value="block">Bloco de texto</option>
            <option value="sparse">Texto espalhado</option>
            <option value="line">Linha unica</option>
          </select>
        </label>
        <label>
          Resolucao PDF
          <select disabled={busy} value={dpi} onChange={(event) => setDpi(Number(event.target.value))}>
            <option value="200">200 DPI - rapido</option>
            <option value="300">300 DPI - recomendado</option>
            <option value="400">400 DPI - letras pequenas</option>
          </select>
        </label>
        <label className="checkbox">
          <input
            checked={forceOcr}
            disabled={busy}
            type="checkbox"
            onChange={(event) => setForceOcr(event.target.checked)}
          />
          Forcar OCR no PDF
        </label>
      </div>

      <DropZone accept="image/*,application/pdf,.pdf" onFile={handle}>
        <strong>Enviar imagem ou PDF</strong>
        <span>Texto nativo quando existir; OCR local com rotacao automatica</span>
      </DropZone>

      {(busy || status) && <p className="status-line">{status}</p>}

      {text && (
        <>
          <textarea className="big-input" value={text} onChange={(event) => setText(event.target.value)} />
          <div className="segments inline">
            <button type="button" onClick={() => navigator.clipboard?.writeText(text)}>
              <Copy aria-hidden="true" size={16} /> Copiar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function OcrTool() {
  return <EngineGate>{({ token }) => <Inner token={token} />}</EngineGate>;
}
