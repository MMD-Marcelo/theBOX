// Geradores de IP aleatorio (browser puro).
function rnd(max) {
  return Math.floor(Math.random() * max);
}

export function randomIPv4() {
  return Array.from({ length: 4 }, () => rnd(256)).join(".");
}

export function randomIPv6() {
  return Array.from({ length: 8 }, () => rnd(0x10000).toString(16)).join(":");
}

export function generateIps(count, version = "ipv4") {
  const gen = version === "ipv6" ? randomIPv6 : randomIPv4;
  return Array.from({ length: Math.max(0, count) }, () => gen());
}
