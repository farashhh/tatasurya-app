import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./src/routes/auth.js";
import planetRoutes from "./src/routes/planets.js";
import materialRoutes from "./src/routes/materials.js";
import questionRoutes from "./src/routes/questions.js";
import quizRoutes from "./src/routes/quiz.js";
import progressRoutes from "./src/routes/progress.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Jelajahi TataSurya API",
    status: "ok",
    docs: {
      auth: "/api/auth",
      planets: "/api/planets",
      materials: "/api/materials",
      questions: "/api/questions",
      quiz: "/api/quiz",
      progress: "/api/progress",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/planets", planetRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/progress", progressRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
