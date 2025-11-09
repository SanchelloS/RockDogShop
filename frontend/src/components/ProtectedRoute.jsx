import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // если не залогинен — отправляем на логин
  if (!user) return <Navigate to="/login" replace />;

  // если роль не совпадает — отправляем на главную
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
