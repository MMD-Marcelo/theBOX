// Geracao de senha/passphrase usando exclusivamente crypto.getRandomValues.
// Nunca usa Math.random. Nunca persiste nada.

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";
export const AMBIGUOUS = "O0oIl1|`";

// Inteiro aleatorio uniforme em [0, max) sem vies de modulo.
function randomInt(max) {
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function pick(chars) {
  return chars[randomInt(chars.length)];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function selectedGroups({ lower, upper, digits, symbols, excludeAmbiguous }) {
  const groups = [];
  if (lower) groups.push(LOWER);
  if (upper) groups.push(UPPER);
  if (digits) groups.push(DIGITS);
  if (symbols) groups.push(SYMBOLS);
  if (excludeAmbiguous) {
    return groups
      .map((group) => [...group].filter((ch) => !AMBIGUOUS.includes(ch)).join(""))
      .filter(Boolean);
  }
  return groups;
}

export function buildPool(options) {
  return selectedGroups(options).join("");
}

export function generatePassword(options) {
  const { length } = options;
  const groups = selectedGroups(options);
  if (groups.length === 0) {
    throw new Error("Selecione ao menos um grupo de caracteres.");
  }
  if (length < groups.length) {
    throw new Error("Tamanho menor que o numero de grupos selecionados.");
  }
  const pool = groups.join("");
  const chars = groups.map((group) => pick(group));
  for (let i = chars.length; i < length; i += 1) {
    chars.push(pick(pool));
  }
  return shuffle(chars).join("");
}

export function generatePassphrase({ words, separator = "-", wordlist }) {
  const result = [];
  for (let i = 0; i < words; i += 1) {
    result.push(pick(wordlist));
  }
  return result.join(separator);
}

export function entropyBits(length, poolSize) {
  if (poolSize <= 1) return 0;
  return length * Math.log2(poolSize);
}
