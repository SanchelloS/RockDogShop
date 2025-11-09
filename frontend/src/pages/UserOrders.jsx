import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState(null);
  const token = localStorage.getItem("token");

  const statusMap = {
    Pending: "⏳ Ожидает обработки",
    Paid: "💳 Оплачен",
    Shipped: "📦 Отправлен",
    Delivered: "✅ Доставлен",
    Cancelled: "❌ Отменён",
  };

  const statusColor = {
    Pending: "text-yellow-600 bg-yellow-50 border-yellow-100",
    Paid: "text-blue-600 bg-blue-50 border-blue-100",
    Shipped: "text-indigo-600 bg-indigo-50 border-indigo-100",
    Delivered: "text-green-600 bg-green-50 border-green-100",
    Cancelled: "text-red-600 bg-red-50 border-red-100",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await axios.get("http://localhost:5000/api/orders", {
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
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg animate-pulse">
        Загружаем ваши заказы...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md shadow-lg rounded-3xl p-8 border border-gray-100 animate-fade-in">
        <h2 className="text-3xl font-bold mb-10 text-center text-gray-800 flex items-center justify-center gap-3">
          <Package className="text-blue-600" size={32} />
          Мои заказы
        </h2>

        {orders.length === 0 ? (
          <div className="text-center text-gray-500 text-lg animate-fade-in">
            😔 У вас пока нет заказов
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const isOpen = openOrderId === order.OrderID;

              return (
                <div
                  key={order.OrderID}
                  className={`rounded-2xl border border-gray-100 shadow-sm bg-white/70 hover:shadow-md transition-all duration-500 transform hover:-translate-y-1 ${
                    isOpen ? "ring-2 ring-blue-100" : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className="flex justify-between items-center p-5 cursor-pointer select-none"
                    onClick={() =>
                      setOpenOrderId(isOpen ? null : order.OrderID)
                    }
                  >
                    <div>
                      <p className="font-bold text-gray-800 text-lg">
                        Заказ №{order.OrderID}
                      </p>
                      <p className="text-sm text-gray-500">
                        📅{" "}
                        {new Date(order.OrderDate).toLocaleString("ru-BY", {
                          timeZone: "Europe/Minsk",
                        })}
                      </p>
                      <p
                        className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-xl border ${statusColor[order.Status]}`}
                      >
                        {statusMap[order.Status] || order.Status}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <p className="text-xl font-bold text-blue-600">
                        {order.TotalAmount} BYN
                      </p>
                      {isOpen ? (
                        <ChevronUp
                          size={24}
                          className="text-blue-500 mt-1 transition-transform duration-300 rotate-180"
                        />
                      ) : (
                        <ChevronDown
                          size={24}
                          className="text-gray-400 mt-1 transition-transform duration-300"
                        />
                      )}
                    </div>
                  </div>

                  {/* === ПЛАВНОЕ РАСКРЫТИЕ === */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-5 animate-fade-in-down">
                      <h4 className="font-semibold mb-3 text-gray-700">
                        Товары в заказе:
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100 hover:bg-gray-100 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={
                                  it.MainImageURL
                                    ? `http://localhost:5000${it.MainImageURL}`
                                    : "/no-image.png"
                                }
                                alt={it.Name}
                                className="w-16 h-16 object-cover rounded-lg shadow-sm hover:scale-105 transition-transform duration-300"
                              />
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {it.Name}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {it.Quantity} × {it.Price} BYN ={" "}
                                  <span className="font-bold text-blue-600">
                                    {it.Quantity * it.Price} BYN
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
