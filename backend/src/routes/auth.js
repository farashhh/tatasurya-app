import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "name, email, password, role wajib" });
  }
  if (!["murid", "guru"].includes(role)) {
    return res.status(400).json({ message: "role harus murid/guru" });
  }

  // cek email sudah ada?
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) return res.status(409).json({ message: "Email sudah terdaftar" });

  const password_hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from("users")
    .insert([{ name, email, password_hash, role }])
    .select("id,name,email,role,created_at")
    .single();

  if (error) return res.status(400).json({ message: error.message });

  // buat progress awal
  await supabase.from("progress").insert([{ user_id: user.id }]);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({ token, user });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email & password wajib" });

  const { data: user, error } = await supabase
    .from("users")
    .select("id,name,email,role,password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) return res.status(400).json({ message: error.message });
  if (!user) return res.status(401).json({ message: "Email/password salah" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Email/password salah" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

export default router;
