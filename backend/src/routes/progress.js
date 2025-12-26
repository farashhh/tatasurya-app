import { Router } from "express";
import { getState, persist, nowISO } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

function computeStats(db, userId) {
  const attempts = db.quizAttempts.filter(a => a.userId === userId);
  const totalAttempts = attempts.length;
  const totalCorrect = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + (a.total || 0), 0);
  const avg = totalQuestions ? (totalCorrect / totalQuestions) : 0;

  const best = attempts.reduce((acc, a) => {
    const ratio = (a.total ? (a.score / a.total) : 0);
    return Math.max(acc, ratio);
  }, 0);

  return { totalAttempts, avgCorrectRatio: avg, bestCorrectRatio: best };
}

router.get("/my", authRequired, (req, res) => {
  const db = getState();
  let prog = db.progress.find(p => p.userId === req.user.id);
  if (!prog) {
    prog = { userId: req.user.id, visitedPlanets: [], points: 0, updatedAt: nowISO() };
    db.progress.push(prog);
  }

  const stats = computeStats(db, req.user.id);

  res.json({
    progress: {
      ...prog,
      visitedCount: prog.visitedPlanets?.length ?? 0,
      stats,
    }
  });
});

router.post("/visit", authRequired, async (req, res) => {
  const { planetId } = req.body || {};
  if (!planetId) return res.status(400).json({ error: "planetId wajib diisi" });

  const db = getState();
  const existsPlanet = db.planets.find(p => p.id === planetId);
  if (!existsPlanet) return res.status(400).json({ error: "planetId tidak valid" });

  let prog = db.progress.find(p => p.userId === req.user.id);
  if (!prog) {
    prog = { userId: req.user.id, visitedPlanets: [], points: 0, updatedAt: nowISO() };
    db.progress.push(prog);
  }

  if (!prog.visitedPlanets.includes(planetId)) {
    prog.visitedPlanets.push(planetId);
    prog.points = (prog.points || 0) + 5; // bonus kunjungan
  }
  prog.updatedAt = nowISO();

  await persist();
  res.json({ progress: prog });
});

/**
 * Guru: lihat progres semua siswa (role: murid).
 *
 * Catatan:
 * - Endpoint ini sengaja mengembalikan progres S I S W A, bukan progres guru.
 * - Menyertakan statistik kuis agregat agar dashboard guru bisa menampilkan ringkasan.
 * - Bisa difilter dengan query ?userId=<id> (opsional).
 */
router.get("/all", authRequired, requireRole("guru"), (req, res) => {
  const db = getState();
  const { userId } = req.query;

  // Ambil semua akun siswa
  let students = db.users.filter(u => u.role === "murid");
  if (userId) students = students.filter(u => u.id === String(userId));

  // Pastikan setiap siswa punya record progress (untuk data lama yang belum ter-init)
  const progressByUserId = new Map(db.progress.map(p => [p.userId, p]));
  let createdAny = false;
  const rows = students.map(u => {
    let prog = progressByUserId.get(u.id);
    if (!prog) {
      prog = { userId: u.id, visitedPlanets: [], points: 0, updatedAt: nowISO() };
      // Jangan lupa simpan ke state agar konsisten
      db.progress.push(prog);
      progressByUserId.set(u.id, prog);
      createdAny = true;
    }

    const visitedPlanets = Array.isArray(prog.visitedPlanets) ? prog.visitedPlanets : [];
    const stats = computeStats(db, u.id);

    return {
      userId: u.id,
      visitedPlanets,
      points: prog.points || 0,
      updatedAt: prog.updatedAt || u.createdAt || nowISO(),
      visitedCount: visitedPlanets.length,
      stats,
      student: { id: u.id, name: u.name, email: u.email },
    };
  });

  // Simpan hanya jika ada record progress baru dibuat (idempotent untuk data lama)
  if (createdAny) {
    // Tidak perlu blocking lama; kalau gagal simpan, teacher view tetap bisa jalan
    persist().catch(() => null);
  }

  // Urutkan: points desc, visitedCount desc, updatedAt desc
  const sorted = rows.sort((a, b) => {
    const pa = a.points || 0;
    const pb = b.points || 0;
    if (pb !== pa) return pb - pa;
    const va = a.visitedCount || 0;
    const vb = b.visitedCount || 0;
    if (vb !== va) return vb - va;
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });

  res.json({ progress: sorted });
});

export default router;
