import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Quiz() {
  const navigate = useNavigate();
  const params = useParams();

  // kalau route kamu /quiz/:planetId
  const initialPlanetId = params.planetId || "";

  const [planets, setPlanets] = useState([]);
  const [planetId, setPlanetId] = useState(initialPlanetId);

  const [loadingPlanets, setLoadingPlanets] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [toast, setToast] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score,total,results:[] }

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  // 1) Fetch planets
  useEffect(() => {
    let mounted = true;
    setLoadingPlanets(true);

    api
      .get("/planets")
      .then((res) => {
        // Support:
        // A) res.data = [{...}, {...}]
        // B) res.data = { planets: [...] }
        const list = Array.isArray(res.data) ? res.data : res.data?.planets ?? [];
        if (!mounted) return;
        setPlanets(list);
      })
      .catch(() => {
        if (!mounted) return;
        setPlanets([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingPlanets(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2) Fetch questions when planetId changes
  useEffect(() => {
    if (!planetId) {
      setQuestions([]);
      setAnswers({});
      setResult(null);
      return;
    }

    let mounted = true;
    setLoadingQuestions(true);
    setResult(null);
    setAnswers({});

    async function loadQuestions() {
      try {
        // Coba beberapa kemungkinan endpoint supaya “kebal”
        // 1) GET /questions?planetId=earth
        // 2) GET /questions/earth
        // 3) GET /quiz/questions?planetId=earth
        const tries = [
          () => api.get("/questions", { params: { planetId } }),
          () => api.get(`/questions/${planetId}`),
          () => api.get("/quiz/questions", { params: { planetId } }),
        ];

        let res = null;
        let lastErr = null;

        for (const fn of tries) {
          try {
            res = await fn();
            break;
          } catch (e) {
            lastErr = e;
          }
        }

        if (!res) throw lastErr || new Error("Gagal memuat soal");

        // Support:
        // A) res.data = [{...}]
        // B) res.data = { questions: [...] }
        const list = Array.isArray(res.data) ? res.data : res.data?.questions ?? [];

        if (!mounted) return;
        setQuestions(list);
      } catch (e) {
        if (!mounted) return;
        setQuestions([]);
        setToast(e?.response?.data?.message || e?.response?.data?.error || "Gagal memuat soal");
        setTimeout(() => setToast(""), 2500);
      } finally {
        if (!mounted) return;
        setLoadingQuestions(false);
      }
    }

    loadQuestions();

    return () => {
      mounted = false;
    };
  }, [planetId]);

  function onPickPlanet(id) {
    setPlanetId(id);
    // kalau kamu mau URL berubah juga:
    // navigate(`/quiz/${id}`);
  }

  function setAnswer(questionId, selectedIndex) {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  }

  async function submit() {
    if (!planetId) return;

    if (questions.length === 0) {
      setToast("Soal belum tersedia untuk planet ini.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    // optional: wajib semua dijawab
    if (answeredCount < questions.length) {
      setToast("Jawab semua pertanyaan dulu ya 🙂");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        planetId,
        answers: questions.map((q) => ({
          questionId: q.id,
          selectedIndex: answers[q.id],
        })),
      };

      // Coba beberapa kemungkinan endpoint submit
      // 1) POST /quiz/submit
      // 2) POST /quiz
      // 3) POST /quiz/attempt
      const tries = [
        () => api.post("/quiz/submit", payload),
        () => api.post("/quiz", payload),
        () => api.post("/quiz/attempt", payload),
      ];

      let res = null;
      let lastErr = null;

      for (const fn of tries) {
        try {
          res = await fn();
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!res) throw lastErr || new Error("Gagal submit");

      // Support response:
      // A) { score, total, results: [...] }
      // B) { attempt: { score,total,results } }
      const data = res.data?.attempt ?? res.data;

      setResult({
        score: data?.score ?? 0,
        total: data?.total ?? questions.length,
        results: data?.results ?? [],
      });

      setToast("✅ Jawaban terkirim!");
      setTimeout(() => setToast(""), 2000);
    } catch (e) {
      setToast(e?.response?.data?.message || e?.response?.data?.error || "Gagal mengirim jawaban");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSubmitting(false);
    }
  }

  function resetQuiz() {
    setAnswers({});
    setResult(null);
  }

  const selectedPlanet = useMemo(() => {
    return planets.find((p) => p.id === planetId) || null;
  }, [planets, planetId]);

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="font-black text-2xl">Kuis</div>
          <div className="badge">Interaktif</div>
          <div className="flex-1" />
          <button className="btn-secondary" onClick={() => navigate("/explore")}>
            ⟵ Kembali
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {/* LEFT: Panel pilih planet */}
          <div className="glass rounded-3xl p-6 border border-white/10 lg:col-span-1">
            <div className="font-black text-xl">Pilih Planet</div>
            <div className="text-white/60 text-sm mt-1">Kuis dikelompokkan berdasarkan planet.</div>

            <div className="mt-4">
              {loadingPlanets ? (
                <LoadingSpinner label="Memuat planet..." />
              ) : (
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none"
                  value={planetId}
                  onChange={(e) => onPickPlanet(e.target.value)}
                >
                  <option value="">— pilih planet —</option>
                  {planets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-4 text-white/70 text-sm">
              Status: <b>{answeredCount}</b> / <b>{questions.length}</b> terjawab.
            </div>

            <div className="mt-5 flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={submit}
                disabled={submitting || !planetId || loadingQuestions || questions.length === 0}
              >
                {submitting ? "Mengirim..." : "Kirim Jawaban"}
              </button>
              <button className="btn-secondary" onClick={resetQuiz} disabled={!planetId || loadingQuestions}>
                Reset
              </button>
            </div>

            {selectedPlanet && (
              <div className="mt-5 glass rounded-2xl p-4 border border-white/10">
                <div className="font-bold">{selectedPlanet.name}</div>
                <div className="text-white/70 text-sm mt-1">{selectedPlanet.summary}</div>
              </div>
            )}

            {toast && (
              <div className="mt-4 glass rounded-2xl p-4 border border-white/10">
                <div className="text-sm">{toast}</div>
              </div>
            )}
          </div>

          {/* RIGHT: Soal */}
          <div className="glass rounded-3xl p-6 border border-white/10 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="font-black text-xl">Pertanyaan</div>
              <div className="badge">Pilih Opsi</div>
            </div>

            <div className="text-white/60 text-sm mt-1">
              {planetId ? "Jawab semua pertanyaan lalu klik Kirim Jawaban." : "Silakan pilih planet terlebih dahulu."}
            </div>

            <div className="mt-5">
              {loadingQuestions ? (
                <div className="py-10 flex items-center justify-center">
                  <LoadingSpinner label="Memuat soal..." />
                </div>
              ) : !planetId ? (
                <div className="py-10 text-white/60 text-sm">Belum memilih planet.</div>
              ) : questions.length === 0 ? (
                <div className="py-10 text-white/60 text-sm">
                  Soal untuk planet ini belum tersedia.
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const picked = answers[q.id];
                    const check = result?.results?.find((r) => r.questionId === q.id);

                    return (
                      <div key={q.id} className="glass rounded-2xl p-5 border border-white/10">
                        <div className="flex items-start gap-3">
                          <div className="badge">{idx + 1}</div>
                          <div className="font-bold leading-snug">{q.prompt}</div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {(q.options || []).map((opt, optIdx) => {
                            const isPicked = picked === optIdx;

                            // highlight kalau sudah submit
                            const isCorrect = check && optIdx === check.correctIndex;
                            const isWrongPicked = check && isPicked && !check.isCorrect;

                            return (
                              <label
                                key={optIdx}
                                className={[
                                  "flex items-center gap-3 rounded-2xl px-4 py-3 border cursor-pointer transition",
                                  "bg-white/5 border-white/10 hover:border-white/20",
                                  isPicked ? "border-indigo-400/60" : "",
                                  isCorrect ? "border-emerald-400/60" : "",
                                  isWrongPicked ? "border-rose-400/60" : "",
                                ].join(" ")}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  value={optIdx}
                                  checked={isPicked || false}
                                  onChange={() => setAnswer(q.id, optIdx)}
                                  disabled={!!result} // kunci jawaban setelah submit
                                />
                                <span className="text-white/80">{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                        {/* setelah submit tampilkan hasil per-soal */}
                        {check && (
                          <div className="mt-4 text-sm">
                            {check.isCorrect ? (
                              <div className="text-emerald-300 font-bold">✅ Benar</div>
                            ) : (
                              <div className="text-rose-300 font-bold">❌ Salah</div>
                            )}
                            {check.explanation && (
                              <div className="text-white/70 mt-1">{check.explanation}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Result summary */}
            {result && (
              <div className="mt-6 glass rounded-2xl p-5 border border-white/10">
                <div className="font-black text-lg">Hasil Kuis</div>
                <div className="text-white/70 mt-1">
                  Skor: <b>{result.score}</b> / <b>{result.total}</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
