import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // ⏳ mientras verifica token
  if (loading) {
    return <div className="text-white p-4">Cargando...</div>;
  }

  // 🔒 no logueado → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 👑 si requiere admin y no lo es
  if (requireAdmin && user.role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  // 🚫 si es admin intentando entrar al dashboard
  if (!requireAdmin && user.role === "superadmin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;