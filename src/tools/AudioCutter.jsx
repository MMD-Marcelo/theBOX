import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Scissors, Download, RefreshCw } from "lucide-react";
import { stripExtension } from "../utils.js";
import DropZone from "../components/DropZone.jsx";

const W = 1000;
const H = 140;
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

export default function AudioCutter() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [startStr, setStartStr] = useState("0");
  const [endStr, setEndStr] = useState("0");
  const [playMode, setPlayMode] = useState(null); // null | "start" | "normal"
  const [current, setCurrent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const peaksRef = useRef([]);
  const rafRef = useRef(0);

  // numeros derivados (campos vazios caem para limites)
  const start = startStr.trim() === "" ? 0 : Math.max(0, Number(startStr) || 0);
  const end = endStr.trim() === "" ? duration : Math.min(duration, Number(endStr) || 0);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => {
    draw();
  }, [duration, startStr, endStr, current]);

  async function loadAudio(nextFile) {
    setMessage("Carregando áudio...");
    setDownloadUrl("");
    const url = URL.createObjectURL(nextFile);
    if (audioRef.current) audioRef.current.src = url;
    const context = new AudioContext();
    const buffer = await context.decodeAudioData(await nextFile.arrayBuffer());
    await context.close();
    peaksRef.current = computePeaks(buffer, W);
    setFile(nextFile);
    setDuration(buffer.duration);
    setStartStr("0");
    setEndStr(String(round1(buffer.duration)));
    setCurrent(0);
    setMessage("");
  }

  function play(mode) {
    const a = audioRef.current;
    if (!a) return;
    if (playMode === mode) {
      a.pause();
      setPlayMode(null);
      cancelAnimationFrame(rafRef.current);
      return;
    }
    if (mode === "start") {
      a.currentTime = start;
    } else if (a.currentTime >= duration - 0.05) {
      a.currentTime = 0;
    }
    a.play();
    setPlayMode(mode);
    const loop = () => {
      if (a.currentTime >= duration) {
        a.pause();
        setPlayMode(null);
        setCurrent(duration);
        return;
      }
      setCurrent(a.currentTime);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  function resetAudio() {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    cancelAnimationFrame(rafRef.current);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    peaksRef.current = [];
    setFile(null);
    setPlayMode(null);
    setDownloadUrl("");
    setCurrent(0);
    setDuration(0);
    setMessage("");
  }

  function seek(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const t = Math.max(0, Math.min(duration, ratio * duration));
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrent(t);
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    const peaks = peaksRef.current;
    if (!peaks.length || !duration) return;
    const mid = H / 2;
    const sx = (start / duration) * W;
    const ex = (end / duration) * W;
    ctx.fillStyle = "rgba(255,90,0,0.18)";
    ctx.fillRect(sx, 0, ex - sx, H);
    peaks.forEach((p, x) => {
      const inSel = x >= sx && x <= ex;
      ctx.strokeStyle = inSel ? "#ff5a00" : "#5a5a5a";
      ctx.beginPath();
      ctx.moveTo(x, mid - p * mid);
      ctx.lineTo(x, mid + p * mid);
      ctx.stroke();
    });
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    [sx, ex].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    });
    const px = (current / duration) * W;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.stroke();
  }

  async function cutAudio() {
    if (!file) return;
    try {
      setMessage("Cortando...");
      const context = new AudioContext();
      const buffer = await context.decodeAudioData(await file.arrayBuffer());
      const from = Math.max(0, start);
      const to = Math.min(buffer.duration, end || buffer.duration);
      const frameStart = Math.floor(from * buffer.sampleRate);
      const frameEnd = Math.floor(to * buffer.sampleRate);
      const length = Math.max(1, frameEnd - frameStart);
      const output = context.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        output.copyToChannel(buffer.getChannelData(channel).slice(frameStart, frameEnd), channel);
      }
      const wav = audioBufferToWav(output);
      await context.close();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(new Blob([wav], { type: "audio/wav" })));
      setMessage(`Corte pronto: ${from.toFixed(1)}s → ${to.toFixed(1)}s`);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    }
  }

  return (
    <div className="tool-shell">
      <audio ref={audioRef} hidden />
      {!file && (
        <DropZone accept="audio/*" onFile={(files) => loadAudio(files[0])}>
          <strong>Enviar áudio</strong>
          <span>MP3, WAV, OGG, M4A quando suportado pelo navegador</span>
        </DropZone>
      )}

      {file && (
        <>
          <canvas ref={canvasRef} width={W} height={H} className="waveform" onClick={seek} />
          <div className="controls">
            <button type="button" onClick={() => play("start")}>
              {playMode === "start" ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
              {playMode === "start" ? "Pausar" : "Tocar do início"}
            </button>
            <button type="button" onClick={() => play("normal")}>
              {playMode === "normal" ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
              {playMode === "normal" ? "Pausar" : "Tocar"}
            </button>
            <label>
              Início (s)
              <input type="number" min="0" max={round1(duration)} step="0.1" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
            </label>
            <label>
              Fim (s)
              <input type="number" min="0" max={round1(duration)} step="0.1" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
            </label>
            <button type="button" onClick={cutAudio}><Scissors aria-hidden="true" size={16} /> Cortar</button>
            {downloadUrl && (
              <a className="download" download={`${stripExtension(file.name)}-corte.wav`} href={downloadUrl}>
                <Download aria-hidden="true" size={16} /> Baixar WAV
              </a>
            )}
            <button type="button" onClick={resetAudio}><RefreshCw aria-hidden="true" size={16} /> Trocar áudio</button>
          </div>
          <p className="status-line">{file.name} · {duration.toFixed(1)}s · {current.toFixed(1)}s</p>
        </>
      )}
      {message && <p className="status-line">{message}</p>}
    </div>
  );
}

function computePeaks(buffer, width) {
  const data = buffer.getChannelData(0);
  const block = Math.floor(data.length / width) || 1;
  const peaks = [];
  let max = 0.0001;
  for (let i = 0; i < width; i += 1) {
    let peak = 0;
    for (let j = 0; j < block; j += 1) {
      const v = Math.abs(data[i * block + j] || 0);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  return peaks.map((p) => p / max);
}

function audioBufferToWav(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * channels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  let offset = 0;
  const writeString = (value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset++, value.charCodeAt(i));
  };
  writeString("RIFF");
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, channels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * channels * 2, true); offset += 4;
  view.setUint16(offset, channels * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString("data");
  view.setUint32(offset, length - offset - 4, true); offset += 4;
  for (let i = 0; i < buffer.length; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return arrayBuffer;
}
