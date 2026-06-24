// Numeros aleatorios e sorteio (browser puro).
export function randomInt(min, max) {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function randomNumbers(count, min, max) {
  return Array.from({ length: Math.max(0, count) }, () => randomInt(min, max));
}

export function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Sorteio sem repeticao (Fisher-Yates parcial).
export function draw(list, n) {
  const pool = [...list];
  const take = Math.min(n, pool.length);
  const result = [];
  for (let i = 0; i < take; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
