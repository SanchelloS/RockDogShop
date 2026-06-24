import { createContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";

// Подключение к серверу через .env файл
const API_URL = import.meta.env.VITE_API_URL;

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Загрузка корзины из БД
  const loadCartFromServer = useCallback(async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setCart([]);
      setIsInitialized(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (Array.isArray(res.data)) {
        setCart(res.data);
      } else {
        console.warn("API вернул не массив:", res.data);
        setCart([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCart([]);
      } else {
        setError("Не удалось загрузить корзину");
        toast.error("Ошибка загрузки корзины");
      }
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // 🔹 Добавление товара с оптимистичным обновлением
  const addToCart = useCallback(async (product, quantity = 1) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      toast.error("Войдите, чтобы добавить товар в корзину");
      return { success: false, needAuth: true };
    }

    // Оптимистичное обновление UI
    const existingItem = cart.find(item => item.ProductID === product.ProductID);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item =>
        item.ProductID === product.ProductID
          ? { ...item, Quantity: item.Quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, Quantity: quantity }];
    }
    
    setCart(newCart);
    toast.success("Товар добавлен в корзину");

    try {
      await axios.post(
        `${API_URL}/api/cart/add`,
        { productId: product.ProductID, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await loadCartFromServer();
      return { success: true };
    } catch (err) {
      // Откат при ошибке
      setCart(cart);
      toast.error("Ошибка при добавлении товара");
      console.error("Ошибка при добавлении в корзину:", err);
      
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return { success: false, needAuth: true };
      }
      return { success: false };
    }
  }, [cart, loadCartFromServer]);

  // 🔹 Удаление товара с оптимистичным обновлением
  const removeFromCart = useCallback(async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const itemToRemove = cart.find(item => item.ProductID === id);
    if (!itemToRemove) return;

    // Оптимистичное обновление
    const newCart = cart.filter(item => item.ProductID !== id);
    setCart(newCart);
    toast.success("Товар удалён из корзины");

    try {
      await axios.delete(`${API_URL}/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCartFromServer();
    } catch (err) {
      // Откат при ошибке
      setCart(cart);
      toast.error("Ошибка при удалении");
      console.error("Ошибка при удалении:", err);
    }
  }, [cart, loadCartFromServer]);

  // 🔹 Обновление количества
  const updateQuantity = useCallback(async (productId, delta) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newQuantity = (cart.find(item => item.ProductID === productId)?.Quantity || 0) + delta;
    if (newQuantity < 1) return;

    // Оптимистичное обновление
    const newCart = cart.map(item =>
      item.ProductID === productId
        ? { ...item, Quantity: newQuantity }
        : item
    );
    setCart(newCart);

    try {
      await axios.post(
        `${API_URL}/api/cart/add`,
        { productId, quantity: delta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadCartFromServer();
    } catch (err) {
      // Откат при ошибке
      setCart(cart);
      toast.error("Ошибка обновления количества");
      console.error("Ошибка обновления количества:", err);
    }
  }, [cart, loadCartFromServer]);

  // 🔹 Очистка корзины
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // 🔹 Полная очистка (при выходе)
  const resetCart = useCallback(() => {
    setCart([]);
    setError(null);
  }, []);

  // 🔹 Подсчет общего количества товаров
  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.Quantity || 0), 0);
  }, [cart]);

  // 🔹 Подсчет общей суммы
  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.Price || 0) * (item.Quantity || 0), 0);
  }, [cart]);

  // 🔹 Проверка, есть ли товар в корзине
  const isInCart = useCallback((productId) => {
    return cart.some(item => item.ProductID === productId);
  }, [cart]);

  // 🔹 Получение количества конкретного товара
  const getItemQuantity = useCallback((productId) => {
    return cart.find(item => item.ProductID === productId)?.Quantity || 0;
  }, [cart]);

  // Инициализация корзины
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadCartFromServer();
    } else {
      setIsInitialized(true);
    }
  }, [loadCartFromServer]);

  const value = useMemo(() => ({
    cart,
    isLoading,
    isInitialized,
    error,
    totalPrice,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    resetCart,
    loadCartFromServer,
    isInCart,
    getItemQuantity,
  }), [cart, isLoading, isInitialized, error, totalPrice, totalItems, addToCart, removeFromCart, updateQuantity, clearCart, resetCart, loadCartFromServer, isInCart, getItemQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};