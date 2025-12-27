import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function toClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    planetId: row.planet_id,
    prompt: row.prompt,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/questions?planetId=mercury
router.get("/", async (req, res) => {
  try {
    const planetId = req.query.planetId;

    let q = supabase
      .from("questions")
      .select("id, planet_id, prompt, options, correct_index, explanation, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (planetId) q = q.eq("planet_id", planetId);

    const { data, error } = await q;
    if (error) return res.status(400).json({ error: error.message });

    return res.json({ questions: (data || []).map(toClient) });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/questions
router.post("/", async (req, res) => {
  try {
    const { planetId, prompt, options, correctIndex, explanation } = req.body;

    if (!planetId || !prompt || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "planetId, prompt, dan minimal 2 options wajib" });
    }

    const payload = {
      planet_id: planetId,
      prompt,
      options,
      correct_index: Number(correctIndex ?? 0),
      explanation: explanation || null,
      // ⚠️ PENTING: JANGAN kirim id sama sekali di sini
      // id: null  <-- ini sumber error kamu
    };

    const { data, error } = await supabase
      .from("questions")
      .insert([payload])
      .select("id, planet_id, prompt, options, correct_index, explanation, created_at, updated_at")
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ question: toClient(data) });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/questions/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { planetId, prompt, options, correctIndex, explanation } = req.body;

    const payload = {};
    if (planetId !== undefined) payload.planet_id = planetId;
    if (prompt !== undefined) payload.prompt = prompt;
    if (options !== undefined) payload.options = options;
    if (correctIndex !== undefined) payload.correct_index = Number(correctIndex);
    if (explanation !== undefined) payload.explanation = explanation || null;

    const { data, error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", id)
      .select("id, planet_id, prompt, options, correct_index, explanation, created_at, updated_at")
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ question: toClient(data) });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/questions/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
