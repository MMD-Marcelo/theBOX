import React, { useEffect, useState, useCallback } from "react";
import { Download, Link, Search, X, RefreshCw } from "lucide-react";
import {
  ENGINE_RELEASE_URL,
  checkHealth,
  analyze,
  startDownload,
  startDirect,
  progressUrl,
  saveToBrowser,
} from "../lib/engineClient.js";

const TOKEN_KEY = "thebox-engine-token";

function formatLabel(f) {
  const size = f.filesize ? ` · ${(f.filesize / 1048576).toFixed(0)} MB` : "";
  const fps = f.fps ? `${f.fps}fps` : "";
  const kind = f.hasVideo ? `${f.resolution} ${fps}`.trim() : "áudio";
  return `${kind} · ${f.ext}${size}`;
}

export default function WebDownloaderTool() {
  const [engine, setEngine] = useState("checking");
  const [presence, setPresence] = useState(null);
  const token = sessionStorage.getItem(TOKEN_KEY) || "";
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState(null);
  const [formatId, setFormatId] = useState("");
  const [output, setOutput] = useState("mp4");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");

  const refreshHealth = useCallback(async () => {
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
    refreshHealth();
  }, [refreshHealth]);

  function reportError(error) {
    if (/token/i.test(error.message)) {
      sessionStorage.removeItem(TOKEN_KEY);
      setMessage("A autorizacao do motor mudou. Reinicie o motor e conecte novamente.");
    } else {
      setMessage(error.message);
    }
  }

  async function doAnalyze() {
    if (!url.trim()) return;
    setBusy(true);
    setMessage("");
    setInfo(null);
    try {
      const data = await analyze(url.trim(), token);
      setInfo(data);
      const firstVideo = data.formats.find((f) => f.hasVideo) || data.formats[0];
      setFormatId(firstVideo ? firstVideo.id : "");
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  async function doDownload() {
    setBusy(true);
    setMessage("");
    try {
      const { jobId } = await startDownload({ url: url.trim(), formatId, output }, token);
      trackJob(jobId, info?.title || url.trim());
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  function trackJob(jobId, title) {
    setJobs((current) => [{ id: jobId, title, percent: 0, status: "downloading" }, ...current]);
    const source = new EventSource(progressUrl(jobId, token));
    source.onmessage = (event) => {
      const snap = JSON.parse(event.data);
      setJobs((current) => current.map((j) => (j.id === jobId ? { ...j, ...snap } : j)));
      if (snap.status === "done") saveToBrowser(jobId, token);
      if (["done", "error", "canceled"].includes(snap.status)) source.close();
    };
    source.onerror = () => source.close();
  }

  async function doDirect() {
    setBusy(true);
    setMessage("");
    try {
      const { jobId } = await startDirect(url.trim(), token);
      trackJob(jobId, url.trim().split("/").pop() || url.trim());
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  }

  function cancelJob(jobId) {
    fetch(`http://127.0.0.1:7421/cancel/${jobId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  if (engine === "checking") {
    return <div className="tool-shell"><p className="status-line">Procurando o motor local...</p></div>;
  }

  if (engine === "offline") {
    return (
      <div className="tool-shell downloader-offline">
        <div className="engine-state offline">
          <strong>Motor local desligado</strong>
          <span>
            Os downloaders (YouTube etc.) rodam num motor local opcional no seu PC — assim o THEBOX
            nunca envia nada para servidores. Baixe e execute o THEbox Downloader, depois tente novamente.
          </span>
        </div>
        <div className="segments inline">
          <a className="download" href={ENGINE_RELEASE_URL}>
            <Download aria-hidden="true" size={16} /> Baixar motor (Windows)
          </a>
          <button type="button" onClick={refreshHealth}>
            <RefreshCw aria-hidden="true" size={16} /> Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  // online
  return (
    <div className="tool-shell web-downloader-tool">
      <div className="engine-state online">
        <strong>● Motor ligado</strong>
        <span>
          yt-dlp {presence?.ytdlp ? "ok" : "faltando"} · ffmpeg {presence?.ffmpeg ? "ok" : "faltando"} ·{" "}
          {presence?.folder}
        </span>
      </div>

      <>
          <div className="ip-input-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="URL: YouTube, Instagram, TikTok, X, SoundCloud, link direto..."
              spellCheck="false"
            />
            <button type="button" onClick={doAnalyze} disabled={busy}>
              <Search aria-hidden="true" size={16} /> Analisar
            </button>
            <button type="button" onClick={doDirect} disabled={busy} title="Baixar o arquivo direto da URL">
              <Download aria-hidden="true" size={16} /> Direto
            </button>
          </div>

          {info && (
            <div className="downloader-analyze">
              <strong>{info.title}</strong>
              <div className="find-replace-row">
                <select value={formatId} onChange={(event) => setFormatId(event.target.value)}>
                  {info.formats.map((f) => (
                    <option key={f.id} value={f.id}>{formatLabel(f)}</option>
                  ))}
                </select>
                <select value={output} onChange={(event) => setOutput(event.target.value)}>
                  <option value="mp4">MP4 (vídeo)</option>
                  <option value="mp3">MP3 (áudio)</option>
                </select>
                <button type="button" onClick={doDownload} disabled={busy}>
                  <Download aria-hidden="true" size={16} /> Baixar
                </button>
              </div>
            </div>
          )}
      </>

      {jobs.length > 0 && (
        <div className="web-downloader-queue">
          {jobs.map((job) => (
            <div className="web-downloader-row" key={job.id}>
              <Link aria-hidden="true" size={20} />
              <div className="file-main">
                <strong>{job.title}</strong>
                <span>
                  {job.status === "downloading"
                    ? `${Math.round(job.percent || 0)}% ${job.speed || ""} ${job.eta ? `ETA ${job.eta}` : ""}`
                    : job.status === "done"
                      ? "Concluído"
                      : job.status === "error"
                        ? `Erro: ${job.error || ""}`
                        : "Cancelado"}
                </span>
              </div>
              <span className="queue-status">{(job.status || "").toUpperCase()}</span>
              {job.status === "downloading" && (
                <button type="button" onClick={() => cancelJob(job.id)}>
                  <X aria-hidden="true" size={16} /> Cancelar
                </button>
              )}
              {job.status === "done" && (
                <button type="button" onClick={() => saveToBrowser(job.id, token)}>
                  <Download aria-hidden="true" size={16} /> Salvar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {message && <p className="status-line">{message}</p>}
    </div>
  );
}
