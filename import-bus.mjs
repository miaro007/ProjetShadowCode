// Script de lancement rapide - lit le .env.local automatiquement
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// Lire .env.local et charger les variables
const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
  process.env[key] = val;
}

console.log("📦 Variables chargées depuis .env.local");
console.log("🚌 Lancement de l'import des bus...\n");

// Lancer le vrai script
const { default: main } = await import("./src/scripts/import-bus.mjs");
