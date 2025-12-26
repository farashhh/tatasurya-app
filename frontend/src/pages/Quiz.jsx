import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Quiz() {
  const { planetId: planetIdParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [planets, setPlanets] = useState([]);
  const [planetId, setPlanetId] = useState(planetIdParam || "");
  const [loadingPlanets, setLoadingPlanets] = useState(true);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/planets")
      .then((res) => setPlanets(res.data.planets || []))
      .finally(() => setLoadingPlanets(false));
  }, []);

  useEffect(() => {
    if (!planetId) return;
    setLoadingQuestions(true);
    setQuestions([]);
    setAnswers({});
    setResult(null);

    api.get("/questions", { params: { planetId } })
      .then((res) => setQuestions(res.data.questions || []))
      .catch((e) => {
        setToast(e?.response?.data?.error || "Gagal memuat soal");
        setTimeout(() => setToast(""), 2500);
      })
      .finally(() => setLoadingQuestions(false));
  }, [planetId]);

  const selectedPlanet = useMemo(() => planets.find(p => p.id === planetId), [planets, planetId]);

  const answeredCount = useMemo(() => Object.values(answers).filter(v => v !== null && v !== undefined).length, [answers]);

  async function submit() {
    if (!planetId) return;
    if (questions.length === 0) {
      setToast("Belum ada soal untuk planet ini.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setSubmitting(true);
    setToast("");

    const payloadAnswers = questions.map(q => ({
      questionId: q.id,
      selectedIndex: answers[q.id] ?? null,
    }));

    try {
      const res = await api.post("/quiz/submit", { planetId, answers: payloadAnswers });
      setResult(res.data);
      if (res.data.mode === "student") {
        setToast(`Skor tersimpan. +${res.data.pointsAdded} poin`);
      } else {
        setToast("Mode preview guru: hasil tidak disimpan.");
      }
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      setToast(e?.response?.data?.error || "Gagal submit kuis");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-secondary" onClick={() => navigate("/explore")}>← Eksplorasi</button>
          <div className="badge">Tantangan (Kuis)</div>
          {selectedPlanet && <div className="badge">{selectedPlanet.name}</div>}
          <div className="flex-1" />
          <button className="btn-secondary" onClick={() => navigate("/progress")}>📊 Progres</button>
          {user?.role === "guru" && <button className="btn-secondary" onClick={() => navigate("/teacher")}>👩‍🏫 Guru</button>}
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-lg">Pilih Planet</div>
              <div className="text-white/60 text-sm mt-1">Kuis dikelompokkan berdasarkan planet.</div>

              {loadingPlanets ? (
                <div className="mt-4"><LoadingSpinner label="Memuat daftar planet..." /></div>
              ) : (
                <select className="input mt-4" value={planetId} onChange={(e) => setPlanetId(e.target.value)}>
                  <option value="">— pilih planet —</option>
                  {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}

              <div className="mt-4 text-xs text-white/60">
                Status: <b>{answeredCount}</b> / <b>{questions.length}</b> terjawab.
              </div>

              <button
                className="btn-primary w-full mt-5"
                disabled={!planetId || submitting || loadingQuestions}
                onClick={submit}
              >
                {submitting ? "Mengirim..." : "Kirim Jawaban"}
              </button>

              {toast && <div className="mt-4 text-sm text-indigo-200">{toast}</div>}
            </div>

            {result && (
              <div className="glass rounded-3xl p-6 border border-white/10">
                <div className="font-black text-lg">Hasil</div>
                <div className="mt-2">
                  <div className="text-white/60 text-sm">Skor</div>
                  <div className="text-3xl font-black">{result.attempt.score} / {result.attempt.total}</div>
                  <div className="text-white/60 text-xs mt-1">
                    {result.mode === "student" ? "Tersimpan di progres Anda." : "Preview (tidak disimpan)."}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setAnswers({});
                      setResult(null);
                    }}
                  >
                    Ulangi
                  </button>
                  <button className="btn-secondary" onClick={() => navigate(`/knowledge/${planetId}`)}>
                    📚 Materi
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm">Soal</div>
                  <div className="font-black text-xl">
                    {selectedPlanet ? `Kuis: ${selectedPlanet.name}` : "Pilih planet dulu"}
                  </div>
                </div>
                <div className="badge">{user?.role === "guru" ? "Guru (Preview)" : "Murid"}</div>
              </div>

              {loadingQuestions ? (
                <div className="mt-6"><LoadingSpinner label="Memuat soal..." /></div>
              ) : !planetId ? (
                <div className="mt-6 text-white/60 text-sm">
                  Silakan pilih planet untuk menampilkan soal kuis.
                </div>
              ) : questions.length === 0 ? (
                <div className="mt-6 text-white/60 text-sm">
                  Belum ada soal untuk planet ini. {user?.role === "guru" ? "Tambahkan soal di halaman Guru." : "Minta guru menambahkan soal."}
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {questions.map((q, idx) => {
                    const selectedIndex = answers[q.id];
                    const resultRow = result?.results?.find(r => r.questionId === q.id);
                    return (
                      <div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-start gap-3">
                          <div className="badge">{idx + 1}</div>
                          <div className="font-bold leading-relaxed">{q.prompt}</div>
                          <div className="flex-1" />
                          {resultRow && (
                            <div className={["badge", resultRow.isCorrect ? "bg-emerald-500/10 border-emerald-400/30" : "bg-rose-500/10 border-rose-400/30"].join(" ")}>
                              {resultRow.isCorrect ? "Benar" : "Salah"}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-2">
                          {q.options.map((opt, oi) => {
                            const checked = selectedIndex === oi;
                            const isCorrect = resultRow ? (oi === resultRow.correctIndex) : false;
                            const isChosenWrong = resultRow ? (checked && !resultRow.isCorrect) : false;

                            const borderClass = resultRow
                              ? isCorrect
                                ? "border-emerald-400/40 bg-emerald-500/10"
                                : isChosenWrong
                                  ? "border-rose-400/40 bg-rose-500/10"
                                  : "border-white/10 bg-white/5"
                              : "border-white/10 bg-white/5 hover:bg-white/10";

                            return (
                              <label
                                key={oi}
                                className={[
                                  "flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition",
                                  borderClass,
                                ].join(" ")}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.id}`}
                                  checked={checked}
                                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                                  disabled={!!result}
                                />
                                <div className="text-sm text-white/85">{opt}</div>
                              </label>
                            );
                          })}
                        </div>

                        {resultRow?.explanation && (
                          <div className="mt-4 text-sm text-white/70 border-t border-white/10 pt-4">
                            <div className="font-semibold">Pembahasan:</div>
                            <div className="mt-1">{resultRow.explanation}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
