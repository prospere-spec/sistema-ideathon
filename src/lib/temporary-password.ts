import { randomInt } from "node:crypto";

const words = [
  "Aroeira", "Aurora", "Brisa", "Caju", "Canario", "Cedro", "Cerrado", "Chuva",
  "Duna", "Estrela", "Favo", "Figueira", "Flora", "Horizonte", "Ipê", "Jatoba",
  "Lagoa", "Lima", "Manaca", "Nuvem", "Onda", "Paineira", "Pitanga", "Raiz",
  "Sabiá", "Sereno", "Sol", "Tambor", "Trilha", "Vento", "Verde", "Vitoria",
];

export function generateTemporaryPassword() {
  const selected = Array.from({ length: 3 }, () => words[randomInt(words.length)]);
  const number = String(randomInt(10_000)).padStart(4, "0");
  return `${selected[0]}-${number}-${selected[1]}-${selected[2]}`;
}
