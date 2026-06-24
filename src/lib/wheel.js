// Logica da roleta (separada do desenho/canvas, para ser testavel).
export function parseOptions(text) {
  return (text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function pickWinnerIndex(n, rng = Math.random) {
  if (n <= 0) return -1;
  return Math.floor(rng() * n);
}

// Rotacao (graus) para trazer o centro do setor `index` ao ponteiro (topo).
export function angleForIndex(index, n, extraSpins = 5) {
  const seg = 360 / n;
  return extraSpins * 360 + (360 - (index * seg + seg / 2));
}
