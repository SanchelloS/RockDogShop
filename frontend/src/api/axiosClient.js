import axios from "axios";

// Базовый URL из .env
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Создаем axios инстанс с правильным baseURL
const axiosClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Интерсептор запросов - добавляем токен, если он есть
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Интерсептор ответов - глобальная обработка ошибок
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    
    // 401 - Не авторизован / токен умер
    if (status === 401) {
      // Очищаем localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Редирект на страницу логина (если мы не там уже)
      const publicPaths = ["/login", "/register"];
      const currentPath = window.location.pathname;
      
      if (!publicPaths.includes(currentPath)) {
        // Запоминаем, куда хотел попасть пользователь
        sessionStorage.setItem("redirectAfterLogin", currentPath);
        window.location.href = "/login";
      }
    }
    
    // 403 - Доступ запрещен
    if (status === 403) {
      console.error("❌ Доступ запрещен:", error?.response?.data?.message);
    }
    
    // 404 - Не найдено
    if (status === 404) {
      console.error("❌ Ресурс не найден:", error?.response?.data?.message);
    }
    
    // 500 - Ошибка сервера
    if (status >= 500) {
      console.error("❌ Ошибка сервера:", error?.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;