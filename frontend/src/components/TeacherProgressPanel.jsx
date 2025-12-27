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

        // ✅ support: array ATAU { planets: [...] }
        const list = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.planets ?? []);
        setPlanets(list);
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
    loadStudentAttempts(selectedStudentId).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
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
      {/* ... sisanya sama persis punyamu ... */}
      {toast && <div className="mt-4 text-sm text-indigo-200">{toast}</div>}
      {/* render content */}
    </div>
  );
}
