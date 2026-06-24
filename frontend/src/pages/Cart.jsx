import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import axiosClient from "../api/axiosClient";

const API_URL = import.meta.env.VITE_API_URL;

export default function Cart() {
  const { cart, removeFromCart, loadCartFromServer, updateQuantity: updateCartQuantity } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [visibleItems, setVisibleItems] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === "Admin" || user?.Role === "Admin";
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    if (token && !isAdmin) {
      loadCartFromServer();
    }
    setLoading(false);
  }, [token, isAdmin, loadCartFromServer]);

  // Анимация появления страницы
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Плавное появление товаров
  useEffect(() => {
    const currentIds = cart.map((i) => i.ProductID);
    const newIds = currentIds.filter((id) => !visibleItems.includes(id));
    const removedIds = visibleItems.filter((id) => !currentIds.includes(id));

    if (removedIds.length > 0) {
      setVisibleItems((prev) => prev.filter((id) => !removedIds.includes(id)));
    }

    if (newIds.length > 0) {
      newIds.forEach((id, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, id]);
        }, index * 100);
      });
    }
  }, [cart.length]);

  const getCurrentQty = (id) => cart.find((item) => item.ProductID === id)?.Quantity || 0;

  const updateQuantity = async (productId, newQty, e) => {
    e.stopPropagation();
    if (newQty < 1) return;
    setUpdating(true);
    try {
      await axiosClient.post("/cart/add", {
        productId,
        quantity: newQty - getCurrentQty(productId),
      });
      await loadCartFromServer();
    } catch (err) {
      console.error("Ошибка обновления:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = (id, e) => {
    e.stopPropagation();
    setVisibleItems((prev) => prev.filter((pid) => pid !== id));
    setTimeout(() => removeFromCart(id), 300);
  };

  const total = Array.isArray(cart) && cart.length > 0
    ? cart.reduce((sum, item) => sum + (item.Price || 0) * (item.Quantity || 0), 0)
    : 0;

  const totalItems = Array.isArray(cart) && cart.length > 0
    ? cart.reduce((sum, item) => sum + (item.Quantity || 0), 0)
    : 0;

  // Скелетон загрузки
  const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-xl"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Загрузка
  if (loading) {
    return (
      <div className="py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  // Админ редирект
  if (isAdmin) {
    navigate("/admin");
    return null;
  }

  // Не авторизован
  if (!token) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center px-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center max-w-md mx-auto animate-fade-in">
          <div className="relative inline-block mb-6">
            <span className="text-8xl animate-float">🛒</span>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Корзина
          </h2>
          <p className="text-gray-600 mb-6">
            Авторизуйтесь, чтобы просматривать и управлять корзиной
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Войти в аккаунт
          </button>
        </div>
      </div>
    );
  }

  // Пустая корзина
  if (!cart || cart.length === 0) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center px-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center max-w-md mx-auto animate-fade-in">
          <div className="relative inline-block mb-6">
            <span className="text-8xl animate-float">🛒</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs animate-bounce">
              !
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">Корзина пуста</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Добавьте товары в корзину, чтобы оформить заказ
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            Перейти к покупкам
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-8 md:py-12 px-4 transition-all duration-700 ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Заголовок с анимацией */}
        <div className="mb-8 animate-slide-down">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl">🛒</span>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Корзина
            </h1>
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full animate-pulse-slow">
              {totalItems} товаров
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-2 animate-slide-up">
            Проверьте товары и оформите заказ
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Список товаров */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {cart.map((item, index) => {
                  const isVisible = visibleItems.includes(item.ProductID);
                  return (
                    <div
                      key={item.ProductID}
                      onClick={() => navigate(`/product/${item.ProductID}`)}
                      className={`group p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all duration-500 ${
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
                      } hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent`}
                      style={{ transitionDelay: `${index * 80}ms` }}
                    >
                      <div className="flex gap-4">
                        <div className="relative">
                          <img
                            src={item.MainImageURL ? `${API_URL}${item.MainImageURL}` : "/no-image.png"}
                            alt={item.Name}
                            className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl border border-gray-200 transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
                            {item.Quantity}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {item.Name}
                          </h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {item.Price} BYN / шт
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => updateQuantity(item.ProductID, item.Quantity - 1, e)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                            disabled={updating}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold text-lg w-8 text-center">
                            {item.Quantity}
                          </span>
                          <button
                            onClick={(e) => updateQuantity(item.ProductID, item.Quantity + 1, e)}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                            disabled={updating}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="font-bold text-blue-600 text-lg">
                            {(item.Price * item.Quantity).toLocaleString()} BYN
                          </p>
                          <button
                            onClick={(e) => handleRemove(item.ProductID, e)}
                            className="text-red-400 hover:text-red-600 text-sm transition-all duration-200 hover:scale-105 inline-flex items-center gap-1 mt-1"
                          >
                            <Trash2 size={14} />
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Итого */}
          <div className="lg:w-80 animate-slide-right">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Итого
              </h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Товары ({totalItems} шт.)</span>
                  <span>{total.toLocaleString()} BYN</span>
                </div>
                
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-gray-800">Итого к оплате</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                      {total.toLocaleString()} BYN
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Оформить заказ
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full mt-3 text-gray-500 hover:text-blue-600 text-sm transition-all duration-300 hover:translate-x-[-4px] inline-flex items-center justify-center gap-1"
              >
                ← Продолжить покупки
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS анимации */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-slide-down {
          animation: slideDown 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }

        .animate-slide-right {
          animation: slideRight 0.5s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }

        .animate-bounce {
          animation: bounce 0.5s ease-out;
        }

        .animate-fade-in {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}