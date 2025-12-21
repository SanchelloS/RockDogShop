import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api",
});

// ✅ Добавляем токен, если он есть
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Глобальная обработка 401: токен умер — выкидываем
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // чистим всё, что связано с авторизацией
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // если где-то сохранял
      localStorage.removeItem("cart"); // если надо (по желанию)

      // редиректим на login (без useNavigate)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
