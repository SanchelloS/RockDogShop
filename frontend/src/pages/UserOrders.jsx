import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp, Package, Archive, ShoppingBag, AlertCircle, Sparkles, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Подключение к серверу через .env файл
const API = import.meta.env.VITE_API_URL;

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const navigate = useNavigate();

  const [tab, setTab] = useState("active");
  const [openActiveId, setOpenActiveId] = useState(null);
  const [openArchiveId, setOpenArchiveId] = useState(null);

  const token = localStorage.getItem("token");

  const statusMap = {
    Pending: "⏳ Ожидает обработки",
    Paid: "💳 Оплачен",
    Shipped: "📦 Отправлен",
    Delivered: "✅ Доставлен",
    Cancelled: "❌ Отменён",
  };

  const statusColor = {
    Pending: "bg-yellow-100 text-yellow-800",
    Paid: "bg-blue-100 text-blue-800",
    Shipped: "bg-indigo-100 text-indigo-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  const ARCHIVE_STATUSES = useMemo(() => new Set(["Delivered", "Cancelled"]), []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [token, navigate]);

  // Анимация появления страницы
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const grouped = res.data.reduce((acc, item) => {
        if (!acc[item.OrderID]) {
          acc[item.OrderID] = {
            OrderID: item.OrderID,
            OrderDate: item.OrderDate,
            TotalAmount: item.TotalAmount,
            Status: item.Status,
            items: [],
          };
        }
        acc[item.OrderID].items.push({
          Name: item.Name,
          Quantity: item.Quantity,
          Price: item.Price,
          MainImageURL: item.MainImageURL,
        });
        return acc;
      }, {});

      setOrders(Object.values(grouped));
    } catch (err) {
      console.error("Ошибка при получении заказов:", err);
      setError("Не удалось загрузить заказы. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  const activeOrders = useMemo(
    () => orders.filter((o) => !ARCHIVE_STATUSES.has(o.Status)),
    [orders]
  );

  const archiveOrders = useMemo(
    () => orders.filter((o) => ARCHIVE_STATUSES.has(o.Status)),
    [orders]
  );

  const list = tab === "active" ? activeOrders : archiveOrders;
  const openId = tab === "active" ? openActiveId : openArchiveId;
  const setOpenId = tab === "active" ? setOpenActiveId : setOpenArchiveId;

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.TotalAmount, 0);

  // Компонент скелетона для загрузки
  const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Заголовок с анимацией */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          
          {/* Скелетон вкладок */}
          <div className="flex gap-2 mb-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 animate-fade-in">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Ошибка</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition transform hover:scale-105"
          >
            Попробовать снова
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
            <div className="relative">
              <Package className="text-blue-600" size={32} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Мои заказы
            </h1>
          </div>
          
          {orders.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-sm">
                <ShoppingBag size={14} className="text-blue-600" />
                <span className="text-gray-700">Всего заказов: <strong>{totalOrders}</strong></span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-sm">
                <Gift size={14} className="text-green-600" />
                <span className="text-gray-700">Потрачено: <strong>{totalSpent.toLocaleString()} BYN</strong></span>
              </div>
              {activeOrders.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full text-sm animate-pulse-slow">
                  <Sparkles size={14} className="text-yellow-600" />
                  <span className="text-gray-700">Активных: <strong>{activeOrders.length}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Вкладки с анимацией */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 animate-slide-up-delayed">
          <button
            onClick={() => {
              setTab("active");
              setOpenArchiveId(null);
            }}
            className={`pb-3 px-4 text-sm md:text-base font-semibold transition-all duration-300 relative ${
              tab === "active"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Активные ({activeOrders.length})
            {tab === "active" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-slide-in"></span>
            )}
          </button>
          <button
            onClick={() => {
              setTab("archive");
              setOpenActiveId(null);
            }}
            className={`pb-3 px-4 text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2 relative ${
              tab === "archive"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Archive size={16} />
            Архив ({archiveOrders.length})
            {tab === "archive" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-slide-in"></span>
            )}
          </button>
        </div>

        {/* Список заказов */}
        {list.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 animate-fade-in">
            <div className="relative inline-block">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4 animate-float" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {tab === "active" ? "Нет активных заказов" : "Архив пуст"}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {tab === "active" 
                ? "У вас пока нет активных заказов. Начните покупки прямо сейчас!" 
                : "Завершённые заказы появятся здесь после доставки"}
            </p>
            {tab === "active" && (
              <button
                onClick={() => navigate("/")}
                className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition transform hover:translate-x-1"
              >
                Перейти к покупкам →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((order, index) => {
              const isOpen = openId === order.OrderID;
              const orderDate = new Date(order.OrderDate);
              const isExpired = order.Status === "Cancelled";

              return (
                <div
                  key={order.OrderID}
                  className={`bg-white rounded-xl border transition-all duration-500 overflow-hidden animate-slide-up ${
                    isOpen ? "shadow-lg border-blue-200" : "border-gray-100 hover:shadow-md"
                  }`}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "both"
                  }}
                >
                  {/* Заголовок заказа */}
                  <div
                    className={`p-4 md:p-5 cursor-pointer transition-all duration-300 ${
                      isExpired ? "bg-gray-50" : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent"
                    }`}
                    onClick={() => setOpenId(isOpen ? null : order.OrderID)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-lg">
                            Заказ #{order.OrderID}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${statusColor[order.Status]}`}>
                            {statusMap[order.Status]}
                          </span>
                          {ARCHIVE_STATUSES.has(order.Status) && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              <Archive size={12} className="inline mr-1" />
                              Архив
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {orderDate.toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                            {order.TotalAmount.toLocaleString()} BYN
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.items.reduce((sum, i) => sum + i.Quantity, 0)} товаров
                          </p>
                        </div>
                        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                          <ChevronDown size={20} className="text-blue-500 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Детали заказа */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="border-t border-gray-100 p-4 md:p-5 bg-gradient-to-r from-gray-50/50 to-white">
                      <h4 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                        <ShoppingBag size={16} />
                        Товары в заказе:
                      </h4>

                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-lg p-3 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]"
                            style={{
                              animation: `slideInRight 0.3s ease-out ${idx * 0.05}s both`
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={item.MainImageURL ? `${API}${item.MainImageURL}` : "/no-image.png"}
                                  alt={item.Name}
                                  className="w-14 h-14 rounded-lg object-cover border transform transition-transform duration-300 hover:scale-110"
                                />
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
                                  {item.Quantity}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm line-clamp-2 max-w-[200px]">
                                  {item.Name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.Price.toLocaleString()} BYN / шт.
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-blue-600 sm:text-right">
                              {(item.Quantity * item.Price).toLocaleString()} BYN
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 text-right">
                        <p className="text-sm text-gray-500">
                          Итого:{" "}
                          <span className="font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent text-xl">
                            {order.TotalAmount.toLocaleString()} BYN
                          </span>
                        </p>
                      </div>

                      {tab === "archive" && (
                        <div className="mt-4 pt-2 border-t border-gray-100">
                          <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-2">
                            <span>🎉</span>
                            Этот заказ завершён. Спасибо за покупку! 
                            <span>🐾</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
            transform: translateY(30px);
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

        @keyframes slideIn {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
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
            transform: translateY(-10px);
          }
        }

        .animate-slide-down {
          animation: slideDown 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }

        .animate-slide-up-delayed {
          animation: slideUp 0.5s ease-out 0.2s both;
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
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