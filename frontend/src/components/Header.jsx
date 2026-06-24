import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Package,
  LogOut,
  Shield,
  Home,
  Menu,
  X,
} from "lucide-react";

import { useContext, useState, useEffect } from "react";

import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

import NotificationsBell from "./NotificationsBell";

export default function Header() {
  const { cart } = useContext(CartContext);
  const { user, logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const isAuthenticated = !!user;
  const isAdmin =
    user?.role === "Admin" || user?.Role === "Admin";

  useEffect(() => {
    if (Array.isArray(cart)) {
      const count = cart.reduce(
        (sum, item) => sum + (item.Quantity || 0),
        0
      );

      setCartCount(count);
    }
  }, [cart]);

  useEffect(() => {
    if (isAdmin && location.pathname === "/") {
      navigate("/admin");
    }
  }, [isAdmin, location.pathname, navigate]);

  const handleLogout = () => {
    logout();

    setMobileMenuOpen(false);
    setProfileMenuOpen(false);

    navigate("/login");
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ЛОГО */}
          <Link
            to={isAdmin ? "/admin" : "/"}
            onClick={closeMenus}
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition"
          >
            🐾 RockDog Store
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6">
            {/* Пользователь */}
            {!isAdmin && (
              <>
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Главная
                </Link>

                {isAuthenticated && (
                  <>
                    <Link
                      to="/orders"
                      className="text-gray-700 hover:text-blue-600 transition"
                    >
                      Мои заказы
                    </Link>

                    <Link
                      to="/cart"
                      className="relative text-gray-700 hover:text-blue-600 transition"
                    >
                      <ShoppingCart size={22} />

                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Админ */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-blue-600 font-medium"
              >
                <Shield size={18} />
                Админ панель
              </Link>
            )}

            {/* Уведомления */}
            {isAuthenticated && <NotificationsBell />}

            {/* Профиль */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() =>
                    setProfileMenuOpen(!profileMenuOpen)
                  }
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <User size={24} />

                  <span>
                    {user?.login || user?.Login}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                    {!isAdmin && (
                      <Link
                        to="/profile"
                        onClick={closeMenus}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition"
                      >
                        <User size={16} />
                        Профиль
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-50 transition"
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Войти
                </Link>

                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE BURGER */}
          <button
            className="md:hidden"
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
          >
            {mobileMenuOpen ? (
              <X size={28} />
            ) : (
              <Menu size={28} />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <nav className="flex flex-col gap-4">
              {/* НЕ АВТОРИЗОВАН */}
              {!isAuthenticated && (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 transition"
                  >
                    Войти
                  </Link>

                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Регистрация
                  </Link>
                </div>
              )}

              {/* ОБЫЧНЫЙ ПОЛЬЗОВАТЕЛЬ */}
              {!isAdmin && (
                <>
                  <Link
                    to="/"
                    onClick={closeMenus}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                  >
                    <Home size={18} />
                    Главная
                  </Link>

                  {isAuthenticated && (
                    <>
                      <Link
                        to="/orders"
                        onClick={closeMenus}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                      >
                        <Package size={18} />
                        Мои заказы
                      </Link>

                      <Link
                        to="/cart"
                        onClick={closeMenus}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                      >
                        <ShoppingCart size={18} />
                        Корзина ({cartCount})
                      </Link>

                      <Link
                        to="/profile"
                        onClick={closeMenus}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                      >
                        <User size={18} />
                        Профиль
                      </Link>

                      <div className="pt-2">
                        <NotificationsBell />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* АДМИН */}
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    onClick={closeMenus}
                    className="flex items-center gap-2 text-blue-600 font-medium"
                  >
                    <Shield size={18} />
                    Админ панель
                  </Link>

                  <div className="pt-2">
                    <NotificationsBell />
                  </div>
                </>
              )}

              {/* ВЫХОД */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-left text-red-600 hover:text-red-700 transition"
                >
                  <LogOut size={18} />
                  Выйти
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}