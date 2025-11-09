import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
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
          `http://localhost:5000/api/categories/${editingCategory.CategoryID}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage("✅ Категория обновлена", "success");
      } else {
        await axios.post(
          "http://localhost:5000/api/categories",
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage("🟢 Категория добавлена", "success");
      }

      setName("");
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      showMessage("Ошибка при сохранении категории", "error");
    }
  }

  function handleEdit(category) {
    setEditingCategory(category);
    setName(category.Name);
  }

  async function handleDelete(id) {
    if (!window.confirm("Удалить эту категорию?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/categories/${id}`, {
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

  const filtered = categories.filter((c) =>
    c.Name.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Поиск */}
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="🔍 Поиск категории..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-1/2 focus:ring-2 focus:ring-blue-200 outline-none"
        />
      </div>

      {/* Список категорий */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center">Категорий нет</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c, i) => (
            <li
              key={c.CategoryID}
              className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 truncate">
                  {c.Name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full transition-all"
                    title="Редактировать"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.CategoryID)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all"
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
