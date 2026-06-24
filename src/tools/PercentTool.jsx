import React, { useState } from "react";
import { percentOf, whatPercent, percentChange } from "../lib/mathcalc.js";
import NumberField from "../components/NumberField.jsx";

function fmt(n) {
  if (n === null || Number.isNaN(n)) return "—";
  return Number(n.toFixed(4)).toString();
}

export default function PercentTool() {
  const [a1, setA1] = useState(10);
  const [a2, setA2] = useState(200);
  const [b1, setB1] = useState(50);
  const [b2, setB2] = useState(200);
  const [c1, setC1] = useState(100);
  const [c2, setC2] = useState(150);

  return (
    <div className="tool-shell">
      <div className="calc-row">
        <span>Quanto é</span>
        <NumberField value={a1} onChange={setA1} />
        <span>% de</span>
        <NumberField value={a2} onChange={setA2} />
        <strong>= {fmt(percentOf(a1, a2))}</strong>
      </div>
      <div className="calc-row">
        <NumberField value={b1} onChange={setB1} />
        <span>é quantos % de</span>
        <NumberField value={b2} onChange={setB2} />
        <strong>= {fmt(whatPercent(b1, b2))}%</strong>
      </div>
      <div className="calc-row">
        <span>Variação de</span>
        <NumberField value={c1} onChange={setC1} />
        <span>para</span>
        <NumberField value={c2} onChange={setC2} />
        <strong>= {fmt(percentChange(c1, c2))}%</strong>
      </div>
    </div>
  );
}
