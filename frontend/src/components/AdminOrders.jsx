import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { ChevronDown, ChevronUp, Trash2, RefreshCw, Filter, ArrowUpDown, X, AlertTriangle, CheckCircle, XCircle, Info, Loader2 } from "lucide-react";

// Подключение к серверу через .env файл
const API_URL = import.meta.env.VITE_API_URL;

// 🔹 Компонент уведомлений (Toast)
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <Info className="w-5 h-5 text-yellow-500" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return createPortal(
    <div className="fixed top-20 right-4 z-[10000] animate-slide-in-right">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${colors[type]} min-w-[280px] max-w-md`}>
        {icons[type]}
        <p className="text-sm flex-1">{message}</p>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition">
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
};

// 🔹 Модалка подтверждения удаления - вынесена за пределы компонента
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, order, isDeleting }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-popup">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
            Удалить заказ?
          </h3>
          
          <p className="text-gray-600 text-center mb-4">
            Вы уверены, что хотите удалить заказ <br />
            <span className="font-semibold text-gray-800">#{order?.OrderID}</span>?
          </p>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            Пользователь: <span className="font-medium">{order?.UserLogin}</span><br />
            Сумма: <span className="font-medium">{order?.TotalAmount} BYN</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition"
              disabled={isDeleting}
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Удаление...
                </span>
              ) : (
                "🗑 Удалить"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("token");

  const statusMap = {
    Pending: "⏳ Ожидает обработки",
    Paid: "💳 Оплачен",
    Shipped: "📦 Отправлен",
    Delivered: "✅ Доставлен",
    Cancelled: "❌ Отменён",
  };

  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-800",
    Paid: "bg-blue-100 text-blue-800",
    Shipped: "bg-indigo-100 text-indigo-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  const showToast = (text, type = "success") => {
    setToast({ text, type });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filterStatus, sortOrder]);

  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDeleteModal]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch {
      showToast("Ошибка при загрузке заказов", "error");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let list = [...orders];
    if (filterStatus !== "all") {
      list = list.filter((o) => o.Status === filterStatus);
    }
    list.sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.OrderDate) - new Date(b.OrderDate)
        : new Date(b.OrderDate) - new Date(a.OrderDate)
    );
    setFilteredOrders(list);
  }

  async function updateStatus(orderId, newStatus) {
    try {
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("✅ Статус обновлён", "success");
      fetchOrders();
    } catch {
      showToast("❌ Ошибка при обновлении статуса", "error");
    }
  }

  function handleDeleteClick(order) {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await axios.delete(`${API_URL}/api/orders/${orderToDelete.OrderID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("🗑 Заказ удалён", "success");
      setOrders((prev) => prev.filter((o) => o.OrderID !== orderToDelete.OrderID));
      if (selectedOrder?.OrderID === orderToDelete.OrderID) setSelectedOrder(null);
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch {
      showToast("❌ Ошибка при удалении заказа", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function toggleOrderDetails(orderId) {
    if (selectedOrder?.OrderID === orderId) {
      setSelectedOrder((prev) => ({ ...prev, closing: true }));
      setTimeout(() => setSelectedOrder(null), 300);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder({ ...res.data, closing: false });
    } catch {
      showToast("Ошибка при загрузке деталей", "error");
    }
  }

  const FiltersContent = () => (
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
      >
        <option value="all">📋 Все заказы</option>
        {Object.entries(statusMap).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <button
        onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
        className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-gray-800 transition-all"
      >
        <ArrowUpDown size={16} /> 
        {sortOrder === "asc" ? "📅 Сначала старые" : "📅 Сначала новые"}
      </button>

      <button
        onClick={fetchOrders}
        className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-all"
      >
        <RefreshCw size={16} /> Обновить
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          📦 Заказы
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {filteredOrders.length} / {orders.length}
          </span>
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg"
          >
            <Filter size={16} /> Фильтры
          </button>
          <button
            onClick={fetchOrders}
            className="lg:hidden bg-blue-100 text-blue-700 p-2 rounded-lg"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Десктопные фильтры */}
      <div className="hidden lg:block bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <FiltersContent />
      </div>

      {/* Мобильные фильтры */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Фильтры заказов</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FiltersContent />
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список заказов */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          📭 Нет заказов по выбранным критериям
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, i) => (
            <div
              key={order.OrderID}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {/* Заголовок заказа */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  {/* Левая часть */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base sm:text-lg text-gray-800">
                        Заказ #{order.OrderID}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.Status] || "bg-gray-100"}`}>
                        {statusMap[order.Status]}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      📅 {new Date(order.OrderDate).toLocaleString("ru-BY", { timeZone: "Europe/Minsk" })}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      👤 {order.UserLogin}
                    </p>
                  </div>

                  {/* Правая часть */}
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <p className="text-lg sm:text-xl font-bold text-blue-600">
                      {order.TotalAmount} BYN
                    </p>
                    <select
                      value={order.Status}
                      onChange={(e) => updateStatus(order.OrderID, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200 outline-none w-full sm:w-auto"
                    >
                      {Object.entries(statusMap).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => toggleOrderDetails(order.OrderID)}
                    className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    {selectedOrder?.OrderID === order.OrderID && !selectedOrder.closing ? (
                      <>Скрыть <ChevronUp size={16} /></>
                    ) : (
                      <>Подробнее <ChevronDown size={16} /></>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(order)}
                    className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 size={16} /> Удалить
                  </button>
                </div>
              </div>

              {/* Детали заказа */}
              {selectedOrder?.OrderID === order.OrderID && (
                <div className={`bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-100 transition-all duration-500 ease-in-out ${
                  selectedOrder.closing ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
                } overflow-hidden`}>
                  {/* Адрес */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">📍 Адрес доставки</h4>
                    <p className="text-sm text-gray-600">
                      {selectedOrder.City}, {selectedOrder.Street}, {selectedOrder.House}
                      {selectedOrder.Apartment && `, кв. ${selectedOrder.Apartment}`}
                      {selectedOrder.PostalCode && `, ${selectedOrder.PostalCode}`}
                    </p>
                  </div>

                  {/* Товары */}
                  <h4 className="font-semibold text-gray-700 mb-2">🛍️ Товары:</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-all">
                        <img
                          src={item.MainImageURL ? `${API_URL}${item.MainImageURL}` : "/no-image.png"}
                          alt={item.Name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded object-cover border"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{item.Name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {item.Quantity} × {item.Price} BYN = <span className="font-bold text-blue-600">{item.Quantity * item.Price} BYN</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right mt-4 pt-3 border-t border-gray-200">
                    <p className="font-bold text-blue-700 text-base sm:text-lg">
                      Итого: {selectedOrder.TotalAmount} BYN
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDelete}
        order={orderToDelete}
        isDeleting={isDeleting}
      />

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        
        @keyframes popup {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-popup { animation: popup 0.2s ease-out; }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
}