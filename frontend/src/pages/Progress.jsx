import React, { useEffect, useMemo, useState } from "react";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PlanetCard from "../components/PlanetCard.jsx";
import TeacherProgressPanel from "../components/TeacherProgressPanel.jsx";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function Progress() {
  const { user } = useAuth();
  const isGuru = user?.role === "guru";

  // Mode guru: tampilkan monitoring progres siswa (bukan progres guru)
  if (isGuru) {
    return (
      <GalaxyBackground>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="badge">👩‍🏫 Guru</div>
            <div className="badge">Progres Siswa</div>
            <div className="badge">Auto-update</div>
          </div>

          <TeacherProgressPanel />
        </div>
      </GalaxyBackground>
    );
  }

  const [planets, setPlanets] = useState([]);
  const [progress, setProgress] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.get("/planets"),
      api.get("/progress/my"),
      api.get("/quiz/my-scores"),
    ])
      .then(([pRes, progRes, aRes]) => {
        if (!mounted) return;
        setPlanets(pRes.data.planets || []);
        setProgress(progRes.data.progress);
        setAttempts(aRes.data.attempts || []);
      })
      .catch((e) => {
        setToast(e?.response?.data?.error || "Gagal memuat progres");
        setTimeout(() => setToast(""), 2500);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  const visitedSet = useMemo(() => new Set(progress?.visitedPlanets || []), [progress]);

  const chartData = useMemo(() => {
    const sorted = [...attempts].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const labels = sorted.map(a => new Date(a.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }));
    const values = sorted.map(a => (a.total ? Math.round((a.score / a.total) * 100) : 0));
    return {
      labels,
      datasets: [
        {
          label: "Skor (%)",
          data: values,
          tension: 0.35,
        }
      ]
    };
  }, [attempts]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
    },
  }), []);

  if (loading) {
    return (
      <GalaxyBackground>
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="glass rounded-3xl p-8 flex items-center justify-center">
            <LoadingSpinner label="Memuat progres..." />
          </div>
        </div>
      </GalaxyBackground>
    );
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-3">
          <div className="badge">Progres</div>
          <div className="badge">Peta Kunjungan</div>
          <div className="badge">Grafik Belajar</div>
        </div>

        {toast && (
          <div className="mt-5 glass rounded-2xl p-4 border border-white/10 text-sm">{toast}</div>
        )}

        <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-lg">Ringkasan</div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/60">Planet Dikunjungi</div>
                  <div className="text-2xl font-black">{progress?.visitedCount ?? 0}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/60">Poin</div>
                  <div className="text-2xl font-black">{progress?.points ?? 0}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/60">Total Kuis</div>
                  <div className="text-2xl font-black">{progress?.stats?.totalAttempts ?? 0}</div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-white/60">Rata-rata</div>
                  <div className="text-2xl font-black">{Math.round((progress?.stats?.avgCorrectRatio ?? 0) * 100)}%</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-white/70">
                Poin bertambah dari kunjungan planet (+5) dan jawaban benar kuis (+10 per soal benar).
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-lg">Kuis Terakhir</div>
              {attempts.length === 0 ? (
                <div className="mt-3 text-white/60 text-sm">Belum ada attempt kuis.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {attempts.slice(0, 5).map(a => (
                    <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-bold">{a.planetId}</div>
                      <div className="text-white/70 text-sm mt-1">{a.score}/{a.total}</div>
                      <div className="text-white/50 text-xs mt-2">{new Date(a.createdAt).toLocaleString("id-ID")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm">Peta Planet</div>
                  <div className="font-black text-xl">Planet yang sudah dikunjungi</div>
                </div>
                <div className="badge">{visitedSet.size}/{planets.length}</div>
              </div>

              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {planets.map(p => (
                  <PlanetCard key={p.id} planet={p} visited={visitedSet.has(p.id)} />
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm">Grafik</div>
                  <div className="font-black text-xl">Perkembangan skor kuis</div>
                </div>
                <div className="badge">{attempts.length} attempt</div>
              </div>

              {attempts.length === 0 ? (
                <div className="mt-6 text-white/60 text-sm">
                  Kerjakan kuis minimal sekali agar grafik muncul.
                </div>
              ) : (
                <div className="mt-6">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
