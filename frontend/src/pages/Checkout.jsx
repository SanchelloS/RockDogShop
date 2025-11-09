import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { Truck, CreditCard, CheckCircle2, X } from "lucide-react";

export default function Checkout() {
  const { cart, totalPrice, clearCart, loadCartFromServer } = useContext(CartContext);
  const [form, setForm] = useState({
    city: "",
    street: "",
    house: "",
    apartment: "",
    postalCode: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Ваша корзина пуста!");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/checkout",
        { address: form },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowSuccess(true);
      clearCart();
      await loadCartFromServer();

      // Переход через 2 секунды
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/");
      }, 3500);
    } catch (err) {
      console.error("Ошибка при оформлении заказа:", err);
      alert("❌ Ошибка при оформлении заказа.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative flex flex-col items-center">
      {/* ✅ Центрированная модалка без затемнения */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-50/80 backdrop-blur-[1px] transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200 transition-transform duration-300 animate-popup relative">

            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <CheckCircle2 className="mx-auto text-green-500 w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Заказ успешно оформлен!
            </h2>
            <p className="text-gray-600">
              Спасибо за покупку 🐾<br />Вы будете перенаправлены на главную страницу...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl w-full">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">
          Оформление заказа
        </h2>

        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                <Truck size={20} /> Адрес доставки
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="Город"
                  value={form.city}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  name="street"
                  placeholder="Улица"
                  value={form.street}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  name="house"
                  placeholder="Дом"
                  value={form.house}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <input
                  type="text"
                  name="apartment"
                  placeholder="Квартира"
                  value={form.apartment}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  name="postalCode"
                  placeholder="Почтовый индекс"
                  value={form.postalCode}
                  onChange={handleChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none sm:col-span-2"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-700">
                <CreditCard size={20} /> Оплата и подтверждение
              </h3>

              <div className="flex justify-between items-center text-lg font-semibold text-gray-800 mb-4">
                <span>Итого к оплате:</span>
                <span className="text-blue-600">{totalPrice} BYN</span>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
              >
                ✅ Подтвердить заказ
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          После оформления с вами свяжется наш менеджер для подтверждения доставки 🐾
        </p>
      </div>
    </div>
  );
}
