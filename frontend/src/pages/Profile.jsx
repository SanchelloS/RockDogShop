import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle, User, Mail, Phone, Lock, Save } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ login: "", email: "", phone: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "Admin" || user?.Role === "Admin";

  // Загружаем профиль - используем единый эндпоинт для всех
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Единый эндпоинт для всех пользователей
    const endpoint = "/users/me";
    
    axiosClient
      .get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userData = res.data;
        setProfile(userData);
        setForm({
          login: userData.Login || userData.login || "",
          email: userData.Email || userData.email || "",
          phone: userData.Phone || userData.phone || "",
          password: "",
        });
      })
      .catch((err) => {
        console.error("Ошибка загрузки профиля:", err);
        setMessage("Ошибка при загрузке профиля");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("❌ Сессия истекла, войдите заново");
      setTimeout(() => navigate("/login"), 1500);
      setSaving(false);
      return;
    }

    // Единый эндпоинт для всех
    const endpoint = "/users/me";
    
    const payload = {
      login: form.login,
      email: form.email,
      phone: form.phone,
    };
    if (form.password) {
      payload.password = form.password;
    }

    try {
      await axiosClient.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Профиль успешно обновлён!");
      setTimeout(() => setMessage(""), 2500);
      
      // Обновляем данные пользователя в localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const updatedUser = { ...JSON.parse(storedUser), ...payload };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Ошибка обновления:", err);
      setMessage(err.response?.data?.message || "❌ Ошибка при обновлении данных");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <p className="text-center text-gray-600 animate-pulse">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 bg-white rounded-2xl shadow-lg p-8 border border-gray-100 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <User className="text-blue-600" /> 
        {isAdmin ? "Админ-профиль" : "Мой профиль"}
      </h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Логин</label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400">
            <User className="text-gray-400 mr-2" size={18} />
            <input
              type="text"
              name="login"
              value={form.login}
              onChange={handleChange}
              className="w-full bg-transparent outline-none text-gray-800"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400">
            <Mail className="text-gray-400 mr-2" size={18} />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-transparent outline-none text-gray-800"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Телефон</label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400">
            <Phone className="text-gray-400 mr-2" size={18} />
            <input
              type="text"
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              className="w-full bg-transparent outline-none text-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Новый пароль</label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-400">
            <Lock className="text-gray-400 mr-2" size={18} />
            <input
              type="password"
              name="password"
              placeholder="Оставьте пустым, если не меняете"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-transparent outline-none text-gray-800"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Минимум 6 символов</p>
        </div>

        {message && (
          <div
            className={`text-center py-2 rounded-lg font-medium transition-all ${
              message.startsWith("✅")
                ? "text-green-600 bg-green-50 border border-green-200"
                : "text-red-600 bg-red-50 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Save size={18} className="animate-spin" /> Сохранение...
              </>
            ) : (
              <>
                <CheckCircle size={18} /> Сохранить изменения
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-red-500 hover:text-red-700 font-medium transition"
          >
            🚪 Выйти из аккаунта
          </button>
        </div>
      </form>
    </div>
  );
}