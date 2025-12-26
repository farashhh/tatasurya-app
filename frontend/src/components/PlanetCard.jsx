import React from "react";
import { useNavigate } from "react-router-dom";

export default function PlanetCard({ planet, visited }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/knowledge/${planet.id}`)}
      className={[
        "text-left rounded-2xl p-4 border transition w-full",
        visited ? "bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/15" : "bg-white/5 border-white/10 hover:bg-white/10"
      ].join(" ")}
      title="Buka materi"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), ${planet.color || "#888"} 55%, rgba(0,0,0,0.7))`,
            boxShadow: visited ? "0 0 30px rgba(16,185,129,0.25)" : "0 0 30px rgba(255,255,255,0.08)",
          }}
        />
        <div className="min-w-0">
          <div className="font-bold">{planet.name}</div>
          <div className="text-xs text-white/60 truncate">{planet.summary}</div>
        </div>
        <div className="flex-1" />
        {visited && <span className="badge border-emerald-400/30 bg-emerald-500/10">Dikunjungi</span>}
      </div>
    </button>
  );
}
