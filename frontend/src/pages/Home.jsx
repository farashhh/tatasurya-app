import React from "react";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import pulse from "../assets/lottie/pulse.json";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex badge">Tema: Jelajahi TataSurya</div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-black leading-tight">
              Jelajahi <span className="text-indigo-300">Tata Surya</span> lewat 3D, materi, dan kuis interaktif
            </h1>
            <p className="mt-4 text-white/70 max-w-xl">
              Aplikasi pembelajaran dengan mode eksplorasi 3D (orbit dinamis + efek cahaya),
              halaman pengetahuan (teks + narasi + ilustrasi animatif), kuis untuk evaluasi, dan halaman progres.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => navigate("/explore")}>
                🌌 Mulai Jelajah
              </button>
              <button className="btn-secondary" onClick={() => navigate("/explore")}>
                🪐 Mode 3D
              </button>
              <button className="btn-secondary" onClick={() => navigate("/progress")}>
                📊 Data Eksplorasi
              </button>
            </div>

            {!user && (
              <div className="mt-6 glass rounded-2xl p-5 max-w-xl">
                <div className="font-bold">Masuk dulu ya 👋</div>
                <p className="text-white/70 text-sm mt-1">
                  Supaya progres belajar dan nilai kuis tersimpan, silakan login/daftar sebagai <b>Guru</b> atau <b>Murid</b>.
                </p>
                <div className="mt-4 flex gap-3">
                  <button className="btn-secondary" onClick={() => navigate("/login")}>Masuk</button>
                  <button className="btn-primary" onClick={() => navigate("/register")}>Daftar</button>
                </div>
              </div>
            )}

            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-4">
                <div className="font-bold">Eksplorasi 3D</div>
                <div className="text-white/60 text-sm mt-1">Klik planet, lihat orbit, fokus kamera.</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="font-bold">Materi + Narasi</div>
                <div className="text-white/60 text-sm mt-1">Teks pembelajaran + suara (SpeechSynthesis).</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="font-bold">Kuis & Progres</div>
                <div className="text-white/60 text-sm mt-1">Nilai tersimpan & grafik perkembangan.</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="glass rounded-3xl p-6 overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm">Animasi</div>
                  <div className="font-black text-2xl">Pusat Galaksi</div>
                </div>
                <div className="badge">Lottie</div>
              </div>
              <div className="mt-6 flex items-center justify-center">
                <div className="w-72 h-72 animate-floaty">
                  <Lottie animationData={pulse} loop />
                </div>
              </div>
              <div className="text-center text-white/60 text-sm -mt-6">
                (Anda bisa ganti JSON Lottie di <code className="text-white/80">src/assets/lottie</code>)
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 w-56">
              <div className="font-bold">Tips</div>
              <div className="text-white/70 text-sm mt-1">
                Di halaman eksplorasi, klik planet untuk membuka panel info & tombol “Pelajari”/“Kuis”.
              </div>
            </div>
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
