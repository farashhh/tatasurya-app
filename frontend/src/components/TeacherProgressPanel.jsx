import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client.js";
import PlanetCard from "./PlanetCard.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

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

function MiniStat({ label, value }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

/**
 * Panel progres siswa untuk guru.
 * - Memakai /progress/all (guru-only)
 * - Memakai /quiz/scores?userId=... (guru-only)
 * - Auto-refresh via polling (default 5 detik)
 */
export default function TeacherProgressPanel({ planets: planetsProp, pollMs = 5000 }) {
  const [planets, setPlanets] = useState(planetsProp || []);
  const [rows, setRows] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [attempts, setAttempts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    if (Array.isArray(planetsProp) && planetsProp.length) setPlanets(planetsProp);
  }, [planetsProp]);

  async function loadStudentsProgress() {
    const res = await api.get("/progress/all");
    const list = res.data.progress || [];
    setRows(list);

    // Set default selection / keep selection if still exists
    setSelectedStudentId((prev) => {
      if (prev && list.some((r) => r.userId === prev)) return prev;
      return list[0]?.userId || "";
    });

    lastFetchAtRef.current = Date.now();
  }

  async function loadStudentAttempts(userId) {
    if (!userId) {
      setAttempts([]);
      return;
    }
    const res = await api.get("/quiz/scores", { params: { userId } });
    setAttempts(res.data.attempts || []);
  }

  async function initialLoad() {
    setLoading(true);
    try {
      if (!Array.isArray(planetsProp) || planetsProp.length === 0) {
        const pRes = await api.get("/planets");
        setPlanets(pRes.data.planets || []);
      }
      await loadStudentsProgress();
    } catch (e) {
      setToast(e?.response?.data?.error || "Gagal memuat progres siswa");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Ketika siswa yang dipilih berubah, muat attempt kuisnya
    loadStudentAttempts(selectedStudentId).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      // Avoid overlapping too often
      loadStudentsProgress().catch(() => null);
      if (selectedStudentId) loadStudentAttempts(selectedStudentId).catch(() => null);
    }, Math.max(2500, Number(pollMs) || 5000));
    return () => clearInterval(t);
  }, [autoRefresh, pollMs, selectedStudentId]);

  const selected = useMemo(
    () => rows.find((r) => r.userId === selectedStudentId) || null,
    [rows, selectedStudentId]
  );

  const visitedSet = useMemo(() => new Set(selected?.visitedPlanets || []), [selected]);

  const chartData = useMemo(() => {
    const sorted = [...attempts].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const labels = sorted.map((a) =>
      new Date(a.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    );
    const values = sorted.map((a) => (a.total ? Math.round((a.score / a.total) * 100) : 0));
    return {
      labels,
      datasets: [
        {
          label: "Skor (%)",
          data: values,
          tension: 0.35,
        },
      ],
    };
  }, [attempts]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } },
      },
    }),
    []
  );

  if (loading) {
    return (
      <div className="glass rounded-3xl p-8 flex items-center justify-center border border-white/10 mt-6">
        <LoadingSpinner label="Memuat progres siswa..." />
      </div>
    );
  }

  return (
    <div className="mt-6 glass rounded-3xl p-6 border border-white/10">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="text-white/60 text-sm">Monitoring</div>
          <div className="font-black text-xl">Progres Siswa</div>
        </div>

        <div className="flex-1" />

        <label className="text-xs text-white/60 flex items-center gap-2 select-none">
          <input
            type="checkbox"
            className="accent-indigo-500"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh ({Math.round(Math.max(2500, Number(pollMs) || 5000) / 1000)} dtk)
        </label>

        <select
          className="input max-w-xs"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={rows.length === 0}
        >
          {rows.length === 0 ? (
            <option value="">(Belum ada siswa)</option>
          ) : (
            rows.map((r) => (
              <option key={r.userId} value={r.userId}>
                {r.student?.name || r.userId}
              </option>
            ))
          )}
        </select>

        <button
          className="btn-secondary"
          onClick={() => {
            loadStudentsProgress().catch(() => null);
            if (selectedStudentId) loadStudentAttempts(selectedStudentId).catch(() => null);
          }}
        >
          Refresh
        </button>
      </div>

      {toast && <div className="mt-4 text-sm text-indigo-200">{toast}</div>}

      {rows.length === 0 ? (
        <div className="mt-6 text-white/60 text-sm">
          Belum ada data progres siswa. Pastikan sudah ada akun dengan role <b>murid</b>.
        </div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
          {/* LEFT */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-lg">Ringkasan</div>
              {!selected ? (
                <div className="mt-3 text-white/60 text-sm">Pilih siswa untuk melihat detail.</div>
              ) : (
                <>
                  <div className="mt-2 text-sm text-white/70">
                    <div className="font-semibold text-white">{selected.student?.name}</div>
                    <div className="text-xs text-white/50">{selected.student?.email}</div>
                    <div className="text-xs text-white/50 mt-1">
                      Terakhir aktivitas: {new Date(selected.updatedAt).toLocaleString("id-ID")}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniStat label="Planet Dikunjungi" value={selected.visitedCount ?? (selected.visitedPlanets?.length ?? 0)} />
                    <MiniStat label="Poin" value={selected.points ?? 0} />
                    <MiniStat label="Total Kuis" value={selected.stats?.totalAttempts ?? 0} />
                    <MiniStat label="Rata-rata" value={`${Math.round((selected.stats?.avgCorrectRatio ?? 0) * 100)}%`} />
                  </div>
                </>
              )}
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="font-black text-lg">Daftar Siswa</div>
                <div className="badge">{rows.length}</div>
              </div>

              <div className="mt-4 space-y-2 max-h-[45vh] overflow-auto pr-1">
                {rows.map((r) => {
                  const active = r.userId === selectedStudentId;
                  return (
                    <button
                      key={r.userId}
                      onClick={() => setSelectedStudentId(r.userId)}
                      className={[
                        "w-full text-left rounded-2xl p-4 border transition",
                        active
                          ? "bg-indigo-500/15 border-indigo-400/30"
                          : "bg-white/5 border-white/10 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="badge">{r.visitedCount ?? (r.visitedPlanets?.length ?? 0)}🌍</div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{r.student?.name || r.userId}</div>
                          <div className="text-xs text-white/50 truncate">{r.student?.email}</div>
                          <div className="text-xs text-white/60 mt-1">
                            Poin: <b>{r.points ?? 0}</b> · Kuis: <b>{r.stats?.totalAttempts ?? 0}</b> · Avg: <b>{Math.round((r.stats?.avgCorrectRatio ?? 0) * 100)}%</b>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-white/40 mt-3">
                Terakhir refresh: {lastFetchAtRef.current ? new Date(lastFetchAtRef.current).toLocaleTimeString("id-ID") : "-"}
              </div>
            </div>
          </div>

          {/* RIGHT */}
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
                {planets.map((p) => (
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
                  Siswa ini belum punya attempt kuis.
                </div>
              ) : (
                <div className="mt-6">
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
