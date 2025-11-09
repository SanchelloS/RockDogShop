import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // 🔹 Загрузка корзины из БД при авторизации
  const loadCartFromServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке корзины:", err);
    }
  };

  useEffect(() => {
    loadCartFromServer();
  }, []); // ✅ запускается при загрузке страницы

  // 🔹 Добавление товара
  const addToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Пожалуйста, войдите, чтобы добавить товар в корзину.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/cart/add",
        { productId: product.ProductID, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // после добавления обновляем корзину
      await loadCartFromServer();
    } catch (err) {
      console.error("Ошибка при добавлении в корзину:", err);
    }
  };

  // 🔹 Удаление
  const removeFromCart = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCartFromServer();
    } catch (err) {
      console.error("Ошибка при удалении:", err);
    }
  };

  // 🔹 Очистка корзины при выходе
  const clearCart = () => setCart([]);

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.Price * item.Quantity,
    0
  );
  // 🔹 Обновление количества товаров (увеличить / уменьшить)
  const updateQuantity = async (productId, delta) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.post(
        "http://localhost:5000/api/cart/add",
        { productId, quantity: delta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadCartFromServer(); // обновляем корзину
    } catch (err) {
      console.error("Ошибка обновления количества:", err);
    }
  };

 return (
  <CartContext.Provider
    value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      updateQuantity, // 🟢 добавь эту строку
      totalPrice,
      loadCartFromServer,
    }}
  >
    {children}
  </CartContext.Provider>
);

  
};
