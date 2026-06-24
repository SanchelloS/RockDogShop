import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, LogIn, UserPlus, X } from "lucide-react";
import { createPortal } from "react-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const token = localStorage.getItem("token");
  const isAdmin = user?.role === "Admin" || user?.Role === "Admin";
  const isAuthenticated = !!token && !!user;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Если админ - не добавляем
    if (isAdmin) {
      return;
    }
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  // Показывать ли кнопку? (не показываем админам)
  const showAddButton = !isAdmin;

  // Модальное окно через Portal
  const AuthModal = () => {
    if (!showAuthModal) return null;
    
    return createPortal(
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999,
        }}
        onClick={closeModal}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            maxWidth: "28rem",
            width: "90%",
            margin: "1rem",
            padding: "1.5rem",
            position: "relative",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            animation: "popup 0.3s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              🔒 Требуется авторизация
            </h3>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 transition"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-600 mb-2">
              Чтобы добавить товар в корзину, необходимо
            </p>
            <p className="text-gray-800 font-semibold">
              войти в аккаунт или зарегистрироваться
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: `/product/${product.ProductID}` }}
              onClick={closeModal}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                fontWeight: "600",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1d4ed8";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <LogIn size={20} />
              Войти
            </Link>
            
            <Link
              to="/register"
              state={{ from: `/product/${product.ProductID}` }}
              onClick={closeModal}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                backgroundColor: "#f3f4f6",
                color: "#1f2937",
                fontWeight: "600",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <UserPlus size={20} />
              Зарегистрироваться
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            После входа товар можно будет добавить в корзину
          </p>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <Link
        to={`/product/${product.ProductID}`}
        className="block group relative w-full max-w-sm h-full"
        title={product.Name}
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-md transition-transform duration-300 ease-out group-hover:shadow-xl group-hover:scale-[1.03] h-full flex flex-col">
          {/* Изображение */}
          <div className="relative h-60 bg-gray-100 overflow-hidden flex items-center justify-center">
            {product.MainImageURL ? (
              <img
                src={`${API_URL}${product.MainImageURL}`}
                alt={product.Name}
                className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="text-gray-400">Нет фото</div>
            )}

            {/* Кнопка добавления в корзину - только для не-админов */}
            {showAddButton && (
              <button
                onClick={handleAdd}
                className={`absolute bottom-3 right-3 p-3 rounded-full shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                  added
                    ? "bg-green-500 text-white scale-110"
                    : isAuthenticated
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                }`}
                title={isAuthenticated ? "Добавить в корзину" : "Войдите, чтобы добавить в корзину"}
              >
                {added ? (
                  <Check size={20} />
                ) : isAuthenticated ? (
                  <ShoppingCart size={20} />
                ) : (
                  <LogIn size={20} />
                )}
              </button>
            )}
          </div>

          {/* Текстовый блок */}
          <div className="p-4 flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
              {product.Name}
            </h2>
            <p className="text-xl font-bold text-blue-600 mt-auto">
              {product.Price} BYN
            </p>
          </div>
        </div>

        {added && (
          <div className="absolute bottom-24 right-3 bg-green-500 text-white text-sm font-medium py-1.5 px-3 rounded-lg shadow-md animate-fade-in">
            ✅ Добавлено в корзину!
          </div>
        )}
      </Link>

      {/* Модалка через Portal */}
      <AuthModal />
    </>
  );
}