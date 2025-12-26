import jwt from "jsonwebtoken";
import { getState } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getState();
    const user = db.users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
