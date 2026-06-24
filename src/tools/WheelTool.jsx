import React, { useEffect, useRef, useState } from "react";
import { Play, Shuffle, Trash2 } from "lucide-react";
import { parseOptions, pickWinnerIndex, angleForIndex } from "../lib/wheel.js";

const COLORS = ["#ff5a00", "#ffffff", "#ff8c42", "#c8c8c8", "#ffb37a", "#9b9b9b"];

export default function WheelTool() {
  const [text, setText] = useState("Opção 1\nOpção 2\nOpção 3\nOpção 4");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState("");
  const [removeWinner, setRemoveWinner] = useState(false);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  const options = parseOptions(text);

  useEffect(() => {
    draw(canvasRef.current, options, rotation);
  }, [text, rotation]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function spin() {
    if (spinning || options.length < 2) return;
    setWinner("");
    setSpinning(true);
    const idx = pickWinnerIndex(options.length);
    const target = rotation - (rotation % 360) + angleForIndex(idx, options.length, 6);
    const start = rotation;
    const delta = target - start;
    const dur = 4200;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setRotation(start + delta * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setSpinning(false);
        setWinner(options[idx]);
        if (removeWinner) setText(options.filter((_, i) => i !== idx).join("\n"));
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function shuffle() {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setText(arr.join("\n"));
  }

  return (
    <div className="tool-shell wheel-tool">
      <div className="wheel-area">
        <div className="wheel-canvas-wrap">
          <div className="wheel-pointer" aria-hidden="true" />
          <canvas ref={canvasRef} width={900} height={900} onClick={spin} />
        </div>
        <div className="wheel-side">
          <button type="button" onClick={spin} disabled={spinning || options.length < 2}>
            <Play aria-hidden="true" size={16} /> {spinning ? "Girando..." : "Girar"}
          </button>
          {winner && <p className="status-line">Resultado: {winner}</p>}
          <span className="fancy-label">{options.length} opções</span>
          <textarea
            className="big-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Uma opção por linha"
            spellCheck="false"
          />
          <div className="segments inline">
            <button type="button" onClick={shuffle} disabled={options.length < 2}>
              <Shuffle aria-hidden="true" size={14} /> Embaralhar
            </button>
            <button type="button" onClick={() => setText("")}>
              <Trash2 aria-hidden="true" size={14} /> Limpar
            </button>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={removeWinner} onChange={(e) => setRemoveWinner(e.target.checked)} />
            Remover vencedor após girar
          </label>
        </div>
      </div>
    </div>
  );
}

function draw(canvas, options, rotation) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  ctx.clearRect(0, 0, size, size);
  if (!options.length) return;
  const seg = (Math.PI * 2) / options.length;
  const rad = (rotation * Math.PI) / 180;

  options.forEach((opt, i) => {
    const start = i * seg - Math.PI / 2 + rad;
    const end = start + seg;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 2;
    ctx.stroke();
    // texto
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + seg / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0a0a0a";
    ctx.font = `bold ${Math.round(size * 0.026)}px 'Oxygen Mono', monospace`;
    ctx.fillText(opt.slice(0, 18), r - size * 0.03, size * 0.01);
    ctx.restore();
  });

  // centro
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = "#ff5a00";
  ctx.fill();
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 3;
  ctx.stroke();
}
