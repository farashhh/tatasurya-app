import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

// GET /api/planets
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("planets")
    .select("*")
    .order("order", { ascending: true });

  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

export default router;
