import React from "react";

export default function LoadingSpinner({ label = "Memuat..." }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      <span className="text-white/70 text-sm">{label}</span>
    </div>
  );
}
