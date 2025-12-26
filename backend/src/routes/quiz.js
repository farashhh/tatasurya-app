import { Router } from "express";
import { getState, persist, uuid, nowISO } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

/**
 * Submit quiz answers.
 * - Murid: disimpan sebagai attempt + update progress/points.
 * - Guru: hanya "preview" (dinilai tapi tidak disimpan) agar guru bisa mencoba soal.
 */
router.post("/submit", authRequired, async (req, res) => {
  const { planetId, answers } = req.body || {};
  if (!planetId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "planetId dan answers wajib diisi" });
  }

  const db = getState();
  const questions = db.questions.filter(q => q.planetId === planetId);

  if (questions.length === 0) {
    return res.status(400).json({ error: "Belum ada soal untuk planet ini" });
  }

  const answerMap = new Map();
  for (const a of answers) {
    if (!a || !a.questionId) continue;
    answerMap.set(String(a.questionId), Number(a.selectedIndex));
  }

  let score = 0;
  const results = questions.map(q => {
    const selectedIndex = answerMap.has(q.id) ? answerMap.get(q.id) : null;
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) score += 1;
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation || "",
    };
  });

  const isStudent = req.user.role === "murid";
  let pointsAdded = 0;

  if (isStudent) {
    const attempt = {
      id: uuid(),
      userId: req.user.id,
      planetId,
      score,
      total: questions.length,
      results,
      createdAt: nowISO(),
    };

    db.quizAttempts.push(attempt);

    // Update progress: points + mark planet visited
    let prog = db.progress.find(p => p.userId === req.user.id);
    if (!prog) {
      prog = { userId: req.user.id, visitedPlanets: [], points: 0, updatedAt: nowISO() };
      db.progress.push(prog);
    }

    pointsAdded = score * 10;
    prog.points = (prog.points || 0) + pointsAdded;
    if (!prog.visitedPlanets.includes(planetId)) prog.visitedPlanets.push(planetId);
    prog.updatedAt = nowISO();

    await persist();

    return res.json({
      attempt: {
        id: attempt.id,
        planetId: attempt.planetId,
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt,
      },
      results,
      pointsAdded,
      mode: "student",
    });
  }

  // Teacher preview (no persist)
  res.json({
    attempt: {
      id: null,
      planetId,
      score,
      total: questions.length,
      createdAt: nowISO(),
    },
    results,
    pointsAdded: 0,
    mode: "teacher_preview",
  });
});

router.get("/my-scores", authRequired, (req, res) => {
  const db = getState();
  const items = db.quizAttempts
    .filter(a => a.userId === req.user.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  res.json({ attempts: items });
});

router.get("/scores", authRequired, requireRole("guru"), (req, res) => {
  const db = getState();
  const { planetId, userId } = req.query;

  // only students
  const studentIds = new Set(db.users.filter(u => u.role === "murid").map(u => u.id));

  let items = db.quizAttempts.filter(a => studentIds.has(a.userId));
  if (planetId) items = items.filter(a => a.planetId === planetId);
  if (userId) items = items.filter(a => a.userId === userId);

  const enriched = items
    .map(a => {
      const u = db.users.find(x => x.id === a.userId);
      const p = db.planets.find(x => x.id === a.planetId);
      return {
        ...a,
        student: u ? { id: u.id, name: u.name, email: u.email } : { id: a.userId, name: "Tidak dikenal", email: "" },
        planet: p ? { id: p.id, name: p.name } : { id: a.planetId, name: a.planetId },
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  res.json({ attempts: enriched });
});

export default router;
