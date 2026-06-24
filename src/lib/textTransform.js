// Transformacoes de texto puras e testaveis. Sem dependencias de DOM.

export function toUpper(text) {
  return text.toUpperCase();
}

export function toLower(text) {
  return text.toLowerCase();
}

export function capitalizeWords(text) {
  return text.replace(/(^|\s)(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase());
}

export function sentenceCase(text) {
  return text.replace(/(^|[.?!]\s+)(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase());
}

export function reverseText(text) {
  return [...text].reverse().join("");
}

export function stripAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function removeDoubleSpaces(text) {
  return text.replace(/ {2,}/g, " ");
}

export function removeEmptyLines(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .join("\n");
}

export function removeDuplicateLines(text) {
  const seen = new Set();
  return text
    .split(/\r?\n/)
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .join("\n");
}

export function sortLines(text) {
  return text
    .split(/\r?\n/)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
}

function toWords(text) {
  return stripAccents(text)
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function toSlug(text) {
  return toWords(text).join("-").toLowerCase();
}

export function toCamelCase(text) {
  const words = toWords(text).map((word) => word.toLowerCase());
  return words
    .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

export function toPascalCase(text) {
  return toWords(text)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function toSnakeCase(text) {
  return toWords(text).join("_").toLowerCase();
}

export function toKebabCase(text) {
  return toWords(text).join("-").toLowerCase();
}

export function findReplace(text, { find, replace = "", regex = false }) {
  if (!find) return text;
  if (regex) {
    const pattern = new RegExp(find, "g");
    return text.replace(pattern, replace);
  }
  return text.split(find).join(replace);
}

export function removeLineBreaks(text) {
  return text
    .replace(/\r?\n/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function wordFrequency(text) {
  const words = (text.toLowerCase().match(/\p{L}+/gu) || []);
  const map = new Map();
  for (const word of words) map.set(word, (map.get(word) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([word, count]) => ({ word, count }));
}

const PT_UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const PT_TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const PT_HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function under1000(n) {
  if (n === 100) return "cem";
  const parts = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h > 0) parts.push(PT_HUNDREDS[h]);
  if (r > 0) {
    if (r < 20) parts.push(PT_UNITS[r]);
    else {
      const t = Math.floor(r / 10);
      const u = r % 10;
      parts.push(u === 0 ? PT_TENS[t] : `${PT_TENS[t]} e ${PT_UNITS[u]}`);
    }
  }
  return parts.join(" e ");
}

export function numberToWordsPtBr(value) {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return "zero";
  const sign = value < 0 ? "menos " : "";
  const millions = Math.floor(n / 1000000);
  n %= 1000000;
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts = [];
  if (millions > 0) parts.push(millions === 1 ? "um milhão" : `${under1000(millions)} milhões`);
  if (thousands > 0) parts.push(thousands === 1 ? "mil" : `${under1000(thousands)} mil`);
  if (rest > 0) parts.push(under1000(rest));

  let out = parts[0];
  for (let i = 1; i < parts.length; i += 1) {
    const isLast = i === parts.length - 1;
    const restVal = isLast ? rest : null;
    const connector = isLast && restVal !== null && (restVal < 100 || restVal % 100 === 0) ? " e " : " ";
    out += connector + parts[i];
  }
  return sign + out;
}

export function countChars(text) {
  return text.length;
}

export function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function countLines(text) {
  return text.split(/\r?\n/).length;
}
