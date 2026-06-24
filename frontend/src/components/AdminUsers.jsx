import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Search, RefreshCw, Edit3, Trash2, X, Save, Filter, AlertTriangle, Loader2, CheckCircle, XCircle, Info } from "lucide-react";

// Подключение к серверу через .env файл
const API_URL = import.meta.env.VITE_API_URL;

// 🔹 Компонент уведомлений (Toast)
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <Info className="w-5 h-5 text-yellow-500" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return createPortal(
    <div className="fixed top-20 right-4 z-[10000] animate-slide-in-right">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${colors[type]} min-w-[280px] max-w-md`}>
        {icons[type]}
        <p className="text-sm flex-1">{message}</p>
        <button onClick={onClose} className="opacity-50 hover:opacity-100 transition">
          <X size={16} />
        </button>
      </div>
    </div>,
    document.body
  );
};

// 🔹 Модалка подтверждения удаления
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, user, isDeleting }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-popup">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
            Удалить пользователя?
          </h3>
          
          <p className="text-gray-600 text-center mb-4">
            Вы уверены, что хотите удалить пользователя <br />
            <span className="font-semibold text-gray-800">"{user?.Login}"</span>?
          </p>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            Email: <span className="font-medium">{user?.Email}</span><br />
            Роль: <span className="font-medium">{user?.Role === "Admin" ? "🛡 Администратор" : "👤 Пользователь"}</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition"
              disabled={isDeleting}
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Удаление...
                </span>
              ) : (
                "🗑 Удалить"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 🔹 Модалка редактирования
const EditUserModal = ({ user, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    Login: "",
    Email: "",
    Phone: "",
    Role: "User",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        Login: user.Login || "",
        Email: user.Email || "",
        Phone: user.Phone || "",
        Role: user.Role || "User",
        password: "",
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = () => {
    onSave(formData);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-popup">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-800">
            ✏️ Редактирование пользователя
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              placeholder="Логин"
              value={formData.Login}
              onChange={(e) =>
                setFormData({ ...formData, Login: e.target.value })
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              placeholder="Email"
              value={formData.Email}
              onChange={(e) =>
                setFormData({ ...formData, Email: e.target.value })
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              placeholder="Телефон"
              value={formData.Phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, Phone: e.target.value })
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 outline-none"
              value={formData.Role}
              onChange={(e) =>
                setFormData({ ...formData, Role: e.target.value })
              }
            >
              <option value="User">👤 Пользователь</option>
              <option value="Admin">🛡 Администратор</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
            <input
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
              placeholder="Оставьте пустым, если не меняете"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <p className="text-xs text-gray-400 mt-1">Минимум 6 символов</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save size={16} /> Сохранить
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("token");

  const showToast = (text, type = "success") => {
    setToast({ text, type });
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    applyFilters();
  }, [users, search, filterRole]);

  useEffect(() => {
    if (editingUser || showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingUser, showDeleteModal]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch {
      showToast("Ошибка при загрузке пользователей", "error");
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
          u.Login?.toLowerCase().includes(search.toLowerCase()) ||
          u.Email?.toLowerCase().includes(search.toLowerCase()) ||
          String(u.UserID).includes(search)
      );
    }
    setFilteredUsers(list);
  }

  async function handleSaveEdit(formData) {
    setIsSaving(true);
    try {
      const payload = {
        login: formData.Login,
        email: formData.Email,
        phone: formData.Phone,
        role: formData.Role,
      };
      if (formData.password) payload.password = formData.password;

      await axios.put(
        `${API_URL}/api/admin/users/${editingUser.UserID}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("✅ Пользователь обновлён", "success");
      setEditingUser(null);
      fetchUsers();
    } catch {
      showToast("❌ Ошибка при обновлении", "error");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteClick(user) {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userToDelete.UserID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("🗑 Пользователь удалён", "success");
      fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch {
      showToast("❌ Ошибка при удалении", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          👥 Пользователи
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {filteredUsers.length} / {users.length}
          </span>
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg"
          >
            <Filter size={16} />
            Фильтры
          </button>
          <button
            onClick={fetchUsers}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-all"
          >
            <RefreshCw size={16} /> 
            <span className="hidden sm:inline">Обновить</span>
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className={`${showFilters ? 'block' : 'hidden sm:block'} mb-6`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по логину, email или ID"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="all">Все роли</option>
            <option value="User">👤 Пользователи</option>
            <option value="Admin">🛡 Администраторы</option>
          </select>
        </div>
      </div>

      {/* Список пользователей */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">👀 Пользователи не найдены</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table bg-white border border-gray-100 rounded-xl shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-xs md:text-sm font-semibold text-gray-600">ID</th>
                <th className="p-3 text-left text-xs md:text-sm font-semibold text-gray-600">Логин</th>
                <th className="p-3 text-left text-xs md:text-sm font-semibold text-gray-600 hide-on-mobile">Email</th>
                <th className="p-3 text-left text-xs md:text-sm font-semibold text-gray-600 hide-on-mobile">Телефон</th>
                <th className="p-3 text-left text-xs md:text-sm font-semibold text-gray-600">Роль</th>
                <th className="p-3 text-center text-xs md:text-sm font-semibold text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr
                  key={u.UserID}
                  className={`border-t hover:bg-gray-50 transition-all duration-200 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="p-3 text-gray-700 text-sm">{u.UserID}</td>
                  <td className="p-3 font-medium text-sm">
                    <div>{u.Login}</div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      <div>{u.Email}</div>
                      <div>{u.Phone || "—"}</div>
                    </div>
                  </td>
                  <td className="p-3 text-sm hide-on-mobile">{u.Email}</td>
                  <td className="p-3 text-sm hide-on-mobile">{u.Phone || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        u.Role === "Admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.Role === "Admin" ? "🛡 Админ" : "👤 Пользователь"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg transition"
                        title="Редактировать"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(u)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалки */}
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        user={userToDelete}
        isDeleting={isDeleting}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        
        @keyframes popup {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-popup { animation: popup 0.2s ease-out; }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
}