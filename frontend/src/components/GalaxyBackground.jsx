import React from "react";

/**
 * Background sederhana: gradient + "bintang" (dot) via CSS.
 * Aman dipakai di semua halaman.
 */
export default function GalaxyBackground({ children }) {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-64px)]">
      {/* gradient nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.25),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.18),transparent_45%)]" />
      {/* stars layer */}
      <div className="absolute inset-0 opacity-60" style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "70px 70px, 120px 120px",
        backgroundPosition: "0 0, 30px 60px"
      }} />
      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
      <div className="relative">{children}</div>
    </div>
  );
}
