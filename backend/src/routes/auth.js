import { Router } from "express";
import bcrypt from "bcryptjs";
import { getState, persist, uuid, nowISO } from "../db.js";
import { signToken, authRequired } from "../middleware/auth.js";

const router = Router();

function normalizeRole(role) {
  const r = (role || "").toLowerCase();
  if (r === "guru" || r === "teacher") return "guru";
  return "murid";
}

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password wajib diisi" });
  }

  const db = getState();
  const exists = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "Email sudah terdaftar" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = {
    id: uuid(),
    name: String(name),
    email: String(email).toLowerCase(),
    passwordHash,
    role: normalizeRole(role),
    createdAt: nowISO(),
  };

  db.users.push(user);

  // init progress for student
  db.progress.push({
    userId: user.id,
    visitedPlanets: [],
    points: 0,
    updatedAt: nowISO(),
  });

  await persist();

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email dan password wajib diisi" });
  }

  const db = getState();
  const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Email atau password salah" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Email atau password salah" });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get("/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
