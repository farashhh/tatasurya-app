import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

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
  visited.add(planetId);

  const points = (prog?.points ?? 0) + (Number(addPoints) || 0);

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
