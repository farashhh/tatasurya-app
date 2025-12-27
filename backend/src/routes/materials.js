import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function mapMaterial(row) {
  return {
    id: row.id,
    planetId: row.planet_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/materials?planetId=...
router.get("/", async (req, res) => {
  const { planetId } = req.query;

  const q = supabase
    .from("materials")
    .select("id,planet_id,title,content,created_at,updated_at")
    .order("updated_at", { ascending: false });

  const query = planetId ? q.eq("planet_id", planetId) : q;

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ materials: (data || []).map(mapMaterial) });
});

// POST /api/materials
router.post("/", async (req, res) => {
  const { planetId, title, content } = req.body;

  if (!planetId || !title || !content) {
    return res.status(400).json({ error: "planetId, title, content wajib" });
  }

  const payload = { planet_id: planetId, title, content };

  const { data, error } = await supabase
    .from("materials")
    .insert([payload])
    .select("id,planet_id,title,content,created_at,updated_at")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ material: mapMaterial(data) });
});

// PUT /api/materials/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { planetId, title, content } = req.body;

  const payload = {
    planet_id: planetId,
    title,
    content,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("materials")
    .update(payload)
    .eq("id", id)
    .select("id,planet_id,title,content,created_at,updated_at")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ material: mapMaterial(data) });
});

// DELETE /api/materials/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });

  return res.json({ ok: true });
});

export default router;
