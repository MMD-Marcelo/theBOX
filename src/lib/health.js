// Calculos de saude (puros).
export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value) {
  if (value < 18.5) return "Abaixo do peso";
  if (value < 25) return "Peso normal";
  if (value < 30) return "Sobrepeso";
  if (value < 35) return "Obesidade I";
  if (value < 40) return "Obesidade II";
  return "Obesidade III";
}

export function idealWeight(heightCm, sex) {
  const inchesOver5ft = Math.max(0, heightCm / 2.54 - 60);
  const male = sex === "m";
  const formulas = {
    Devine: (male ? 50 : 45.5) + 2.3 * inchesOver5ft,
    Robinson: (male ? 52 : 49) + (male ? 1.9 : 1.7) * inchesOver5ft,
    Miller: (male ? 56.2 : 53.1) + (male ? 1.41 : 1.36) * inchesOver5ft,
    Hamwi: (male ? 48 : 45.5) + (male ? 2.7 : 2.2) * inchesOver5ft,
  };
  const values = Object.values(formulas);
  const media = values.reduce((a, b) => a + b, 0) / values.length;
  return { formulas, media };
}

export function bmr(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (sex === "m" ? 5 : -161);
}

export const ACTIVITY = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  intenso: 1.9,
};

export function tdee(bmrValue, activity) {
  return bmrValue * (ACTIVITY[activity] ?? 1.2);
}

function parseDateBr(str) {
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
}

export function ageDetailed(birthStr, now = new Date()) {
  const birth = parseDateBr(birthStr);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}
