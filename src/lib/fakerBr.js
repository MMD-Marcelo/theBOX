// Geradores de dados ficticios BR (browser puro). CPF/CNPJ com digitos validos.

function rnd(max) {
  return Math.floor(Math.random() * max);
}

function digits(n) {
  return Array.from({ length: n }, () => rnd(10));
}

function checkDigit(nums, weights) {
  const sum = nums.reduce((acc, d, i) => acc + d * weights[i], 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function generateCpf() {
  const base = digits(9);
  const d1 = checkDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigit([...base, d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...base, d1, d2].join("");
}

export function validateCpf(cpf) {
  const nums = (cpf || "").replace(/\D/g, "");
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  const arr = nums.split("").map(Number);
  const d1 = checkDigit(arr.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigit(arr.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === arr[9] && d2 === arr[10];
}

const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function generateCnpj() {
  const base = [...digits(8), 0, 0, 0, 1]; // matriz 0001
  const d1 = checkDigit(base, CNPJ_W1);
  const d2 = checkDigit([...base, d1], CNPJ_W2);
  return [...base, d1, d2].join("");
}

export function validateCnpj(cnpj) {
  const nums = (cnpj || "").replace(/\D/g, "");
  if (nums.length !== 14 || /^(\d)\1{13}$/.test(nums)) return false;
  const arr = nums.split("").map(Number);
  const d1 = checkDigit(arr.slice(0, 12), CNPJ_W1);
  const d2 = checkDigit(arr.slice(0, 13), CNPJ_W2);
  return d1 === arr[12] && d2 === arr[13];
}

export function formatCpf(cpf) {
  const n = cpf.replace(/\D/g, "");
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
}

export function formatCnpj(cnpj) {
  const n = cnpj.replace(/\D/g, "");
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`;
}

const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Larissa", "Marcelo", "Natalia", "Otavio", "Paula", "Rafael", "Sofia", "Tiago", "Vanessa", "William"];
const LAST = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Almeida", "Nascimento", "Ferreira", "Rodrigues", "Carvalho", "Gomes", "Martins", "Araujo"];

export function randomName() {
  return `${FIRST[rnd(FIRST.length)]} ${LAST[rnd(LAST.length)]}`;
}

export function randomEmail(name) {
  const base = (name || randomName()).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
  const hosts = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"];
  return `${base}${rnd(100)}@${hosts[rnd(hosts.length)]}`;
}

export function randomPhone() {
  const ddd = 11 + rnd(89);
  const num = `9${digits(8).join("")}`;
  return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
}

export function randomCep() {
  const n = digits(8).join("");
  return `${n.slice(0, 5)}-${n.slice(5)}`;
}

export function randomRg() {
  const n = digits(8).join("");
  const check = rnd(11);
  const last = check === 10 ? "X" : String(check);
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}-${last}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function randomBirthDate(minAge = 18, maxAge = 80) {
  const now = new Date();
  const age = minAge + rnd(maxAge - minAge + 1);
  const year = now.getFullYear() - age;
  const month = 1 + rnd(12);
  const day = 1 + rnd(28);
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

const STREETS = ["Rua das Flores", "Av. Brasil", "Rua São João", "Av. Paulista", "Rua XV de Novembro", "Rua do Comércio", "Av. Getúlio Vargas", "Rua Sete de Setembro"];
const NEIGHBORHOODS = ["Centro", "Jardim América", "Vila Nova", "Bela Vista", "Boa Vista", "Santa Mônica", "São José"];
const CITIES = [["São Paulo", "SP"], ["Rio de Janeiro", "RJ"], ["Belo Horizonte", "MG"], ["Curitiba", "PR"], ["Porto Alegre", "RS"], ["Salvador", "BA"], ["Recife", "PE"], ["Fortaleza", "CE"], ["Goiânia", "GO"], ["Florianópolis", "SC"]];

export function randomAddress() {
  const [cidade, estado] = CITIES[rnd(CITIES.length)];
  return {
    logradouro: `${STREETS[rnd(STREETS.length)]}, ${1 + rnd(2000)}`,
    bairro: NEIGHBORHOODS[rnd(NEIGHBORHOODS.length)],
    cidade,
    estado,
    cep: randomCep(),
  };
}

const COMPANY_CORE = ["Tech", "Global", "Prime", "Nova", "Alpha", "Brasil", "Forte", "União", "Vértice", "Horizonte", "Aurora", "Delta"];
const COMPANY_KIND = ["Soluções", "Comércio", "Serviços", "Indústria", "Logística", "Consultoria", "Sistemas"];
const COMPANY_SUFFIX = ["Ltda", "S.A.", "ME", "EIRELI"];

export function randomCompanyName() {
  return `${COMPANY_CORE[rnd(COMPANY_CORE.length)]} ${COMPANY_KIND[rnd(COMPANY_KIND.length)]} ${COMPANY_SUFFIX[rnd(COMPANY_SUFFIX.length)]}`;
}

const NICK_ADJ = [
  "dark", "fast", "cyber", "pixel", "neo", "mega", "ultra", "shadow", "ghost", "turbo",
  "silent", "toxic", "frozen", "savage", "lucky", "crazy", "epic", "royal", "wild", "lone",
  "red", "blue", "night", "iron", "golden", "crimson", "venom", "atomic", "phantom", "rogue",
];
const NICK_NOUN = [
  "wolf", "ninja", "rider", "hunter", "gamer", "coder", "dragon", "falcon", "viper", "storm",
  "reaper", "knight", "samurai", "tiger", "phoenix", "raven", "demon", "sniper", "wizard", "king",
  "panda", "shark", "fox", "cobra", "beast", "blade", "spectre", "titan", "warrior", "legend",
];

export function randomNick() {
  const a = NICK_ADJ[rnd(NICK_ADJ.length)];
  const n = NICK_NOUN[rnd(NICK_NOUN.length)];
  const num = rnd(1000);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const styles = [
    () => `${a}_${n}${num}`,
    () => `${cap(a)}${cap(n)}${num}`,
    () => `${a}${n}_${num}`,
    () => `x${cap(n)}x${num}`,
    () => `${n}${num}`,
    () => `${a}.${n}`,
    () => `${cap(n)}_${cap(a)}`,
    () => `${a}-${n}-${num}`,
  ];
  return styles[rnd(styles.length)]();
}
