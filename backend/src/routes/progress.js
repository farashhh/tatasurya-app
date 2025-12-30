import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function mapProgress(row, stats = null) {
  const visitedPlanets = row?.visited_planets ?? [];
  return {
    userId: row?.user_id,
    visitedPlanets,
    visitedCount: visitedPlanets.length,
    points: row?.points ?? 0,
    updatedAt: row?.updated_at ?? null,
    stats,
  };
}

function computeStats(attempts = []) {
  const totalAttempts = attempts.length;
  const avgCorrectRatio =
    totalAttempts === 0
      ? 0
      : attempts.reduce((acc, a) => acc + (a.total ? a.score / a.total : 0), 0) / totalAttempts;
  return { totalAttempts, avgCorrectRatio };
}

// GET /api/progress
router.get("/", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) return res.status(400).json({ message: error.message });
  res.json(data ?? { user_id: req.user.id, visited_planets: [], points: 0 });
});

// GET /api/progress/my
router.get("/my", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) return res.status(400).json({ message: error.message });

  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("score, total")
    .eq("user_id", req.user.id);

  if (attemptsError) return res.status(400).json({ message: attemptsError.message });

  const stats = computeStats(attempts || []);
  const fallback = { user_id: req.user.id, visited_planets: [], points: 0 };
  res.json({ progress: mapProgress(data ?? fallback, stats) });
});

// GET /api/progress/all
router.get("/all", requireAuth, async (req, res) => {
  const { data: progresses, error } = await supabase
    .from("progress")
    .select("user_id, visited_planets, points, updated_at, users:user_id (id, name, email, role)")
    .order("updated_at", { ascending: false });

  if (error) return res.status(400).json({ message: error.message });

  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("user_id, score, total");

  if (attemptsError) return res.status(400).json({ message: attemptsError.message });

  const attemptsByUser = new Map();
  (attempts || []).forEach((attempt) => {
    const list = attemptsByUser.get(attempt.user_id) ?? [];
    list.push(attempt);
    attemptsByUser.set(attempt.user_id, list);
  });

  const progress = (progresses || []).map((row) => {
    const stats = computeStats(attemptsByUser.get(row.user_id) || []);
    return {
      ...mapProgress(row, stats),
      name: row.users?.name ?? null,
      email: row.users?.email ?? null,
      role: row.users?.role ?? null,
    };
  });

  res.json({ progress });
});


// POST /api/progress/visit
router.post("/visit", requireAuth, async (req, res) => {
  const { planetId, addPoints } = req.body;
  if (!planetId) return res.status(400).json({ message: "planetId wajib" });

  const { data: prog } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  const visited = new Set(prog?.visited_planets ?? []);
  const wasVisited = visited.has(planetId);
  visited.add(planetId);

  const basePoints = Number(addPoints);
  const visitPoints = Number.isFinite(basePoints) ? basePoints : 5;
  const points = (prog?.points ?? 0) + (wasVisited ? 0 : visitPoints);


  const { data, error } = await supabase
    .from("progress")
    .upsert([{
      user_id: req.user.id,
      visited_planets: Array.from(visited),
      points,
      updated_at: new Date().toISOString()
    }])
    .select("*")
    .single();

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;
