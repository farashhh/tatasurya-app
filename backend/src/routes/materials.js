import { Router } from "express";
import { getState, persist, uuid, nowISO } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = Router();

// Public / authenticated: get materials
router.get("/", (req, res) => {
  const { planetId } = req.query;
  const db = getState();
  let items = db.materials;
  if (planetId) items = items.filter(m => m.planetId === planetId);
  items = [...items].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  res.json({ materials: items });
});

router.get("/:id", (req, res) => {
  const db = getState();
  const item = db.materials.find(m => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Materi tidak ditemukan" });
  res.json({ material: item });
});

// Teacher CRUD
router.post("/", authRequired, requireRole("guru"), async (req, res) => {
  const { planetId, title, content } = req.body || {};
  if (!planetId || !title || !content) {
    return res.status(400).json({ error: "planetId, title, content wajib diisi" });
  }

  const db = getState();
  const existsPlanet = db.planets.find(p => p.id === planetId);
  if (!existsPlanet) return res.status(400).json({ error: "planetId tidak valid" });

  const material = {
    id: uuid(),
    planetId,
    title: String(title),
    content: String(content),
    createdBy: req.user.id,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  db.materials.push(material);
  await persist();

  res.status(201).json({ material });
});

router.put("/:id", authRequired, requireRole("guru"), async (req, res) => {
  const { title, content } = req.body || {};
  const db = getState();
  const idx = db.materials.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Materi tidak ditemukan" });

  if (title != null) db.materials[idx].title = String(title);
  if (content != null) db.materials[idx].content = String(content);
  db.materials[idx].updatedAt = nowISO();

  await persist();
  res.json({ material: db.materials[idx] });
});

router.delete("/:id", authRequired, requireRole("guru"), async (req, res) => {
  const db = getState();
  const before = db.materials.length;
  db.materials = db.materials.filter(m => m.id !== req.params.id);
  if (db.materials.length === before) return res.status(404).json({ error: "Materi tidak ditemukan" });
  await persist();
  res.json({ ok: true });
});

export default router;
