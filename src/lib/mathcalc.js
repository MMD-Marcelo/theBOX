// Calculos matematicos simples (puros).
export function percentOf(percent, total) {
  return (percent / 100) * total;
}

export function whatPercent(part, total) {
  if (!total) return null;
  return (part / total) * 100;
}

export function percentChange(from, to) {
  if (!from) return null;
  return ((to - from) / from) * 100;
}

export function ruleOfThree(a, b, c) {
  if (!a) return null;
  return (b * c) / a;
}
