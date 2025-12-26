import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Center({ children }) {
  return <div className="min-h-[70vh] flex items-center justify-center px-6">{children}</div>;
}

export default function ProtectedRoute({ children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <Center>
        <div className="glass rounded-2xl px-6 py-5">Memuat...</div>
      </Center>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return children;
}
