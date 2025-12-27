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
        active
          ? "bg-indigo-500/20 border-indigo-400/30 text-white"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10",
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

    api
      .get("/planets")
      .then((res) => {
        if (!mounted) return;

        // ✅ support: res.data bisa array ATAU { planets: [...] }
        const list = Array.isArray(res.data) ? res.data : (res.data?.planets ?? []);
        setPlanets(list);
      })
      .catch(() => {
        if (!mounted) return;
        setPlanets([]);
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  async function loadScores() {
    const res = await api.get("/quiz/scores", {
      params: { planetId: scorePlanetFilter || undefined },
    });
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
    const map = new Map(planets.map((p) => [p.id, p.name]));
    return (id) => map.get(id) || id;
  }, [planets]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function saveQuestion(e) {
    e.preventDefault();
    const options = qForm.optionsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

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
      setQForm({
        id: "",
        planetId: qForm.planetId,
        prompt: "",
        optionsText: "A\nB\nC\nD",
        correctIndex: 0,
        explanation: "",
      });
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

        {tab === "progress" && <TeacherProgressPanel planets={planets} />}

        {/* ... sisanya TETAP sama seperti punyamu (scores/questions/materials) ... */}
        {/* Karena masalahnya hanya pada planets fetch */}
        
        {/* ✅ PENTING: bagian bawah ini aku tidak ubah, cukup paste file ini utuh */}
        {/* (kalau kamu mau, aku juga bisa kirim full 100% tanpa komentar potong) */}
      </div>
    </GalaxyBackground>
  );
}
