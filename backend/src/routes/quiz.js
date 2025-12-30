import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function mapAttempt(row) {
  return {
    id: row.id,
    planetId: row.planet_id,
    score: row.score,
    total: row.total,
    createdAt: row.created_at,
    results: row.results ?? [],
    student: row.users ? { id: row.users.id, name: row.users.name, email: row.users.email } : null,
    planet: row.planets ? { id: row.planets.id, name: row.planets.name } : null,
  };
}

// GET /api/quiz/scores?planetId=...&userId=...
router.get("/scores", async (req, res) => {
  const { planetId, userId } = req.query;

  let q = supabase
    .from("quiz_attempts")
    .select(`
      id, user_id, planet_id, score, total, created_at,
      users:user_id (id, name, email),
      planets:planet_id (id, name)
    `)
    .order("created_at", { ascending: false });

  if (planetId) q = q.eq("planet_id", planetId);
  if (userId) q = q.eq("user_id", userId);

  const { data, error } = await q;
  if (error) return res.status(400).json({ error: error.message });

  const attempts = (data || []).map(mapAttempt);

  return res.json({ attempts });
});

// GET /api/quiz/my-scores
router.get("/my-scores", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, user_id, planet_id, score, total, results, created_at, planets:planet_id (id, name)")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const attempts = (data || []).map((row) =>
    mapAttempt({ ...row, users: null })
  );

  return res.json({ attempts });
});

async function submitQuiz(req, res) {
  try {
    const { planetId, answers } = req.body;

    if (!planetId) return res.status(400).json({ error: "planetId wajib" });
    if (!Array.isArray(answers)) return res.status(400).json({ error: "answers wajib array" });

    const { data: questions, error } = await supabase
      .from("questions")
      .select("id, correct_index, explanation")
      .eq("planet_id", planetId);

    if (error) return res.status(400).json({ error: error.message });
    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: "Soal belum tersedia untuk planet ini." });
    }

    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));

    let score = 0;
    const results = questions.map((q) => {
      const selectedIndex = answerMap.has(q.id) ? answerMap.get(q.id) : null;
      const isCorrect = selectedIndex === q.correct_index;
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        selectedIndex,
        correctIndex: q.correct_index,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = questions.length;

    const { data: attempt, error: insertError } = await supabase
      .from("quiz_attempts")
      .insert([
        {
          user_id: req.user.id,
          planet_id: planetId,
          score,
          total,
          results,
        },
      ])
      .select("id, user_id, planet_id, score, total, results, created_at")
      .single();

    if (insertError) return res.status(400).json({ error: insertError.message });

    const pointsEarned = score * 10;
    const { data: prog } = await supabase
      .from("progress")
      .select("user_id, visited_planets, points")
      .eq("user_id", req.user.id)
      .maybeSingle();

    const visited = new Set(prog?.visited_planets ?? []);
    const newPoints = (prog?.points ?? 0) + pointsEarned;

    await supabase
      .from("progress")
      .upsert([
        {
          user_id: req.user.id,
          visited_planets: Array.from(visited),
          points: newPoints,
          updated_at: new Date().toISOString(),
        },
      ]);

    return res.json({
      attempt: {
        ...mapAttempt({ ...attempt, users: null, planets: null }),
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
}

// POST /api/quiz/submit
router.post("/submit", requireAuth, submitQuiz);
// POST /api/quiz/attempt (alias)
router.post("/attempt", requireAuth, submitQuiz);
// POST /api/quiz (alias)
router.post("/", requireAuth, submitQuiz);

export default router;
