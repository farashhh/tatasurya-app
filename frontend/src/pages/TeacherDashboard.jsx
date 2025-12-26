import React, { useEffect, useMemo, useState } from "react";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import TeacherProgressPanel from "../components/TeacherProgressPanel.jsx";
import api from "../api/client.js";

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-xl font-semibold text-sm border transition",
        active ? "bg-indigo-500/20 border-indigo-400/30 text-white" : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function TeacherDashboard() {
  const [tab, setTab] = useState("scores");

  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scores
  const [scores, setScores] = useState([]);
  const [scorePlanetFilter, setScorePlanetFilter] = useState("");

  // Questions
  const [questions, setQuestions] = useState([]);
  const [qForm, setQForm] = useState({
    id: "",
    planetId: "",
    prompt: "",
    optionsText: "A\nB\nC\nD",
    correctIndex: 0,
    explanation: "",
  });

  // Materials
  const [materials, setMaterials] = useState([]);
  const [mForm, setMForm] = useState({
    id: "",
    planetId: "",
    title: "",
    content: "",
  });

  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.get("/planets")
      .then((res) => {
        if (!mounted) return;
        setPlanets(res.data.planets || []);
      })
      .finally(() => setLoading(false));

    return () => { mounted = false; };
  }, []);

  async function loadScores() {
    const res = await api.get("/quiz/scores", { params: { planetId: scorePlanetFilter || undefined } });
    setScores(res.data.attempts || []);
  }
  async function loadQuestions() {
    const res = await api.get("/questions");
    setQuestions(res.data.questions || []);
  }
  async function loadMaterials() {
    const res = await api.get("/materials");
    setMaterials(res.data.materials || []);
  }

  useEffect(() => {
    if (!loading && tab === "scores") loadScores().catch(() => null);
    if (!loading && tab === "questions") loadQuestions().catch(() => null);
    if (!loading && tab === "materials") loadMaterials().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loading]);

  useEffect(() => {
    if (tab === "scores") loadScores().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorePlanetFilter]);

  const planetName = useMemo(() => {
    const map = new Map(planets.map(p => [p.id, p.name]));
    return (id) => map.get(id) || id;
  }, [planets]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveQuestion(e) {
    e.preventDefault();
    const options = qForm.optionsText.split("\n").map(s => s.trim()).filter(Boolean);
    if (!qForm.planetId || !qForm.prompt || options.length < 2) {
      showToast("planet, prompt, dan minimal 2 opsi wajib diisi");
      return;
    }
    const payload = {
      planetId: qForm.planetId,
      prompt: qForm.prompt,
      options,
      correctIndex: Number(qForm.correctIndex),
      explanation: qForm.explanation,
    };
    try {
      if (qForm.id) {
        await api.put(`/questions/${qForm.id}`, payload);
        showToast("Soal berhasil diperbarui");
      } else {
        await api.post(`/questions`, payload);
        showToast("Soal berhasil ditambahkan");
      }
      setQForm({ id: "", planetId: qForm.planetId, prompt: "", optionsText: "A\nB\nC\nD", correctIndex: 0, explanation: "" });
      await loadQuestions();
    } catch (e2) {
      showToast(e2?.response?.data?.error || "Gagal menyimpan soal");
    }
  }

  async function editQuestion(q) {
    setTab("questions");
    setQForm({
      id: q.id,
      planetId: q.planetId,
      prompt: q.prompt,
      optionsText: (q.options || []).join("\n"),
      correctIndex: q.correctIndex ?? 0,
      explanation: q.explanation || "",
    });
  }

  async function deleteQuestion(id) {
    if (!confirm("Hapus soal ini?")) return;
    try {
      await api.delete(`/questions/${id}`);
      showToast("Soal dihapus");
      await loadQuestions();
    } catch (e) {
      showToast(e?.response?.data?.error || "Gagal menghapus soal");
    }
  }

  async function saveMaterial(e) {
    e.preventDefault();
    if (!mForm.planetId || !mForm.title || !mForm.content) {
      showToast("planet, judul, dan konten wajib diisi");
      return;
    }
    const payload = { planetId: mForm.planetId, title: mForm.title, content: mForm.content };
    try {
      if (mForm.id) {
        await api.put(`/materials/${mForm.id}`, payload);
        showToast("Materi berhasil diperbarui");
      } else {
        await api.post(`/materials`, payload);
        showToast("Materi berhasil ditambahkan");
      }
      setMForm({ id: "", planetId: mForm.planetId, title: "", content: "" });
      await loadMaterials();
    } catch (e2) {
      showToast(e2?.response?.data?.error || "Gagal menyimpan materi");
    }
  }

  function editMaterial(m) {
    setTab("materials");
    setMForm({ id: m.id, planetId: m.planetId, title: m.title, content: m.content });
  }

  async function deleteMaterial(id) {
    if (!confirm("Hapus materi ini?")) return;
    try {
      await api.delete(`/materials/${id}`);
      showToast("Materi dihapus");
      await loadMaterials();
    } catch (e) {
      showToast(e?.response?.data?.error || "Gagal menghapus materi");
    }
  }

  if (loading) {
    return (
      <GalaxyBackground>
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="glass rounded-3xl p-8 flex items-center justify-center">
            <LoadingSpinner label="Memuat dashboard guru..." />
          </div>
        </div>
      </GalaxyBackground>
    );
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-3">
          <div className="badge">👩‍🏫 Guru</div>
          <div className="badge">Kelola Kuis & Materi</div>
          <div className="flex-1" />
          {toast && <div className="text-sm text-indigo-200">{toast}</div>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <TabButton active={tab === "scores"} onClick={() => setTab("scores")}>Nilai Siswa</TabButton>
          <TabButton active={tab === "progress"} onClick={() => setTab("progress")}>Progres Siswa</TabButton>
          <TabButton active={tab === "questions"} onClick={() => { setTab("questions"); loadQuestions().catch(()=>null); }}>Tambah Soal</TabButton>
          <TabButton active={tab === "materials"} onClick={() => { setTab("materials"); loadMaterials().catch(()=>null); }}>Tambah Materi</TabButton>
        </div>

        {tab === "progress" && (
          <TeacherProgressPanel planets={planets} />
        )}

        {tab === "scores" && (
          <div className="mt-6 glass rounded-3xl p-6 border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="text-white/60 text-sm">Rekap Nilai</div>
                <div className="font-black text-xl">Nilai Kuis Siswa</div>
              </div>
              <div className="flex-1" />
              <select className="input max-w-xs" value={scorePlanetFilter} onChange={(e) => setScorePlanetFilter(e.target.value)}>
                <option value="">Semua planet</option>
                {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn-secondary" onClick={() => loadScores().catch(()=>null)}>Refresh</button>
            </div>

            {scores.length === 0 ? (
              <div className="mt-6 text-white/60 text-sm">Belum ada nilai kuis siswa.</div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-white/70">
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 pr-3">Tanggal</th>
                      <th className="text-left py-3 pr-3">Siswa</th>
                      <th className="text-left py-3 pr-3">Planet</th>
                      <th className="text-left py-3 pr-3">Skor</th>
                      <th className="text-left py-3 pr-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((a) => (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-3 pr-3 text-white/70">{new Date(a.createdAt).toLocaleString("id-ID")}</td>
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{a.student?.name}</div>
                          <div className="text-xs text-white/50">{a.student?.email}</div>
                        </td>
                        <td className="py-3 pr-3 font-semibold">{a.planet?.name || planetName(a.planetId)}</td>
                        <td className="py-3 pr-3">
                          <span className="badge">{a.score}/{a.total}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <button className="btn-secondary" onClick={() => editQuestion(
                            // Quick jump: pick first question for that planet (if exists)
                            questions.find(q => q.planetId === a.planetId) || { id:"", planetId:a.planetId, prompt:"", options:["A","B"], correctIndex:0, explanation:"" }
                          )}>
                            Tambah/cek soal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-xs text-white/50 mt-3">
                  Catatan: tabel ini hanya menampilkan akun dengan role <b>murid</b>.
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "questions" && (
          <div className="mt-6 grid lg:grid-cols-2 gap-6 items-start">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-xl">{qForm.id ? "Edit Soal" : "Tambah Soal"}</div>
              <form className="mt-5 space-y-4" onSubmit={saveQuestion}>
                <div>
                  <label className="text-sm text-white/70">Planet</label>
                  <select className="input mt-2" value={qForm.planetId} onChange={(e) => setQForm(prev => ({ ...prev, planetId: e.target.value }))}>
                    <option value="">— pilih planet —</option>
                    {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/70">Pertanyaan</label>
                  <textarea className="input mt-2 h-28" value={qForm.prompt} onChange={(e) => setQForm(prev => ({ ...prev, prompt: e.target.value }))} />
                </div>

                <div>
                  <label className="text-sm text-white/70">Opsi Jawaban (1 baris = 1 opsi)</label>
                  <textarea className="input mt-2 h-28 font-mono text-sm" value={qForm.optionsText} onChange={(e) => setQForm(prev => ({ ...prev, optionsText: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/70">Index Jawaban Benar</label>
                    <input className="input mt-2" type="number" min="0" value={qForm.correctIndex} onChange={(e) => setQForm(prev => ({ ...prev, correctIndex: e.target.value }))} />
                    <div className="text-xs text-white/60 mt-1">0 = opsi pertama, 1 = opsi kedua, dst.</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70">Pembahasan (opsional)</label>
                    <textarea className="input mt-2 h-24" value={qForm.explanation} onChange={(e) => setQForm(prev => ({ ...prev, explanation: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="btn-primary" type="submit">Simpan</button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setQForm({ id: "", planetId: qForm.planetId, prompt: "", optionsText: "A\nB\nC\nD", correctIndex: 0, explanation: "" })}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="font-black text-xl">Daftar Soal</div>
                <button className="btn-secondary" onClick={() => loadQuestions().catch(()=>null)}>Refresh</button>
              </div>

              {questions.length === 0 ? (
                <div className="mt-6 text-white/60 text-sm">Belum ada soal.</div>
              ) : (
                <div className="mt-5 space-y-3 max-h-[70vh] overflow-auto pr-1">
                  {questions.map(q => (
                    <div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="badge">{planetName(q.planetId)}</div>
                        <div className="font-semibold leading-relaxed">{q.prompt}</div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {(q.options || []).map((o, idx) => (
                          <div key={idx} className={["text-sm rounded-xl px-3 py-2 border", idx === q.correctIndex ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-white/5"].join(" ")}>
                            <span className="text-white/60 mr-2">{idx}.</span> {o}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button className="btn-secondary" onClick={() => editQuestion(q)}>Edit</button>
                        <button className="btn-secondary" onClick={() => deleteQuestion(q.id)}>Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "materials" && (
          <div className="mt-6 grid lg:grid-cols-2 gap-6 items-start">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-xl">{mForm.id ? "Edit Materi" : "Tambah Materi"}</div>
              <form className="mt-5 space-y-4" onSubmit={saveMaterial}>
                <div>
                  <label className="text-sm text-white/70">Planet</label>
                  <select className="input mt-2" value={mForm.planetId} onChange={(e) => setMForm(prev => ({ ...prev, planetId: e.target.value }))}>
                    <option value="">— pilih planet —</option>
                    {planets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-white/70">Judul</label>
                  <input className="input mt-2" value={mForm.title} onChange={(e) => setMForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>

                <div>
                  <label className="text-sm text-white/70">Konten</label>
                  <textarea className="input mt-2 h-40" value={mForm.content} onChange={(e) => setMForm(prev => ({ ...prev, content: e.target.value }))} />
                </div>

                <div className="flex gap-3">
                  <button className="btn-primary" type="submit">Simpan</button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setMForm({ id: "", planetId: mForm.planetId, title: "", content: "" })}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="font-black text-xl">Daftar Materi</div>
                <button className="btn-secondary" onClick={() => loadMaterials().catch(()=>null)}>Refresh</button>
              </div>

              {materials.length === 0 ? (
                <div className="mt-6 text-white/60 text-sm">Belum ada materi.</div>
              ) : (
                <div className="mt-5 space-y-3 max-h-[70vh] overflow-auto pr-1">
                  {materials.map(m => (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="badge">{planetName(m.planetId)}</div>
                        <div>
                          <div className="font-semibold">{m.title}</div>
                          <div className="text-xs text-white/50 mt-1">
                            Update: {new Date(m.updatedAt || m.createdAt).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-white/75 mt-3 leading-relaxed">
                        {m.content}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button className="btn-secondary" onClick={() => editMaterial(m)}>Edit</button>
                        <button className="btn-secondary" onClick={() => deleteMaterial(m.id)}>Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GalaxyBackground>
  );
}
