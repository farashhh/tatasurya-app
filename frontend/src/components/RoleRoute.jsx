import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function RoleRoute({ role, children }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {user?.role === role ? children : <Navigate to="/explore" replace />}
    </ProtectedRoute>
  );
}
