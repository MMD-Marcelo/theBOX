import React, { useState } from "react";
import { bmi, bmiCategory, idealWeight, bmr, tdee, ACTIVITY } from "../lib/health.js";
import NumberField from "../components/NumberField.jsx";

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export default function HealthCalcTool() {
  const [peso, setPeso] = useState(70);
  const [altura, setAltura] = useState(175);
  const [idade, setIdade] = useState(28);
  const [sexo, setSexo] = useState("m");
  const [atividade, setAtividade] = useState("leve");

  const imc = bmi(peso, altura);
  const ideal = idealWeight(altura, sexo);
  const base = bmr(peso, altura, idade, sexo);
  const total = tdee(base, atividade);

  return (
    <div className="tool-shell">
      <div className="controls">
        <label>Peso (kg)<NumberField value={peso} onChange={setPeso} /></label>
        <label>Altura (cm)<NumberField value={altura} onChange={setAltura} /></label>
        <label>Idade<NumberField value={idade} onChange={setIdade} /></label>
        <label>Sexo
          <select value={sexo} onChange={(e) => setSexo(e.target.value)}>
            <option value="m">Masculino</option>
            <option value="f">Feminino</option>
          </select>
        </label>
        <label>Atividade
          <select value={atividade} onChange={(e) => setAtividade(e.target.value)}>
            {Object.keys(ACTIVITY).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <span className="fancy-label">IMC</span>
      <div className="metrics">
        <Metric label="IMC" value={imc.toFixed(1)} />
        <Metric label="Classificação" value={bmiCategory(imc)} />
      </div>

      <span className="fancy-label">Peso ideal</span>
      <div className="metrics">
        <Metric label="Média" value={`${ideal.media.toFixed(1)} kg`} />
        {Object.entries(ideal.formulas).map(([k, v]) => (
          <Metric key={k} label={k} value={`${v.toFixed(1)} kg`} />
        ))}
      </div>

      <span className="fancy-label">Calorias (kcal/dia)</span>
      <div className="metrics">
        <Metric label="TMB (repouso)" value={Math.round(base)} />
        <Metric label="Manutenção" value={Math.round(total)} />
        <Metric label="Cortar (-20%)" value={Math.round(total * 0.8)} />
        <Metric label="Ganhar (+15%)" value={Math.round(total * 1.15)} />
      </div>
    </div>
  );
}
