import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Plus, Edit2, Trash2, RefreshCw, Search, X, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

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
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, category, isDeleting }) => {
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
            Удалить категорию?
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            Вы уверены, что хотите удалить категорию <br />
            <span className="font-semibold text-gray-800">"{category?.Name}"</span>?
          </p>
          
          {category?.ProductsCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-yellow-700 text-sm text-center">
                ⚠️ В этой категории есть товары. Удаление категории может повлиять на них.
              </p>
            </div>
          )}
          
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

// 🔹 Модалка добавления/редактирования
const CategoryFormModal = ({ isOpen, onClose, onSubmit, editingCategory, name, setName, isSubmitting }) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-popup">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {editingCategory ? "✏️ Редактирование категории" : "➕ Добавление категории"}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название категории"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-200 outline-none"
            required
            autoFocus
          />
          
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Сохранение..." : (editingCategory ? "💾 Сохранить" : "➕ Добавить")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("token");

  const showToast = (text, type = "success") => {
    setToast({ text, type });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (showForm || showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showForm, showDeleteModal]);

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch {
      showToast("Ошибка при получении категорий", "error");
    }
  }

  async function addOrUpdateCategory(e) {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingCategory) {
        await axios.put(
          `${API_URL}/api/categories/${editingCategory.CategoryID}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("✅ Категория обновлена", "success");
      } else {
        await axios.post(
          `${API_URL}/api/categories`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast("🟢 Категория добавлена", "success");
      }

      setName("");
      setEditingCategory(null);
      setShowForm(false);
      fetchCategories();
    } catch {
      showToast("Ошибка при сохранении категории", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(category) {
    setEditingCategory(category);
    setName(category.Name);
    setShowForm(true);
  }

  function handleDeleteClick(category) {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await axios.delete(`${API_URL}/api/categories/${categoryToDelete.CategoryID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("🗑 Категория удалена", "success");
      fetchCategories();
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err) {
      if (err.response?.status === 400) {
        showToast("⚠️ Нельзя удалить категорию с товарами", "warning");
      } else {
        showToast("Ошибка при удалении категории", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function resetForm() {
    setEditingCategory(null);
    setName("");
    setShowForm(false);
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return categories.filter((c) => c.Name.toLowerCase().includes(s));
  }, [categories, search]);

  const totals = useMemo(() => {
    const totalCats = filtered.length;
    const totalProducts = filtered.reduce((sum, c) => sum + Number(c.ProductsCount || 0), 0);
    return { totalCats, totalProducts };
  }, [filtered]);

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          🗂 Управление категориями
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {filtered.length} / {categories.length}
          </span>
        </h2>
        
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={18} /> 
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Поиск + итоги */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="🔍 Поиск категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
            <span className="font-semibold">📁 Категорий:</span> {totals.totalCats}
            <span className="mx-2 text-gray-300">|</span>
            <span className="font-semibold">📦 Товаров:</span> {totals.totalProducts}
          </div>
          
          <button
            onClick={fetchCategories}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition"
            title="Обновить"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Таблица категорий */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-100">
          📭 Категорий не найдено
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="block mx-auto mt-3 text-blue-600 hover:text-blue-700"
          >
            + Создать первую категорию
          </button>
        </div>
      ) : (
        <div className="admin-table-wrapper bg-white rounded-xl border border-gray-100 shadow-sm">
          <table className="admin-table text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-600 w-16">ID</th>
                <th className="p-3 text-left font-semibold text-gray-600">Название</th>
                <th className="p-3 text-left font-semibold text-gray-600 hide-on-mobile">Товаров</th>
                <th className="p-3 text-right font-semibold text-gray-600 w-24">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.CategoryID} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-700">{c.CategoryID}</td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">{c.Name}</div>
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      📦 {Number(c.ProductsCount || 0)} товаров
                    </div>
                  </td>
                  <td className="p-3 hide-on-mobile">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                      Number(c.ProductsCount || 0) > 0
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {Number(c.ProductsCount || 0)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-2 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 transition"
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(c)}
                        className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
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
      <CategoryFormModal
        isOpen={showForm}
        onClose={resetForm}
        onSubmit={addOrUpdateCategory}
        editingCategory={editingCategory}
        name={name}
        setName={setName}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        category={categoryToDelete}
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