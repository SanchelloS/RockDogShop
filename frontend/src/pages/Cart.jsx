import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";

export default function Cart() {
  const { cart, removeFromCart, loadCartFromServer } = useContext(CartContext);
  const [visibleItems, setVisibleItems] = useState([]); // Для анимации появления
  const [updating, setUpdating] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Загрузка корзины
  useEffect(() => {
    if (token) loadCartFromServer();
  }, [token]);

  // Плавное появление товаров
// 🔥 контролируем анимацию появления и добавления
useEffect(() => {
  const currentIds = cart.map((i) => i.ProductID);

  // новые элементы, которых не было раньше
  const newIds = currentIds.filter((id) => !visibleItems.includes(id));

  // удалённые элементы
  const removedIds = visibleItems.filter((id) => !currentIds.includes(id));

  // убираем удалённые плавно
  if (removedIds.length > 0) {
    setVisibleItems((prev) => prev.filter((id) => !removedIds.includes(id)));
  }

  // добавляем только новые (fade-in)
  if (newIds.length > 0) {
    newIds.forEach((id, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, id]);
      }, index * 100);
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cart.length]);



  const getCurrentQty = (id) =>
    cart.find((item) => item.ProductID === id)?.Quantity || 0;

  const updateQuantity = async (productId, newQty, e) => {
    e.stopPropagation(); // ⚡ Не переходить при клике на кнопку
    if (newQty < 1) return;
    setUpdating(true);
    try {
      await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: newQty - getCurrentQty(productId),
        }),
      });
      await loadCartFromServer();
    } catch (e) {
      console.error("Ошибка обновления:", e);
    } finally {
      setUpdating(false);
    }
  };

  // Удаление с анимацией
  const handleRemove = (id, e) => {
    e.stopPropagation(); // ⚡ Не переходить при удалении
    setVisibleItems((prev) => prev.filter((pid) => pid !== id));
    setTimeout(() => removeFromCart(id), 300);
  };

  const total = cart.reduce((sum, item) => sum + item.Price * item.Quantity, 0);

  if (!token) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center animate-fade-in">
        <h2 className="text-4xl font-bold mb-4 text-gray-800">Корзина</h2>
        <p className="text-gray-600 text-lg">
          Авторизуйтесь, чтобы просматривать корзину 🐾
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/40 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md shadow-lg rounded-3xl p-8 border border-gray-100 animate-fade-in">
        <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
          🛍️ Ваша корзина
        </h2>

        {cart.length === 0 ? (
          <div className="text-center text-gray-500 text-lg">
            Корзина пуста 🐾
          </div>
        ) : (
          <>
            {/* Список товаров */}
            <div className="divide-y divide-gray-200">
              {cart.map((item, index) => {
                const isVisible = visibleItems.includes(item.ProductID);
                return (
                  <div
                    key={item.ProductID}
                    onClick={() => navigate(`/product/${item.ProductID}`)} // ✅ переход при клике
                    className={`flex flex-col sm:flex-row justify-between items-center py-5 gap-4 px-3 transform transition-all duration-500 ease-out cursor-pointer rounded-xl hover:bg-gray-50
                      ${
                        isVisible
                          ? "opacity-100 translate-y-0 scale-100"
                          : "opacity-0 -translate-y-2 scale-95"
                      }`}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    {/* Инфо о товаре */}
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <img
                        src={
                          item.MainImageURL
                            ? `http://localhost:5000${item.MainImageURL}`
                            : "/no-image.png"
                        }
                        alt={item.Name}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                      />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800 hover:text-blue-600 transition-colors">
                          {item.Name}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {item.Price} BYN за штуку
                        </p>
                      </div>
                    </div>

                    {/* Кол-во и кнопки */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) =>
                          updateQuantity(item.ProductID, item.Quantity - 1, e)
                        }
                        className="p-2 bg-gray-100 hover:bg-blue-100 rounded-md active:scale-95 transition-all disabled:opacity-50"
                        disabled={updating}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-semibold text-lg w-6 text-center">
                        {item.Quantity}
                      </span>
                      <button
                        onClick={(e) =>
                          updateQuantity(item.ProductID, item.Quantity + 1, e)
                        }
                        className="p-2 bg-gray-100 hover:bg-blue-100 rounded-md active:scale-95 transition-all disabled:opacity-50"
                        disabled={updating}
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        onClick={(e) => handleRemove(item.ProductID, e)}
                        className="text-red-500 hover:text-red-600 ml-4 transition-transform hover:scale-110"
                        title="Удалить товар"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Итог */}
            <div className="mt-10 border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xl font-semibold text-gray-800">
                  Итого:
                  <span className="text-blue-600 ml-2 font-bold text-2xl">
                    {total.toLocaleString()} BYN
                  </span>
                </p>

                <button
                  onClick={() => navigate("/checkout")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-blue-300/40 transition-all duration-300"
                >
                  Оформить заказ
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
