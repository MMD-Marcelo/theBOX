import React, { useState, useRef, useEffect } from "react";
import { imageToBlockSvg, imageToVTracerSvg, stripExtension } from "../utils.js";
import DropZone from "../components/DropZone.jsx";

export default function RasterVectorizer() {
  const [file, setFile] = useState(null);
  const [engine, setEngine] = useState("vtracer");
  const [traceMode, setTraceMode] = useState("spline");
  const [hierarchical, setHierarchical] = useState("stacked");
  const [colorPrecision, setColorPrecision] = useState(7);
  const [filterSpeckle, setFilterSpeckle] = useState(4);
  const [threshold, setThreshold] = useState(160);
  const [cellSize, setCellSize] = useState(6);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [svgPreview, setSvgPreview] = useState("");
  const [message, setMessage] = useState("");
  const canvasIdRef = useRef(`vtracer-canvas-${crypto.randomUUID()}`);
  const svgIdRef = useRef(`vtracer-svg-${crypto.randomUUID()}`);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  function loadFile(files) {
    setFile(files[0]);
    setSvgPreview("");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl("");
    setMessage("");
  }

  async function vectorize() {
    if (!file) return;
    try {
      setMessage("Vetorizando...");
      const svg =
        engine === "vtracer"
          ? await imageToVTracerSvg(file, {
              canvas: canvasRef.current,
              canvasId: canvasIdRef.current,
              colorPrecision,
              filterSpeckle,
              hierarchical,
              mode: traceMode,
              svg: svgRef.current,
              svgId: svgIdRef.current,
            })
          : await imageToBlockSvg(file, threshold, cellSize);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      setSvgPreview(svg);
      setDownloadUrl(url);
      setMessage(`${file.name} vetorizado`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  return (
    <div className="tool-shell">
      <DropZone accept="image/jpeg,image/png,image/webp,image/avif" multiple={false} onFile={loadFile}>
        <strong>Enviar imagem</strong>
        <span>VTracer ou SVG de blocos</span>
      </DropZone>
      {file && (
        <div className="batch-actions">
          <span className="status-line">{file.name}</span>
          <label>
            Motor
            <select value={engine} onChange={(event) => setEngine(event.target.value)}>
              <option value="vtracer">VTracer cor</option>
              <option value="blocks">Blocos</option>
            </select>
          </label>
          {engine === "vtracer" && (
            <>
              <label>
                Curva
                <select value={traceMode} onChange={(event) => setTraceMode(event.target.value)}>
                  <option value="spline">Spline</option>
                  <option value="polygon">Poligono</option>
                  <option value="none">Pixel</option>
                </select>
              </label>
              <label>
                Camadas
                <select value={hierarchical} onChange={(event) => setHierarchical(event.target.value)}>
                  <option value="stacked">Empilhado</option>
                  <option value="cutout">Recorte</option>
                </select>
              </label>
              <label>
                Cores
                <input min="3" max="8" onChange={(event) => setColorPrecision(Number(event.target.value))} type="number" value={colorPrecision} />
              </label>
            </>
          )}
          <label>
            Ruido
            <input min="0" max="50" onChange={(event) => setFilterSpeckle(Number(event.target.value))} type="number" value={filterSpeckle} />
          </label>
          {engine === "blocks" && (
            <label>
              Limiar
              <input min="0" max="255" onChange={(event) => setThreshold(Number(event.target.value))} type="number" value={threshold} />
            </label>
          )}
          {engine === "blocks" && (
            <>
              <label>
                Bloco
                <input min="2" max="20" onChange={(event) => setCellSize(Number(event.target.value))} type="number" value={cellSize} />
              </label>
            </>
          )}
          <button onClick={vectorize} type="button">Vetorizar</button>
          {downloadUrl && <a className="download" download={`${stripExtension(file.name)}.svg`} href={downloadUrl}>Baixar SVG</a>}
        </div>
      )}
      <div className="vector-workbench" aria-hidden="true">
        <canvas id={canvasIdRef.current} ref={canvasRef} />
        <svg id={svgIdRef.current} ref={svgRef} xmlns="http://www.w3.org/2000/svg" />
      </div>
      {svgPreview && (
        <div className="vector-preview">
          <div dangerouslySetInnerHTML={{ __html: svgPreview }} />
        </div>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
