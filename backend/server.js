import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./src/routes/auth.js";
import planetsRoutes from "./src/routes/planets.js";
import materialsRoutes from "./src/routes/materials.js";
import questionsRoutes from "./src/routes/questions.js";
import quizRoutes from "./src/routes/quiz.js";
import progressRoutes from "./src/routes/progress.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
  credentials: true
}));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/planets", planetsRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/progress", progressRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
