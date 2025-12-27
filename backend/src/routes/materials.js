import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/materials/:planetId
router.get("/:planetId", async (req, res) => {
  const { planetId } = req.params;

  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("planet_id", planetId);

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;
