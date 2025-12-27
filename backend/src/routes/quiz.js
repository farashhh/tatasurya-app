import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

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

  const attempts = (data || []).map((a) => ({
    id: a.id,
    planetId: a.planet_id,
    score: a.score,
    total: a.total,
    createdAt: a.created_at,
    student: a.users ? { id: a.users.id, name: a.users.name, email: a.users.email } : null,
    planet: a.planets ? { id: a.planets.id, name: a.planets.name } : null,
  }));

  return res.json({ attempts });
});

export default router;
