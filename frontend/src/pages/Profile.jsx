import { useEffect, useState, useContext } from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle, User, Mail, Phone, Lock, Save } from "lucide-react";

export default function Profile() {
  const { token, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ login: "", email: "", phone: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Загружаем профиль
  useEffect(() => {
    axiosClient
      .get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProfile(res.data);
        setForm({
          login: res.data.Login,
          email: res.data.Email,
          phone: res.data.Phone,
          password: "",
        });
      })
      .catch(() => setMessage("Ошибка при загрузке профиля"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    axiosClient
      .put("/users/me", form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMessage("✅ Профиль успешно обновлён!");
        setTimeout(() => setMessage(""), 2500);
      })
      .catch(() => setMessage("❌ Ошибка при обновлении данных"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600 animate-pulse">Загрузка профиля...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8 border border-gray-100 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <User className="text-blue-600" /> Мой профиль
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
              value={form.phone}
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

        <div className="flex justify-between items-center mt-6">
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
            onClick={logout}
            className="text-red-500 hover:text-red-700 font-medium transition"
          >
            🚪 Выйти из аккаунта
          </button>
        </div>
      </form>
    </div>
  );
}
