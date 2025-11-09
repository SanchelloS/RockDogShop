import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
});

// Добавляем токен, если он есть
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
