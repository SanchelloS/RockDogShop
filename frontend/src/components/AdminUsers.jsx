import { useState, useEffect } from "react";
import axios from "axios";
import { Search, RefreshCw, Edit3, Trash2, X, Save } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    applyFilters();
  }, [users, search, filterRole]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch {
      showMessage("Ошибка при загрузке пользователей", "error");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let list = [...users];
    if (filterRole !== "all") list = list.filter((u) => u.Role === filterRole);
    if (search.trim()) {
      list = list.filter(
        (u) =>
          u.Login.toLowerCase().includes(search.toLowerCase()) ||
          u.Email?.toLowerCase().includes(search.toLowerCase()) ||
          String(u.UserID).includes(search)
      );
    }
    setFilteredUsers(list);
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSaveEdit() {
    try {
      const payload = {
        login: editingUser.Login,
        email: editingUser.Email,
        phone: editingUser.Phone,
        role: editingUser.Role,
      };
      if (editingUser.password) payload.password = editingUser.password;

      await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser.UserID}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage("Пользователь обновлён", "success");
      setEditingUser(null);
      fetchUsers();
    } catch {
      showMessage("Ошибка при обновлении", "error");
    }
  }

  async function deleteUser(id) {
    if (!window.confirm("Удалить пользователя и все его данные?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("Пользователь удалён", "success");
      fetchUsers();
    } catch {
      showMessage("Ошибка при удалении", "error");
    }
  }

  return (
    <div className="animate-fade-in">
      {/* === Header === */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          👥 Пользователи
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по логину, email или ID"
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">Все роли</option>
            <option value="User">Пользователи</option>
            <option value="Admin">Администраторы</option>
          </select>
          <button
            onClick={fetchUsers}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-all"
          >
            <RefreshCw size={16} /> Обновить
          </button>
        </div>
      </div>

      {/* === Сообщения === */}
      {message && (
        <div
          className={`p-3 mb-4 rounded-lg text-white text-sm shadow-md transition-all duration-300 ${
            message.type === "success"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* === Список пользователей === */}
      {loading ? (
        <p className="text-gray-500 animate-pulse">Загрузка пользователей...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">Пользователи не найдены</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-100 rounded-xl shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Логин</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Телефон</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-600">Роль</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr
                  key={u.UserID}
                  className={`border-t hover:bg-gray-50 transition-all duration-200 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-3 text-gray-700">{u.UserID}</td>
                  <td className="p-3 font-medium">{u.Login}</td>
                  <td className="p-3">{u.Email}</td>
                  <td className="p-3">{u.Phone || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.Role === "Admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.Role}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2 justify-center">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Edit3 size={16} /> Редактировать
                    </button>
                    <button
                      onClick={() => deleteUser(u.UserID)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === Модалка редактирования === */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center animate-blur-in z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-slide-down">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                ✏️ Редактирование пользователя
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Логин"
                value={editingUser.Login}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, Login: e.target.value })
                }
              />
              <input
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Email"
                value={editingUser.Email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, Email: e.target.value })
                }
              />
              <input
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Телефон"
                value={editingUser.Phone || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, Phone: e.target.value })
                }
              />
              <select
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 outline-none"
                value={editingUser.Role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, Role: e.target.value })
                }
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
              <input
                className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="Новый пароль (опционально)"
                type="password"
                onChange={(e) =>
                  setEditingUser({ ...editingUser, password: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-1"
              >
                <Save size={16} /> Сохранить
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-1"
              >
                <X size={16} /> Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
