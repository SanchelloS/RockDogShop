import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API}/api/categories`);
      setCategories(res.data);
    } catch {
      showMessage("Ошибка при получении категорий", "error");
    }
  }

  async function addOrUpdateCategory(e) {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(
          `${API}/api/categories/${editingCategory.CategoryID}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage("✅ Категория обновлена", "success");
      } else {
        await axios.post(
          `${API}/api/categories`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage("🟢 Категория добавлена", "success");
      }

      setName("");
      setEditingCategory(null);
      fetchCategories();
    } catch {
      showMessage("Ошибка при сохранении категории", "error");
    }
  }

  function handleEdit(category) {
    setEditingCategory(category);
    setName(category.Name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить эту категорию?")) return;

    try {
      await axios.delete(`${API}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("🗑 Категория удалена", "success");
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 400) {
        showMessage("⚠️ Нельзя удалить категорию с товарами", "warning");
      } else {
        showMessage("Ошибка при удалении категории", "error");
      }
    }
  }

  function resetForm() {
    setEditingCategory(null);
    setName("");
  }

  function showMessage(text, type) {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 2500);
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
      <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🗂 Управление категориями
      </h2>

      {/* Уведомление */}
      {message.text && (
        <div
          className={`p-3 mb-4 rounded-xl text-white text-sm shadow-md transition-all duration-300 ${
            message.type === "success"
              ? "bg-green-500"
              : message.type === "warning"
              ? "bg-yellow-400 text-black"
              : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Форма */}
      <form
        onSubmit={addOrUpdateCategory}
        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-center"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название категории"
          className="border border-gray-300 rounded-lg p-2 flex-1 focus:ring-2 focus:ring-blue-200 outline-none"
          required
        />

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
          <Plus size={16} />
          {editingCategory ? "Сохранить" : "Добавить"}
        </button>

        {editingCategory && (
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all"
          >
            Отмена
          </button>
        )}

        <button
          type="button"
          onClick={fetchCategories}
          className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-all ml-auto"
        >
          <RefreshCw size={16} /> Обновить
        </button>
      </form>

      {/* Поиск + итоги */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
        <input
          type="text"
          placeholder="🔍 Поиск категории..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-200 outline-none"
        />

        <div className="text-sm text-gray-600 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
          <span className="font-semibold">Категорий:</span> {totals.totalCats}{" "}
          <span className="mx-2 text-gray-300">|</span>
          <span className="font-semibold">Товаров в них:</span> {totals.totalProducts}
        </div>
      </div>

      {/* Таблица */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center">Категорий нет</p>
      ) : (
        <div className="overflow-auto border border-gray-100 rounded-xl bg-white shadow-sm animate-fade-in">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-3 border-b">ID</th>
                <th className="text-left p-3 border-b">Название</th>
                <th className="text-left p-3 border-b">Товаров</th>
                <th className="text-right p-3 border-b">Действия</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.CategoryID}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 border-b text-gray-700">{c.CategoryID}</td>

                  <td className="p-3 border-b">
                    <div className="font-semibold text-gray-800">{c.Name}</div>
                  </td>

                  <td className="p-3 border-b">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold border ${
                        Number(c.ProductsCount || 0) > 0
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                      title="Количество товаров в категории"
                    >
                      {Number(c.ProductsCount || 0)}
                    </span>
                  </td>

                  <td className="p-3 border-b">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="px-3 py-1.5 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 transition"
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c.CategoryID)}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
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
    </div>
  );
}
