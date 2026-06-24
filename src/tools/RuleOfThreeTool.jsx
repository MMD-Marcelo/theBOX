import React, { useState } from "react";
import { ruleOfThree } from "../lib/mathcalc.js";
import NumberField from "../components/NumberField.jsx";

function fmt(n) {
  if (n === null || Number.isNaN(n)) return "—";
  return Number(n.toFixed(4)).toString();
}

export default function RuleOfThreeTool() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(10);
  const [c, setC] = useState(6);
  const x = ruleOfThree(a, b, c);

  return (
    <div className="tool-shell">
      <p className="status-line">Se A está para B, então C está para X.</p>
      <div className="calc-row">
        <NumberField value={a} onChange={setA} />
        <span>está para</span>
        <NumberField value={b} onChange={setB} />
      </div>
      <div className="calc-row">
        <NumberField value={c} onChange={setC} />
        <span>está para</span>
        <strong>X = {fmt(x)}</strong>
      </div>
    </div>
  );
}
