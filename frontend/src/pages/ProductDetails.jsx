import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import { ShoppingCart, Check, X, LogIn, UserPlus, Heart, Share2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Подключение к серверу через .env файл
const API_URL = import.meta.env.VITE_API_URL;

// Создаем axios инстанс с базовым URL
const axiosClient = axios.create({
  baseURL: API_URL,
});

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  const isAuthenticated = !!localStorage.getItem("token") && !!user;
  const isAdmin = user?.role === "Admin" || user?.Role === "Admin";

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/api/products/${id}`)
      .then((res) => {
        const data = res.data;
        const allImages = [];
        if (data.MainImageURL) allImages.push(`${API_URL}${data.MainImageURL}`);
        if (Array.isArray(data.Images) && data.Images.length > 0)
          allImages.push(...data.Images.map((img) => `${API_URL}${img}`));

        setProduct({ ...data, allImages });
        setSelectedImage(
          data.MainImageURL
            ? `${API_URL}${data.MainImageURL}`
            : "/placeholder.png"
        );
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    if (isAdmin) return;
    
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const closeModal = () => {
    setShowAuthModal(false);
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product?.QuantityInStock || 99)) {
      setQuantity(newQty);
    }
  };

  // Функция для кнопки "Поделиться"
  const handleShare = async () => {
    const productUrl = `${window.location.origin}/diplom01/product/${id}`;
    const productTitle = product?.Name || "Товар";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          text: `Посмотрите товар: ${productTitle}`,
          url: productUrl,
        });
        toast.success("Ссылка успешно открыта для шаринга!");
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error("Не удалось поделиться");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Ссылка на товар скопирована в буфер обмена!");
      } catch (error) {
        toast.error("Не удалось скопировать ссылку");
      }
    }
  };

  // Функция для кнопки "В избранное"
  const handleFavorite = () => {
    toast.custom((t) => (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-lg max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🔬</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">🧪 Бета-тестирование</h4>
            <p className="text-sm text-gray-600">
              Функционал "Избранное" находится в разработке и будет доступен в следующих версиях.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Спасибо за понимание! 🙏
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    ), {
      duration: 4000,
      position: "bottom-center",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Товар не найден</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft size={20} />
          Назад
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 p-6 md:p-8">
            {/* Левая часть - изображения */}
            <div className="md:w-1/2">
              <div className="sticky top-24">
                <div className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={selectedImage}
                    alt={product.Name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                
                {product.allImages && product.allImages.length > 1 && (
                  <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                    {product.allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(img)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition hover:scale-105 overflow-hidden ${
                          selectedImage === img
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`preview-${i}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Правая часть - информация */}
            <div className="md:w-1/2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                {product.Name}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Категория:</span>
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                  {product.CategoryName || "Без категории"}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-sm text-gray-500">Наличие:</span>
                <span className={`ml-2 text-sm font-medium ${product.QuantityInStock > 0 ? "text-green-600" : "text-red-500"}`}>
                  {product.QuantityInStock > 0 ? `✓ В наличии (${product.QuantityInStock} шт.)` : "✗ Нет в наличии"}
                </span>
              </div>

              <div className="text-3xl font-bold text-blue-600 mb-4">
                {product.Price.toLocaleString()} BYN
              </div>

              <div className="prose prose-sm max-w-none mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Описание:</h4>
                <p className="text-gray-600 whitespace-pre-line">
                  {product.Description || "Описание отсутствует."}
                </p>
              </div>

              {product.QuantityInStock > 0 && !isAdmin && (
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-gray-700">Количество:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.QuantityInStock}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">макс. {product.QuantityInStock} шт.</span>
                </div>
              )}

              {!isAdmin && (
                <button
                  onClick={handleAddToCart}
                  disabled={product.QuantityInStock === 0}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    added
                      ? "bg-green-500 text-white"
                      : product.QuantityInStock > 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {added ? (
                    <><Check size={20} /> Добавлено в корзину!</>
                  ) : (
                    <><ShoppingCart size={20} /> Добавить в корзину</>
                  )}
                </button>
              )}

              {isAdmin && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-700 text-sm">
                    🔒 Вы вошли как администратор. Покупки недоступны.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleFavorite}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 group"
                >
                  <Heart size={18} className="group-hover:scale-110 transition" />
                  В избранное
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 group"
                >
                  <Share2 size={18} className="group-hover:scale-110 transition" />
                  Поделиться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для неавторизованных - ИСПРАВЛЕНО */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-popup">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">🔒 Требуется авторизация</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition p-1">
                <X size={24} />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-600 mb-2">Чтобы добавить товар в корзину, необходимо</p>
              <p className="text-gray-800 font-semibold">войти в аккаунт или зарегистрироваться</p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                state={{ from: `/product/${id}` }}
                onClick={closeModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  fontWeight: "600",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  transition: "all 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1d4ed8";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#2563eb";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <LogIn size={20} /> Войти
              </Link>
              
              <Link
                to="/register"
                state={{ from: `/product/${id}` }}
                onClick={closeModal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  fontWeight: "600",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  transition: "all 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e5e7eb";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <UserPlus size={20} /> Зарегистрироваться
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              После входа товар можно будет добавить в корзину
            </p>
          </div>
        </div>
      )}
    </div>
  );
}