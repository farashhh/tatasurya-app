import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "db.json");

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], planets: [], materials: [], questions: [], quizAttempts: [], progress: [] };
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw || "{}");
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export default async function handler(req, res) {
  // CORS (kalau frontend beda domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password wajib diisi" });
    }

    const safeEmail = String(email).trim().toLowerCase();
    const safeRole = role === "guru" ? "guru" : "murid";

    const db = readDB();
    db.users = db.users || [];
    db.progress = db.progress || [];

    const exists = db.users.find((u) => (u.email || "").toLowerCase() === safeEmail);
    if (exists) return res.status(409).json({ message: "Email sudah terdaftar" });

    const passwordHash = await bcrypt.hash(password, 10);

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      name,
      email: safeEmail,
      passwordHash,
      role: safeRole,
      createdAt: now,
    };

    db.users.push(newUser);

    // buat progress awal
    db.progress.push({
      userId,
      visitedPlanets: [],
      points: 0,
      updatedAt: now,
    });

    // ⚠️ Catatan: di Vercel, write file tidak selalu persisten. Untuk demo biasanya OK.
    writeDB(db);

    return res.status(201).json({
      message: "Registrasi berhasil",
      user: { id: userId, name, email: safeEmail, role: safeRole },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: String(err?.message || err) });
  }
}
