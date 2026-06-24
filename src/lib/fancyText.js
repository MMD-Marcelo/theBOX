// Texto estiloso via unicode (negrito, italico, monospace, tachado, etc.).

function mapRange(text, upperBase, lowerBase, digitBase) {
  let out = "";
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90 && upperBase) out += String.fromCodePoint(upperBase + (c - 65));
    else if (c >= 97 && c <= 122 && lowerBase) out += String.fromCodePoint(lowerBase + (c - 97));
    else if (c >= 48 && c <= 57 && digitBase) out += String.fromCodePoint(digitBase + (c - 48));
    else out += ch;
  }
  return out;
}

export const bold = (t) => mapRange(t, 0x1d400, 0x1d41a, 0x1d7ce);
export const monospace = (t) => mapRange(t, 0x1d670, 0x1d68a, 0x1d7f6);
export const sansBold = (t) => mapRange(t, 0x1d5d4, 0x1d5ee, 0x1d7ec);
export const boldItalic = (t) => mapRange(t, 0x1d468, 0x1d482, null);

export function italic(t) {
  let out = "";
  for (const ch of t) {
    if (ch === "h") {
      out += "ℎ"; // italico de 'h' fica num ponto especial
      continue;
    }
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) out += String.fromCodePoint(0x1d434 + (c - 65));
    else if (c >= 97 && c <= 122) out += String.fromCodePoint(0x1d44e + (c - 97));
    else out += ch;
  }
  return out;
}

export const strike = (t) => [...t].map((c) => c + "̶").join("");
export const underline = (t) => [...t].map((c) => c + "̲").join("");

const FLIP = {
  a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ",
  g: "ƃ", h: "ɥ", i: "ı", j: "ɾ", k: "ʞ", l: "ן",
  m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s",
  t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
  "0": "0", "1": "Ɩ", "2": "ㄅ", "3": "Ɛ", "4": "ㄣ",
  "5": "ϛ", "6": "9", "7": "ㄥ", "8": "8", "9": "6",
  ".": "˙", ",": "'", "?": "¿", "!": "¡", "(": ")", ")": "(",
  "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "_": "‾",
};

export function upsideDown(t) {
  return [...t.toLowerCase()]
    .map((c) => FLIP[c] || c)
    .reverse()
    .join("");
}

export const STYLES = [
  { id: "bold", label: "Negrito", fn: bold },
  { id: "italic", label: "Itálico", fn: italic },
  { id: "boldItalic", label: "Negrito Itálico", fn: boldItalic },
  { id: "monospace", label: "Monospace", fn: monospace },
  { id: "sansBold", label: "Sans Negrito", fn: sansBold },
  { id: "strike", label: "Tachado", fn: strike },
  { id: "underline", label: "Sublinhado", fn: underline },
  { id: "upsideDown", label: "De cabeça pra baixo", fn: upsideDown },
];
