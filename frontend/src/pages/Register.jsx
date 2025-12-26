import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [role, setRole] = useState("murid");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await register({ name, role, email, password });
      navigate(user.role === "guru" ? "/teacher" : "/explore", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Gagal daftar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="glass rounded-3xl p-8">
          <h1 className="text-2xl font-black">Daftar Akun</h1>
          <p className="text-white/70 mt-1">Pilih peran: Guru atau Murid.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm text-white/70">Nama</label>
              <input className="input mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
            </div>

            <div>
              <label className="text-sm text-white/70">Peran</label>
              <select className="input mt-2" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="murid">Murid</option>
                <option value="guru">Guru</option>
              </select>
              <div className="text-xs text-white/60 mt-2">
                Guru dapat melihat nilai siswa, menambah soal, dan menambah materi.
              </div>
            </div>

            <div>
              <label className="text-sm text-white/70">Email</label>
              <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
            </div>

            <div>
              <label className="text-sm text-white/70">Password</label>
              <input className="input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
            </div>

            {error && <div className="text-rose-300 text-sm">{error}</div>}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <div className="mt-6 text-sm text-white/70">
            Sudah punya akun?{" "}
            <Link className="text-indigo-300 font-semibold hover:underline" to="/login">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
