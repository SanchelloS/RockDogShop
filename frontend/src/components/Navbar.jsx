import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { Menu, X } from "lucide-react"; // 🧭 иконки

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.Quantity, 0);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* 🔹 Логотип */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-blue-600 tracking-tight hover:text-blue-700 transition"
        >
          RockDog 🐾
        </Link>

        {/* 🔹 Кнопка-бургер для мобильных */}
        <button
          className="md:hidden text-gray-700 hover:text-blue-600 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* 🔹 Основная навигация */}
        <div
          className={`${
            menuOpen
              ? "flex flex-col absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-md md:shadow-none md:border-none"
              : "hidden"
          } md:flex md:flex-row md:static md:w-auto md:bg-transparent md:space-x-6 items-center text-gray-700 font-medium`}
        >
          <Link
            to="/"
            className="py-2 px-4 hover:text-blue-600 transition md:p-0"
            onClick={() => setMenuOpen(false)}
          >
            Главная
          </Link>

          {/* 🛒 Корзина */}
          <Link
            to="/cart"
            className="relative flex items-center gap-1 py-2 px-4 hover:text-blue-600 transition md:p-0"
            onClick={() => setMenuOpen(false)}
          >
            🛒 Корзина
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalItems}
              </span>
            )}
          </Link>

          {/* 👤 Для гостей */}
          {!user && (
            <>
              <Link
                to="/login"
                className="py-2 px-4 hover:text-blue-600 transition md:p-0"
                onClick={() => setMenuOpen(false)}
              >
                Вход
              </Link>
              <Link
                to="/register"
                className="py-2 px-4 hover:text-blue-600 transition md:p-0"
                onClick={() => setMenuOpen(false)}
              >
                Регистрация
              </Link>
            </>
          )}

          {/* ⚙️ Для администратора */}
          {user?.role === "Admin" && (
            <Link
              to="/admin"
              className="py-2 px-4 text-blue-600 hover:text-blue-700 transition md:p-0"
              onClick={() => setMenuOpen(false)}
            >
              Админ
            </Link>
          )}

          {/* 👋 Авторизованный пользователь */}
          {user && (
            <>
              <span
                onClick={() => {
                  navigate("/profile");
                  setMenuOpen(false);
                }}
                className="py-2 px-4 text-gray-600 cursor-pointer hover:text-blue-600 transition md:p-0"
              >
                Привет, <strong>{user.login}</strong>
              </span>

              <Link
                to="/orders"
                className="py-2 px-4 hover:text-blue-600 transition md:p-0"
                onClick={() => setMenuOpen(false)}
              >
                📦 Мои заказы
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="py-2 px-4 text-red-500 hover:text-red-700 transition md:p-0"
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
