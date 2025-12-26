import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Explore3D from "./pages/Explore3D.jsx";
import Knowledge from "./pages/Knowledge.jsx";
import Quiz from "./pages/Quiz.jsx";
import Progress from "./pages/Progress.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-2xl p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="text-white/70 mt-2">Periksa URL atau kembali ke beranda.</p>
        <div className="mt-6">
          <a href="/" className="btn-primary">Kembali ke Home</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore3D />
            </ProtectedRoute>
          }
        />

        <Route
          path="/knowledge/:planetId"
          element={
            <ProtectedRoute>
              <Knowledge />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:planetId"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <RoleRoute role="guru">
              <TeacherDashboard />
            </RoleRoute>
          }
        />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </div>
  );
}
