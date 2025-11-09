import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp, Trash2, RefreshCw, Filter, ArrowUpDown } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const token = localStorage.getItem("token");

  const statusMap = {
    Pending: "🟡 Ожидает обработки",
    Paid: "💰 Оплачен",
    Shipped: "📦 Отправлен",
    Delivered: "✅ Доставлен",
    Cancelled: "❌ Отменён",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filterStatus, sortOrder]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/orders/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch {
      showMessage("Ошибка при загрузке заказов", "error");
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
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage("Статус обновлён", "success");
      fetchOrders();
    } catch {
      showMessage("Ошибка при обновлении статуса", "error");
    }
  }

  async function deleteOrder(orderId) {
    if (!window.confirm("Удалить этот заказ?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("🗑 Заказ удалён", "success");
      setOrders((prev) => prev.filter((o) => o.OrderID !== orderId));
      if (selectedOrder?.OrderID === orderId) setSelectedOrder(null);
    } catch {
      showMessage("Ошибка при удалении заказа", "error");
    }
  }

  async function toggleOrderDetails(orderId) {
    if (selectedOrder?.OrderID === orderId) {
      // плавное скрытие
      setSelectedOrder((prev) => ({ ...prev, closing: true }));
      setTimeout(() => setSelectedOrder(null), 300);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder({ ...res.data, closing: false });
    } catch {
      showMessage("Ошибка при загрузке деталей", "error");
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          📦 Заказы
        </h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">Все заказы</option>
            {Object.entries(statusMap).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 text-gray-800 transition-all"
          >
            <ArrowUpDown size={16} /> {sortOrder === "asc" ? "Сначала старые" : "Сначала новые"}
          </button>

          <button
            onClick={fetchOrders}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-all"
          >
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 mb-4 rounded-lg text-white text-sm shadow-md transition-all duration-300 ${
            message.type === "success"
              ? "bg-green-500"
              : message.type === "error"
              ? "bg-red-500"
              : "bg-yellow-400 text-black"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 animate-pulse">Загрузка заказов...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">Нет заказов по выбранным критериям</p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, i) => (
            <div
              key={order.OrderID}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex flex-wrap justify-between items-center p-4">
                <div>
                  <p className="font-semibold text-lg">
                    Заказ №{order.OrderID}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.OrderDate).toLocaleString("ru-BY", {
                      timeZone: "Europe/Minsk",
                    })}
                  </p>
                  <p className="text-gray-600 text-sm">
                    👤 {order.UserLogin}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-blue-600 font-semibold text-lg">
                    {order.TotalAmount} BYN
                  </p>
                  <select
                    value={order.Status}
                    onChange={(e) => updateStatus(order.OrderID, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 mt-1 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    {Object.entries(statusMap).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => toggleOrderDetails(order.OrderID)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                  >
                    {selectedOrder?.OrderID === order.OrderID && !selectedOrder.closing ? (
                      <>
                        Скрыть <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        Подробнее <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteOrder(order.OrderID)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Trash2 size={16} /> Удалить
                  </button>
                </div>
              </div>

              {/* === Плавное раскрытие деталей === */}
              {selectedOrder?.OrderID === order.OrderID && (
                <div
                  className={`bg-gray-50 px-6 py-4 border-t border-gray-100 transition-all duration-500 ease-in-out ${
                    selectedOrder.closing
                      ? "max-h-0 opacity-0"
                      : "max-h-[1000px] opacity-100"
                  } overflow-hidden`}
                >
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Адрес:</strong>{" "}
                    {selectedOrder.City}, {selectedOrder.Street},{" "}
                    {selectedOrder.House}
                    {selectedOrder.PostalCode && `, ${selectedOrder.PostalCode}`}
                  </p>

                  <h4 className="font-semibold mb-2">🛍️ Товары:</h4>
                  <div className="grid gap-2">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.ProductID}
                        className="flex items-center gap-3 bg-white rounded-lg p-2 border border-gray-200 hover:shadow-sm transition-all"
                      >
                        <img
                          src={
                            item.MainImageURL
                              ? `http://localhost:5000${item.MainImageURL}`
                              : "/no-image.png"
                          }
                          alt={item.Name}
                          className="w-14 h-14 rounded object-cover border"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.Name}</p>
                          <p className="text-sm text-gray-600">
                            {item.Quantity} × {item.Price} BYN
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right mt-4 font-semibold text-blue-700 text-lg">
                    Итого: {selectedOrder.TotalAmount} BYN
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
