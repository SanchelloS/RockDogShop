import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { Truck, CreditCard, CheckCircle2, ArrowLeft, ShoppingBag, Headphones } from "lucide-react";

// Подключение к серверу через .env файл
const API_URL = import.meta.env.VITE_API_URL;

export default function Checkout() {
  const { cart, totalPrice, clearCart, loadCartFromServer } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    city: "",
    street: "",
    house: "",
    apartment: "",
    postalCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Анимация загрузки страницы
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    const formTimer = setTimeout(() => setIsFormVisible(true), 200);
    const summaryTimer = setTimeout(() => setIsSummaryVisible(true), 300);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(formTimer);
      clearTimeout(summaryTimer);
    };
  }, []);

  // Проверка авторизации и корзины
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
    if (!showSuccess && (!cart || cart.length === 0)) {
      navigate("/cart");
    }
  }, [token, cart, navigate, showSuccess]);

  // Таймер для перенаправления (5 секунд)
  useEffect(() => {
    let redirectTimer;
    
    if (showSuccess) {
      redirectTimer = setTimeout(() => {
        navigate("/");
      }, 5000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [showSuccess, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cart || cart.length === 0) {
      navigate("/cart");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = { 
        address: form, 
        items: cart, 
        total: totalPrice 
      };
      
      await axios.post(
        `${API_URL}/api/checkout`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Показываем модалку
      setShowSuccess(true);
      
      // Очищаем корзину
      setTimeout(() => {
        clearCart();
        loadCartFromServer();
      }, 100);
      
      setIsSubmitting(false);
      
    } catch (err) {
      console.error("Ошибка при оформлении заказа:", err);
      alert("❌ Ошибка при оформлении заказа. Попробуйте позже.");
      setIsSubmitting(false);
    }
  };

  // Если корзина пуста - редирект
  if (!cart || cart.length === 0 && !showSuccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12 px-4 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float-delayed"></div>
      </div>

      {/* Простая модалка успеха */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4 animate-popup">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
              <CheckCircle2 className="text-green-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Заказ успешно оформлен!
            </h2>
            <p className="text-gray-600 mb-3">
              Спасибо за покупку 🐾
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
              <Headphones size={16} />
              <span>Скоро с вами свяжется менеджер для подтверждения</span>
            </div>
            <p className="text-xs text-gray-500">
              Перенаправление на главную через 5 секунд...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Кнопка назад с анимацией */}
        <button
          onClick={() => navigate("/cart")}
          className={`flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-all duration-300 mb-6 transform hover:translate-x-[-5px] ${
            isPageLoaded ? 'animate-slide-right' : 'opacity-0'
          }`}
        >
          <ArrowLeft size={20} />
          Назад к корзине
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Форма с анимацией появления */}
          <div className={`flex-1 transition-all duration-700 transform ${
            isFormVisible 
              ? 'translate-x-0 opacity-100' 
              : '-translate-x-10 opacity-0'
          }`}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="animate-slide-down">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  Оформление заказа
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Заполните данные для доставки
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-slide-up">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-700">
                    <Truck size={20} className="animate-pulse-slow" />
                    Адрес доставки
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="Город *"
                      value={form.city}
                      onChange={handleChange}
                      className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
                      required
                    />
                    <input
                      type="text"
                      name="street"
                      placeholder="Улица *"
                      value={form.street}
                      onChange={handleChange}
                      className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
                      required
                    />
                    <input
                      type="text"
                      name="house"
                      placeholder="Дом *"
                      value={form.house}
                      onChange={handleChange}
                      className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
                      required
                    />
                    <input
                      type="text"
                      name="apartment"
                      placeholder="Квартира (опционально)"
                      value={form.apartment}
                      onChange={handleChange}
                      className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
                    />
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Почтовый индекс"
                      value={form.postalCode}
                      onChange={handleChange}
                      className="sm:col-span-2 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 hover:shadow-md transform hover:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 animate-slide-up-delayed">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-700">
                    <CreditCard size={20} className="animate-pulse-slow" />
                    Способ оплаты
                  </h3>
                  
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Оплата при получении</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-2 ml-7">
                      Наличными или картой при получении заказа
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] animate-slide-up-delayed-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Оформление...
                    </span>
                  ) : (
                    "✅ Подтвердить заказ"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Сводка заказа с анимацией появления */}
          <div className={`lg:w-96 transition-all duration-700 transform ${
            isSummaryVisible 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-10 opacity-0'
          }`}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingBag size={20} className="animate-bounce-light" />
                Ваш заказ
              </h3>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 custom-scrollbar">
                {cart && cart.slice(0, 3).map((item, index) => (
                  <div 
                    key={item.ProductID} 
                    className="flex gap-3 transform transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      animation: `slideInRight 0.4s ease-out ${0.1 * index}s both`
                    }}
                  >
                    <img
                      src={item.MainImageURL ? `${API_URL}${item.MainImageURL}` : "/no-image.png"}
                      alt={item.Name}
                      className="w-12 h-12 rounded-lg object-cover border transform transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        e.target.src = "/no-image.png";
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.Name}</p>
                      <p className="text-xs text-gray-500">
                        {item.Quantity} × {item.Price} BYN
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-blue-600">
                      {(item.Price * item.Quantity).toLocaleString()} BYN
                    </p>
                  </div>
                ))}
                {cart && cart.length > 3 && (
                  <p className="text-xs text-gray-400 text-center animate-pulse-slow">
                    + еще {cart.length - 3} товаров
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Товары ({cart ? cart.reduce((sum, i) => sum + i.Quantity, 0) : 0} шт.)</span>
                  <span>{totalPrice.toLocaleString()} BYN</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-800">
                  <span>Итого</span>
                  <span className="text-xl text-blue-600 animate-pulse-slow">{totalPrice.toLocaleString()} BYN</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
                <Headphones size={12} />
                После оформления с вами свяжется менеджер для подтверждения
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Стили для анимаций */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

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

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 3s;
        }

        .animate-popup {
          animation: bounceIn 0.5s ease-out;
        }

        .animate-bounce-in {
          animation: bounceIn 0.6s ease-out;
        }

        .animate-slide-up {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slide-up-delayed {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .animate-slide-up-delayed-2 {
          animation: fadeInUp 0.6s ease-out 0.4s both;
        }

        .animate-slide-down {
          animation: slideDown 0.6s ease-out;
        }

        .animate-slide-right {
          animation: slideRight 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-bounce-light {
          animation: bounce 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}