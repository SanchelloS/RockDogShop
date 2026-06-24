import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

import {
  Search,
  Filter,
  RefreshCw,
  X,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const HOST = import.meta.env.VITE_API_URL;

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
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, product, isDeleting }) => {
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
            Удалить товар?
          </h3>
          
          <p className="text-gray-600 text-center mb-4">
            Вы уверены, что хотите удалить товар <br />
            <span className="font-semibold text-gray-800">"{product?.Name}"</span>?
          </p>
          
          <p className="text-sm text-gray-500 text-center mb-6">
            Категория: <span className="font-medium">{product?.CategoryName || "Без категории"}</span><br />
            Цена: <span className="font-medium">{product?.Price} BYN</span>
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

// 🔹 Модалка формы товара
const ProductFormModal = ({ isOpen, onClose, onSubmit, editingProduct, formData, setFormData, categories, imagePreview, handleImageChange, extraPreviews, handleExtraImagesChange, existingImages, handleDeleteImage, isSubmitting }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden bg-white rounded-3xl shadow-2xl flex flex-col animate-fade-in">

        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {editingProduct
              ? "✏️ Редактирование товара"
              : "➕ Добавление нового товара"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Название товара *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
            <input
              type="number"
              placeholder="Цена *"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
            <input
              type="number"
              placeholder="Количество на складе *"
              value={formData.quantityInStock}
              onChange={(e) => setFormData({ ...formData, quantityInStock: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Выберите категорию *</option>
              {categories.map((cat) => (
                <option key={cat.CategoryID} value={cat.CategoryID}>{cat.Name}</option>
              ))}
            </select>
          </div>

          <textarea
            rows="5"
            placeholder="Описание товара"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
          />

          {/* MAIN IMAGE */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Главное изображение</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-gray-200 rounded-xl p-3" />
            {imagePreview && (
              <div className="mt-3">
                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-2xl border" />
              </div>
            )}
          </div>

          {/* EXISTING IMAGES */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Существующие изображения</label>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-24 h-24 rounded-2xl object-cover border" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(src.replace(HOST, ""))}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXTRA IMAGES */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Дополнительные изображения (до 3 шт.)</label>
            <input type="file" accept="image/*" multiple onChange={handleExtraImagesChange} className="w-full border border-gray-200 rounded-xl p-3" />
            {extraPreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {extraPreviews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-24 h-24 rounded-2xl object-cover border" />
                ))}
              </div>
            )}
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50">
              {isSubmitting ? "Сохранение..." : (editingProduct ? "💾 Сохранить изменения" : "➕ Добавить товар")}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extraPreviews, setExtraPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [extraImages, setExtraImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("Все категории");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantityInStock: "",
    categoryId: "",
    image: null,
  });

  const token = localStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchProducts();
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

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      showToast("Ошибка при загрузке товаров", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let productId;

      if (editingProduct) {
        await axios.put(
          `${API_URL}/api/products/${editingProduct.ProductID}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        productId = editingProduct.ProductID;
        showToast("✅ Товар успешно обновлён", "success");
      } else {
        const res = await axios.post(
          `${API_URL}/api/products`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        productId = res.data.productId || res.data.ProductID;
        showToast("✅ Товар успешно добавлен", "success");
      }

      if (formData.image && productId) {
        const imgData = new FormData();
        imgData.append("image", formData.image);
        await axios.post(`${API_URL}/api/products/${productId}/main-image`, imgData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }

      if (extraImages.length > 0 && productId) {
        const extraData = new FormData();
        extraImages.forEach((file) => extraData.append("images", file));
        await axios.post(`${API_URL}/api/products/${productId}/images`, extraData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }

      resetForm();
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast("❌ Ошибка при сохранении товара", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(product) {
    setEditingProduct(product);
    setFormData({
      name: product.Name,
      description: product.Description || "",
      price: product.Price,
      quantityInStock: product.QuantityInStock,
      categoryId: product.CategoryID || "",
      image: null,
    });
    setImagePreview(product.MainImageURL ? `${HOST}${product.MainImageURL}` : null);

    try {
      const res = await axios.get(`${API_URL}/api/products/${product.ProductID}`);
      if (res.data.Images) {
        setExistingImages(res.data.Images.map((img) => `${HOST}${img}`));
      }
    } catch (err) {
      console.error(err);
    }
    setShowForm(true);
  }

  function handleDeleteClick(product) {
    setProductToDelete(product);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      await axios.delete(`${API_URL}/api/products/${productToDelete.ProductID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("🗑 Товар успешно удалён", "success");
      fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      showToast("❌ Ошибка при удалении товара", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteImage(imageUrl) {
    try {
      await axios.delete(`${API_URL}/api/products/${editingProduct?.ProductID}/images`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { imageUrl },
      });
      setExistingImages((prev) => prev.filter((img) => img !== `${HOST}${imageUrl}`));
      showToast("🖼 Изображение удалено", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Ошибка при удалении изображения", "error");
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

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (categoryFilter !== "Все категории") {
      result = result.filter((p) => p.CategoryName === categoryFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) => p.Name.toLowerCase().includes(s) || p.Description?.toLowerCase().includes(s)
      );
    }
    switch (sortBy) {
      case "price_asc": result.sort((a, b) => a.Price - b.Price); break;
      case "price_desc": result.sort((a, b) => b.Price - a.Price); break;
      case "stock": result.sort((a, b) => b.QuantityInStock - a.QuantityInStock); break;
      default: result.sort((a, b) => b.ProductID - a.ProductID);
    }
    return result;
  }, [products, sortBy, categoryFilter, search]);

  const FiltersContent = () => (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option>Все категории</option>
          {categories.map((c) => (<option key={c.CategoryID}>{c.Name}</option>))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="newest">📅 Новые</option>
          <option value="price_asc">💰 Цена ↑</option>
          <option value="price_desc">💰 Цена ↓</option>
          <option value="stock">📦 Остаток</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* TOP */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🛍️ Управление товарами</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition flex items-center gap-2">
            <Plus size={18} /> Добавить товар
          </button>
          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-xl transition">
            <Filter size={18} />
          </button>
          <button onClick={fetchProducts} className="bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-xl transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* DESKTOP FILTERS */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
        <FiltersContent />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setViewMode("cards")} className={`p-3 rounded-xl transition ${viewMode === "cards" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-3 rounded-xl transition ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* MOBILE FILTERS */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg">Фильтры и сортировка</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="p-5">
              <FiltersContent />
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button onClick={() => { setViewMode("cards"); setShowMobileFilters(false); }} className={`py-3 rounded-xl transition ${viewMode === "cards" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>Карточки</button>
                <button onClick={() => { setViewMode("list"); setShowMobileFilters(false); }} className={`py-3 rounded-xl transition ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>Список</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {viewMode === "cards" && (
        <>
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border">Товары не найдены</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((p) => (
                <div key={p.ProductID} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img src={p.MainImageURL ? `${HOST}${p.MainImageURL}` : "/no-image.png"} alt={p.Name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[40px]">{p.Name}</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">{p.CategoryName || "Без категории"}</p>
                    <p className="text-blue-600 font-bold text-base mt-2">{p.Price} BYN</p>
                    <p className="text-xs text-gray-500 mt-1">Остаток: {p.QuantityInStock}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleEdit(p)} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white py-1.5 rounded-lg transition text-sm">✏️</button>
                      <button onClick={() => handleDeleteClick(p)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg transition text-sm">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === "list" && (
        <>
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border">Товары не найдены</div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <div key={p.ProductID} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-all duration-300">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={p.MainImageURL ? `${HOST}${p.MainImageURL}` : "/no-image.png"} alt={p.Name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800">{p.Name}</h3>
                      <p className="text-sm text-gray-500">{p.CategoryName || "Без категории"}</p>
                      <div className="flex gap-4 mt-1 text-sm">
                        <span className="text-blue-600 font-bold">{p.Price} BYN</span>
                        <span className="text-gray-500">Остаток: {p.QuantityInStock}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-2 rounded-lg transition">✏️</button>
                      <button onClick={() => handleDeleteClick(p)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ProductFormModal
        isOpen={showForm}
        onClose={() => { resetForm(); setShowForm(false); }}
        onSubmit={handleSubmit}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        imagePreview={imagePreview}
        handleImageChange={handleImageChange}
        extraPreviews={extraPreviews}
        handleExtraImagesChange={handleExtraImagesChange}
        existingImages={existingImages}
        handleDeleteImage={handleDeleteImage}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setProductToDelete(null); }}
        onConfirm={confirmDelete}
        product={productToDelete}
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