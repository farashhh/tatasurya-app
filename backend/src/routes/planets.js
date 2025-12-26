import { Router } from "express";
import { getState } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const db = getState();
  const planets = [...db.planets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  res.json({ planets });
});

router.get("/:id", (req, res) => {
  const db = getState();
  const planet = db.planets.find(p => p.id === req.params.id);
  if (!planet) return res.status(404).json({ error: "Planet tidak ditemukan" });
  res.json({ planet });
});

export default router;
