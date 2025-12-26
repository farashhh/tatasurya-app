import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "../db.json");

let state = null;
let writeQueue = Promise.resolve();

export function getState() {
  if (!state) {
    if (!fs.existsSync(DB_FILE)) {
      state = { users: [], planets: [], materials: [], questions: [], quizAttempts: [], progress: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
    } else {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      state = JSON.parse(raw || "{}");
    }
  }
  // Ensure required arrays exist
  state.users ??= [];
  state.planets ??= [];
  state.materials ??= [];
  state.questions ??= [];
  state.quizAttempts ??= [];
  state.progress ??= [];
  return state;
}

export async function persist() {
  const data = JSON.stringify(state, null, 2);
  writeQueue = writeQueue.then(() => fs.promises.writeFile(DB_FILE, data, "utf-8"));
  return writeQueue;
}

export function uuid() {
  return crypto.randomUUID();
}

export function nowISO() {
  return new Date().toISOString();
}
