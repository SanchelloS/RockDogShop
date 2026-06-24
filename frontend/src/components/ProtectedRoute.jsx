import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  // Безопасное получение пользователя из localStorage
  let user = null;
  try {
    const userData = localStorage.getItem("user");
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Ошибка парсинга user:", error);
    user = null;
  }

  const token = localStorage.getItem("token");
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "Admin" || user?.Role === "Admin";

  // 1. Если не авторизован - на логин
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Если нужна роль админа, но пользователь не админ - на главную
  if (role === "Admin" && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 3. Если это пользовательский маршрут (нет role), но пользователь админ - на админку
  if (!role && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // 4. Если нужна конкретная роль (например "User") и она не совпадает
  if (role && role !== "Admin" && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // 5. Всё хорошо - показываем защищенную страницу
  return children;
}