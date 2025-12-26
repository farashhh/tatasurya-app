import { Router } from "express";
import { getState, persist, uuid, nowISO } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

function sanitizeQuestionForStudent(q) {
  const { correctIndex, ...rest } = q;
  return rest;
}

router.get("/", authRequired, (req, res) => {
  const { planetId } = req.query;
  const db = getState();
  let items = db.questions;
  if (planetId) items = items.filter(q => q.planetId === planetId);

  // sort newest first
  items = [...items].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  if (req.user.role !== "guru") {
    items = items.map(sanitizeQuestionForStudent);
  }

  res.json({ questions: items });
});

router.get("/:id", authRequired, (req, res) => {
  const db = getState();
  const q = db.questions.find(x => x.id === req.params.id);
  if (!q) return res.status(404).json({ error: "Soal tidak ditemukan" });
  if (req.user.role !== "guru") return res.json({ question: sanitizeQuestionForStudent(q) });
  res.json({ question: q });
});

router.post("/", authRequired, requireRole("guru"), async (req, res) => {
  const { planetId, prompt, options, correctIndex, explanation } = req.body || {};
  if (!planetId || !prompt || !Array.isArray(options) || options.length < 2 || correctIndex == null) {
    return res.status(400).json({ error: "planetId, prompt, options (>=2), correctIndex wajib diisi" });
  }

  const ci = Number(correctIndex);
  if (Number.isNaN(ci) || ci < 0 || ci >= options.length) {
    return res.status(400).json({ error: "correctIndex tidak valid" });
  }

  const db = getState();
  const existsPlanet = db.planets.find(p => p.id === planetId);
  if (!existsPlanet) return res.status(400).json({ error: "planetId tidak valid" });

  const q = {
    id: uuid(),
    planetId,
    prompt: String(prompt),
    options: options.map(String),
    correctIndex: ci,
    explanation: explanation ? String(explanation) : "",
    createdBy: req.user.id,
    createdAt: nowISO(),
  };

  db.questions.push(q);
  await persist();

  res.status(201).json({ question: q });
});

router.put("/:id", authRequired, requireRole("guru"), async (req, res) => {
  const { prompt, options, correctIndex, explanation, planetId } = req.body || {};
  const db = getState();
  const idx = db.questions.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Soal tidak ditemukan" });

  if (planetId != null) {
    const existsPlanet = db.planets.find(p => p.id === planetId);
    if (!existsPlanet) return res.status(400).json({ error: "planetId tidak valid" });
    db.questions[idx].planetId = planetId;
  }
  if (prompt != null) db.questions[idx].prompt = String(prompt);
  if (Array.isArray(options)) {
    if (options.length < 2) return res.status(400).json({ error: "options minimal 2" });
    db.questions[idx].options = options.map(String);
  }
  if (correctIndex != null) {
    const ci = Number(correctIndex);
    const optLen = db.questions[idx].options?.length ?? 0;
    if (Number.isNaN(ci) || ci < 0 || ci >= optLen) {
      return res.status(400).json({ error: "correctIndex tidak valid" });
    }
    db.questions[idx].correctIndex = ci;
  }
  if (explanation != null) db.questions[idx].explanation = String(explanation);

  await persist();
  res.json({ question: db.questions[idx] });
});

router.delete("/:id", authRequired, requireRole("guru"), async (req, res) => {
  const db = getState();
  const before = db.questions.length;
  db.questions = db.questions.filter(q => q.id !== req.params.id);
  if (db.questions.length === before) return res.status(404).json({ error: "Soal tidak ditemukan" });
  await persist();
  res.json({ ok: true });
});

export default router;
