import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GalaxyBackground from "../components/GalaxyBackground.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/explore";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Gagal login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GalaxyBackground>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="glass rounded-3xl p-8">
          <h1 className="text-2xl font-black">Masuk</h1>
          <p className="text-white/70 mt-1">Login untuk mulai eksplorasi & menyimpan progres.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm text-white/70">Email</label>
              <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
            </div>
            <div>
              <label className="text-sm text-white/70">Password</label>
              <input className="input mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && <div className="text-rose-300 text-sm">{error}</div>}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-sm text-white/70">
            Belum punya akun?{" "}
            <Link className="text-indigo-300 font-semibold hover:underline" to="/register">
              Daftar di sini
            </Link>
          </div>
        </div>
      </div>
    </GalaxyBackground>
  );
}
