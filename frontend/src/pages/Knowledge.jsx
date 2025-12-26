import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import anime from "animejs";
import api from "../api/client.js";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

function speak(text) {
  if (!("speechSynthesis" in window)) return { ok: false, reason: "Browser tidak mendukung SpeechSynthesis" };
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "id-ID";
  utter.rate = 1.0;
  utter.pitch = 1.0;
  window.speechSynthesis.speak(utter);
  return { ok: true };
}

export default function Knowledge() {
  const { planetId } = useParams();
  const navigate = useNavigate();

  const [planet, setPlanet] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const orbitRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.get(`/planets/${planetId}`),
      api.get(`/materials`, { params: { planetId } }),
      api.post(`/progress/visit`, { planetId }).catch(() => null),
    ])
      .then(([planetRes, matRes]) => {
        if (!mounted) return;
        setPlanet(planetRes.data.planet);
        setMaterials(matRes.data.materials || []);
      })
      .catch((e) => {
        setToast(e?.response?.data?.error || "Gagal memuat materi");
        setTimeout(() => setToast(""), 2500);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [planetId]);

  useEffect(() => {
    if (!orbitRef.current) return;
    const anim = anime({
      targets: orbitRef.current,
      rotate: "1turn",
      duration: 9000,
      easing: "linear",
      loop: true,
    });
    return () => anim.pause();
  }, [planetId, loading]);

  const combinedText = useMemo(() => {
    if (!planet) return "";
    const head = `${planet.name}. ${planet.summary || ""}`;
    const body = materials.map((m) => `${m.title}. ${m.content}`).join(" ");
    return [head, body].filter(Boolean).join(" ");
  }, [planet, materials]);

  if (loading) {
    return (
      <GalaxyBackground>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="glass rounded-3xl p-8 flex items-center justify-center">
            <LoadingSpinner label="Memuat pengetahuan..." />
          </div>
        </div>
      </GalaxyBackground>
    );
  }

  if (!planet) {
    return (
      <GalaxyBackground>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="glass rounded-3xl p-8">
            <div className="font-black text-xl">Planet tidak ditemukan.</div>
            <button className="btn-primary mt-6" onClick={() => navigate("/explore")}>Kembali</button>
          </div>
        </div>
      </GalaxyBackground>
    );
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-secondary" onClick={() => navigate("/explore")}>← Eksplorasi</button>
          <div className="badge">Pengetahuan</div>
          <div className="badge">{planet.name}</div>
          <div className="flex-1" />
          <button
            className="btn-secondary"
            onClick={() => {
              const r = speak(combinedText);
              if (!r.ok) {
                setToast(r.reason);
                setTimeout(() => setToast(""), 2500);
              }
            }}
          >
            🔊 Narasi
          </button>
          <button className="btn-secondary" onClick={() => window.speechSynthesis?.cancel()}>
            ⏹️ Stop
          </button>
          <button className="btn-primary" onClick={() => navigate(`/quiz/${planet.id}`)}>
            🧠 Mulai Kuis
          </button>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), ${planet.color || "#888"} 55%, rgba(0,0,0,0.7))`,
                  }}
                />
                <div>
                  <div className="text-white/60 text-sm">Ringkasan Planet</div>
                  <div className="text-2xl font-black">{planet.name}</div>
                </div>
              </div>
              <p className="mt-4 text-white/75 leading-relaxed">
                {planet.summary}
              </p>

              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="glass rounded-2xl p-3">
                  <div className="text-xs text-white/60">Urutan</div>
                  <div className="font-black">{planet.order}</div>
                </div>
                <div className="glass rounded-2xl p-3">
                  <div className="text-xs text-white/60">Jarak (AU)</div>
                  <div className="font-black">{planet.distanceAU}</div>
                </div>
                <div className="glass rounded-2xl p-3">
                  <div className="text-xs text-white/60">Radius (Bumi=1)</div>
                  <div className="font-black">{planet.radius}</div>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm">Materi Pembelajaran</div>
                  <div className="font-black text-xl">Modul untuk {planet.name}</div>
                </div>
                <div className="badge">Teks + Ilustrasi</div>
              </div>

              {materials.length === 0 ? (
                <div className="mt-4 text-white/60 text-sm">
                  Belum ada materi tambahan untuk planet ini. (Guru bisa menambah di menu Guru)
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {materials.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="font-bold">{m.title}</div>
                      <p className="text-white/75 text-sm mt-2 leading-relaxed">{m.content}</p>
                      <div className="text-xs text-white/50 mt-3">
                        Diperbarui: {new Date(m.updatedAt || m.createdAt).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-lg">Ilustrasi Animatif</div>
              <div className="text-white/60 text-sm mt-1">
                Animasi sederhana memakai <b>Anime.js</b> (orbit berputar).
              </div>

              <div className="mt-6 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <div
                    ref={orbitRef}
                    className="absolute inset-0 rounded-full border border-white/15"
                    style={{
                      boxShadow: "0 0 60px rgba(99,102,241,0.15) inset",
                    }}
                  >
                    {/* dot */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <div className="h-4 w-4 rounded-full bg-white shadow-[0_0_25px_rgba(255,255,255,0.6)]" />
                    </div>
                  </div>

                  {/* planet in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-24 w-24 rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), ${planet.color || "#888"} 55%, rgba(0,0,0,0.8))`,
                        boxShadow: `0 0 45px ${planet.color || "#888"}33`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/60">
                Catatan: Untuk ilustrasi yang lebih kaya, Anda bisa mengganti animasi ini dengan Lottie (JSON).
              </div>
            </div>

            {toast && (
              <div className="glass rounded-2xl p-4 border border-white/10 text-sm">
                {toast}
              </div>
            )}

            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="font-black text-lg">Aksi Cepat</div>
              <div className="mt-3 flex flex-col gap-3">
                <button className="btn-secondary" onClick={() => navigate(`/quiz/${planet.id}`)}>
                  🧠 Kerjakan Kuis
                </button>
                <button className="btn-secondary" onClick={() => navigate(`/progress`)}>
                  📊 Lihat Progres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
