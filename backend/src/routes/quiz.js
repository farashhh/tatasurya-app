import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/quiz/attempt
router.post("/attempt", requireAuth, async (req, res) => {
  const { planetId, score, total, results } = req.body;

  if (!planetId || score == null || total == null) {
    return res.status(400).json({ message: "planetId, score, total wajib" });
  }

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert([{
      user_id: req.user.id,
      planet_id: planetId,
      score,
      total,
      results: results ?? []
    }])
    .select("*")
    .single();

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;
