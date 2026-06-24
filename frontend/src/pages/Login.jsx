import { useState, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { ArrowLeft } from "lucide-react";
import axiosClient from "../api/axiosClient";

export default function Login() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useContext(AuthContext);
  const { loadCartFromServer } = useContext(CartContext);

  // Откуда пришли (для редиректа после входа)
  const from = location.state?.from || "/";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/users/login", form);

      // Сохраняем токен и данные пользователя через контекст
      login(res.data.user, res.data.token);

      // Загружаем корзину после входа
      if (loadCartFromServer) {
        await loadCartFromServer();
      }

      // Редирект (учитывает basename автоматически)
      navigate(from);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Неверные данные");
    } finally {
      setLoading(false);
    }
  };

  // Кнопка возврата на главную
  const handleGoHome = () => {
    navigate("/"); // basename добавится автоматически
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-200 animate-fade-in relative"
      >
        {/* Кнопка "На главную" */}
        <button
          type="button"
          onClick={handleGoHome}
          className="absolute top-4 left-4 text-gray-500 hover:text-blue-600 transition flex items-center gap-1 text-sm"
          title="Вернуться на главную"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">На главную</span>
        </button>

        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Вход
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Добро пожаловать
        </p>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 font-medium">
              Логин <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="login"
              placeholder="Введите логин"
              value={form.login}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">
              Пароль <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Введите пароль"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-6 py-3 rounded-lg font-semibold shadow-md transition-all ${
            loading
              ? "bg-blue-300 text-white cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:scale-[1.02]"
          }`}
        >
          {loading ? "Входим..." : "Войти"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Нет аккаунта?{" "}
          <Link
            to="/register"
            state={{ from }}
            className="text-blue-600 hover:text-blue-800 font-medium transition"
          >
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}