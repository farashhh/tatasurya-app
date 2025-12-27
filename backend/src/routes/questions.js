import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function mapQuestion(row) {
  return {
    id: row.id,
    planetId: row.planet_id,      // ✅ frontend pakai planetId
    prompt: row.prompt,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/questions?planetId=...
router.get("/", async (req, res) => {
  const { planetId } = req.query;
  const q = supabase
    .from("questions")
    .select("id,planet_id,prompt,options,correct_index,explanation,created_at,updated_at")
    .order("created_at", { ascending: false });

  const query = planetId ? q.eq("planet_id", planetId) : q;

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ questions: (data || []).map(mapQuestion) });
});

// POST /api/questions
router.post("/", async (req, res) => {
  const { planetId, prompt, options, correctIndex, explanation } = req.body;

  if (!planetId || !prompt || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "planetId, prompt, options(min 2) wajib" });
  }

  const payload = {
    planet_id: planetId,
    prompt,
    options,
    correct_index: Number(correctIndex ?? 0),
    explanation: explanation || "",
  };

  const { data, error } = await supabase
    .from("questions")
    .insert([payload])
    .select("id,planet_id,prompt,options,correct_index,explanation,created_at,updated_at")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ question: mapQuestion(data) });
});

// PUT /api/questions/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { planetId, prompt, options, correctIndex, explanation } = req.body;

  const payload = {
    planet_id: planetId,
    prompt,
    options,
    correct_index: Number(correctIndex ?? 0),
    explanation: explanation || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("questions")
    .update(payload)
    .eq("id", id)
    .select("id,planet_id,prompt,options,correct_index,explanation,created_at,updated_at")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ question: mapQuestion(data) });
});

// DELETE /api/questions/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ ok: true });
});

export default router;
