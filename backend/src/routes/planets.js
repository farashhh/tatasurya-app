import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function mapPlanet(row) {
  return {
    id: row.id,
    name: row.name,
    order: row.order,
    radius: row.radius,
    distanceAU: row.distance_au,     // ✅ penting: frontend pakai distanceAU
    color: row.color,
    summary: row.summary,
  };
}

// GET /api/planets
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("planets")
      .select("id,name,order,radius,distance_au,color,summary")
      .order("order", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    // Anti 304/etag caching yang bikin data “kosong” di beberapa browser
    res.set("Cache-Control", "no-store");

    return res.json({ planets: (data || []).map(mapPlanet) });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
});

export default router;
