import React, { useState } from "react";
import { Play, Trash2, FileAudio } from "lucide-react";
import EngineGate from "../components/EngineGate.jsx";
import DropZone from "../components/DropZone.jsx";
import { convertFile, progressUrl, saveToBrowser } from "../lib/engineClient.js";

function Inner({ token, accept, formats, defaultFormat, showBitrate }) {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState(defaultFormat);
  const [bitrate, setBitrate] = useState(192);
  const [jobs, setJobs] = useState({});
  const [message, setMessage] = useState("");

  function addFiles(list) {
    setFiles((current) => [...current, ...list]);
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  function trackJob(key, jobId) {
    const source = new EventSource(progressUrl(jobId, token));
    source.onmessage = (event) => {
      const snap = JSON.parse(event.data);
      setJobs((current) => ({ ...current, [key]: snap }));
      if (snap.status === "done") saveToBrowser(jobId, token);
      if (["done", "error", "canceled"].includes(snap.status)) source.close();
    };
    source.onerror = () => source.close();
  }

  async function convertAll() {
    setMessage("");
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const key = `${i}-${file.name}`;
      try {
        const { jobId } = await convertFile(file, { to: format, bitrate: showBitrate ? bitrate : undefined }, token);
        setJobs((current) => ({ ...current, [key]: { status: "downloading", percent: 0 } }));
        trackJob(key, jobId);
      } catch (error) {
        setJobs((current) => ({ ...current, [key]: { status: "error", error: error.message } }));
      }
    }
  }

  return (
    <div className="tool-shell">
      <DropZone accept={accept} multiple onFile={addFiles}>
        <strong>Solte arquivos aqui</strong>
        <span>ou clique para escolher</span>
      </DropZone>

      <div className="controls">
        <label>
          Saída
          <select value={format} onChange={(event) => setFormat(event.target.value)}>
            {formats.map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </label>
        {showBitrate && (
          <label>
            Bitrate
            <select value={bitrate} onChange={(event) => setBitrate(Number(event.target.value))}>
              {[128, 192, 256, 320].map((b) => (
                <option key={b} value={b}>{b} kbps</option>
              ))}
            </select>
          </label>
        )}
        <button type="button" onClick={convertAll} disabled={files.length === 0}>
          <Play aria-hidden="true" size={16} /> Converter ({files.length})
        </button>
        <button type="button" onClick={() => { setFiles([]); setJobs({}); }} disabled={files.length === 0}>
          <Trash2 aria-hidden="true" size={16} /> Limpar
        </button>
      </div>

      {files.length > 0 && (
        <div className="file-queue">
          {files.map((file, i) => {
            const key = `${i}-${file.name}`;
            const job = jobs[key];
            const statusText = !job
              ? "Na fila"
              : job.status === "downloading"
                ? `Convertendo ${Math.round(job.percent || 0)}%`
                : job.status === "done"
                  ? "Concluído"
                  : job.status === "error"
                    ? `Erro: ${job.error || ""}`
                    : job.status;
            const badge = !job ? "FILA" : job.status === "downloading" ? `${Math.round(job.percent || 0)}%` : job.status === "done" ? "CONCLUÍDO" : job.status === "error" ? "ERRO" : job.status.toUpperCase();
            return (
              <div className="file-row media-row" key={key}>
                <div className="file-main">
                  <FileAudio aria-hidden="true" size={20} />
                  <div>
                    <strong>{file.name}</strong>
                    <span>{statusText}</span>
                  </div>
                </div>
                <span className="queue-status">{badge}</span>
                <button className="icon-button" type="button" title="Remover" onClick={() => removeFile(i)}>
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

export default function MediaConvertTool({ tool }) {
  const isAudio = tool?.id === "mp4-mp3";
  const config = isAudio
    ? { accept: "video/*,audio/*", formats: ["mp3"], defaultFormat: "mp3", showBitrate: true }
    : { accept: "video/*", formats: ["mp4", "webm", "mkv", "mov"], defaultFormat: "mp4", showBitrate: false };
  return <EngineGate>{({ token }) => <Inner token={token} {...config} />}</EngineGate>;
}
