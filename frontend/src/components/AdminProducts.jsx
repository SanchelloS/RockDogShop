import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, Filter, SortAsc, SortDesc, RefreshCw, X } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extraPreviews, setExtraPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // 🔹 изображения из БД
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("Все");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantityInStock: "",
    categoryId: "",
    image: null,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке товаров:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке категорий:", err);
    }
  }

  // 🟢 Добавление или обновление товара
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      let productId;

      if (editingProduct) {
        await axios.put(
          `${API_URL}/products/${editingProduct.ProductID}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        productId = editingProduct.ProductID;
      } else {
        const res = await axios.post(`${API_URL}/products`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        productId = res.data.productId || res.data.ProductID;
      }

      // 🖼️ Главное изображение
      if (formData.image && productId) {
        const imgData = new FormData();
        imgData.append("image", formData.image);
        await axios.post(`${API_URL}/products/${productId}/main-image`, imgData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // 🖼️ Новые доп. изображения
      if (extraImages.length > 0 && productId) {
        const extraData = new FormData();
        extraImages.forEach((file) => extraData.append("images", file));
        await axios.post(`${API_URL}/products/${productId}/images`, extraData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Ошибка при сохранении товара:", err);
      alert("Ошибка при сохранении товара");
    }
  }

  function resetForm() {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      quantityInStock: "",
      categoryId: "",
      image: null,
    });
    setImagePreview(null);
    setExtraImages([]);
    setExtraPreviews([]);
    setExistingImages([]);
  }

  // ✏️ Редактирование
  async function handleEdit(product) {
    setEditingProduct(product);
    setFormData({
      name: product.Name,
      description: product.Description,
      price: product.Price,
      quantityInStock: product.QuantityInStock,
      categoryId: product.CategoryID || "",
      image: null,
    });
    setImagePreview(
      product.MainImageURL ? `http://localhost:5000${product.MainImageURL}` : null
    );

    // 🔹 Подгрузим доп. изображения
    try {
      const res = await axios.get(`${API_URL}/products/${product.ProductID}`);
      if (res.data.Images) {
        setExistingImages(res.data.Images.map((img) => `http://localhost:5000${img}`));
      }
    } catch (err) {
      console.error("Ошибка при загрузке доп. изображений:", err);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 🗑 Удаление товара
  async function handleDelete(id) {
    if (!window.confirm("Удалить этот товар?")) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert("Ошибка при удалении товара");
    }
  }

  // 🗑 Удалить конкретное изображение
  async function handleDeleteImage(productId, imageUrl) {
    if (!window.confirm("Удалить это изображение?")) return;
    try {
      await axios.delete(`${API_URL}/products/${productId}/images`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { imageUrl },
      });
      setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
    } catch (err) {
      console.error("Ошибка при удалении изображения:", err);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function handleExtraImagesChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    setExtraImages(files);
    setExtraPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  // 🔎 Фильтрация и сортировка
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter !== "Все") {
      result = result.filter((p) => p.CategoryName === categoryFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.Name.toLowerCase().includes(s) ||
          p.Description?.toLowerCase().includes(s)
      );
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.Price - b.Price);
        break;
      case "price_desc":
        result.sort((a, b) => b.Price - a.Price);
        break;
      case "stock":
        result.sort((a, b) => b.QuantityInStock - a.QuantityInStock);
        break;
      default:
        result.sort((a, b) => b.ProductID - a.ProductID);
    }

    return result;
  }, [products, sortBy, categoryFilter, search]);

  // === UI ===
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🛍️ {editingProduct ? "Редактирование товара" : "Управление товарами"}
      </h1>

      {/* Панель фильтров */}
      <div className="flex flex-wrap gap-3 mb-6 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <Search className="text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1"
          >
            <option>Все</option>
            {categories.map((c) => (
              <option key={c.CategoryID}>{c.Name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {sortBy.includes("asc") ? <SortAsc /> : <SortDesc />}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1"
          >
            <option value="newest">Новые</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="stock">По наличию</option>
          </select>
        </div>

        <button
          onClick={fetchProducts}
          className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-all"
        >
          <RefreshCw size={16} /> Обновить
        </button>
      </div>

      {/* === Форма === */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md p-6 rounded-2xl mb-10 grid grid-cols-2 gap-4 border border-gray-100"
      >
        <input
          type="text"
          placeholder="Название"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none"
          required
        />
        <input
          type="number"
          placeholder="Цена"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none"
          required
        />
        <input
          type="number"
          placeholder="Количество"
          value={formData.quantityInStock}
          onChange={(e) =>
            setFormData({ ...formData, quantityInStock: e.target.value })
          }
          className="border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none"
          required
        />
        <select
          value={formData.categoryId}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
          className="border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none"
          required
        >
          <option value="">Выберите категорию</option>
          {categories.map((cat) => (
            <option key={cat.CategoryID} value={cat.CategoryID}>
              {cat.Name}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Описание"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="border p-2 rounded col-span-2 focus:ring-2 focus:ring-blue-200 outline-none"
        />

        {/* Главное изображение */}
        <div className="col-span-2">
          <label className="block mb-1 text-gray-600">Главное изображение:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="border p-2 rounded w-full"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Предпросмотр"
              className="w-32 h-32 mt-3 rounded-lg object-cover border animate-fade-in"
            />
          )}
        </div>

        {/* Существующие изображения */}
        {existingImages.length > 0 && (
          <div className="col-span-2 mt-3">
            <label className="block mb-2 text-gray-600">
              Загруженные изображения:
            </label>
            <div className="flex gap-3 flex-wrap">
              {existingImages.map((src, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 border rounded-lg overflow-hidden group"
                >
                  <img
                    src={src}
                    alt={`image-${i}`}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteImage(editingProduct.ProductID, src.replace("http://localhost:5000", ""))
                    }
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Новые дополнительные изображения */}
        <div className="col-span-2 mt-2">
          <label className="block mb-1 text-gray-600">
            Добавить дополнительные изображения (до 3):
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleExtraImagesChange}
            className="border p-2 rounded w-full"
          />
          {extraPreviews.length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {extraPreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`preview-${i}`}
                  className="w-20 h-20 rounded-lg object-cover border hover:scale-105 transition-transform"
                />
              ))}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="col-span-2 flex gap-3 mt-2">
          <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all">
            {editingProduct ? "💾 Сохранить" : "➕ Добавить"}
          </button>
          {editingProduct && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-all"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {/* === Список товаров === */}
      {loading ? (
        <div className="text-center text-gray-500 animate-pulse">Загрузка...</div>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500">Нет товаров</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((p, i) => (
            <div
              key={p.ProductID}
              className="group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden transform hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                <img
                  src={
                    p.MainImageURL
                      ? `http://localhost:5000${p.MainImageURL}`
                      : "/no-image.png"
                  }
                  alt={p.Name}
                  className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>

              <div className="p-3 flex flex-col justify-between min-h-[130px]">
                <div>
                  <h3 className="font-semibold text-base text-gray-800 truncate">
                    {p.Name}
                  </h3>
                  <p className="text-gray-500 text-xs italic">
                    {p.CategoryName || "Без категории"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {p.Description || "Нет описания"}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="font-bold text-blue-600 text-sm">
                    {p.Price.toLocaleString()} BYN
                  </p>
                  <p className="text-xs text-gray-500">
                    В наличии: {p.QuantityInStock}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="flex-1 flex items-center justify-center bg-yellow-400 text-white rounded-full py-1.5 transition-all hover:bg-yellow-500 hover:scale-105"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(p.ProductID)}
                      className="flex-1 flex items-center justify-center bg-red-500 text-white rounded-full py-1.5 transition-all hover:bg-red-600 hover:scale-105"
                      title="Удалить"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
