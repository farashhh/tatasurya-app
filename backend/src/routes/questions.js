import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/questions/:planetId
router.get("/:planetId", async (req, res) => {
  const { planetId } = req.params;

  const { data, error } = await supabase
    .from("questions")
    .select("id,planet_id,prompt,options,correct_index,explanation")
    .eq("planet_id", planetId);

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;
