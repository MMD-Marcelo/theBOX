// Gerador de Lorem Ipsum (browser puro).
const WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud " +
  "exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute " +
  "irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur " +
  "excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt"
).split(" ");

function pick() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function words(n) {
  return Array.from({ length: Math.max(0, n) }, pick).join(" ");
}

function sentence() {
  const len = 6 + Math.floor(Math.random() * 9);
  const text = words(len);
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export function sentences(n) {
  return Array.from({ length: Math.max(0, n) }, sentence).join(" ");
}

export function paragraphs(n) {
  return Array.from({ length: Math.max(0, n) }, () => sentences(4 + Math.floor(Math.random() * 4))).join("\n\n");
}
