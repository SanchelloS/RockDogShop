import { useParams } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import axiosClient from "../api/axiosClient";
import { CartContext } from "../context/CartContext";
import { ShoppingCart, Check } from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [added, setAdded] = useState(false);

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    axiosClient
      .get(`/products/${id}`)
      .then((res) => {
        const data = res.data;

        const allImages = [];
        if (data.MainImageURL) allImages.push(`${BASE_URL}${data.MainImageURL}`);
        if (Array.isArray(data.Images) && data.Images.length > 0)
          allImages.push(...data.Images.map((img) => `${BASE_URL}${img}`));

        setProduct({ ...data, allImages });
        setSelectedImage(
          data.MainImageURL
            ? `${BASE_URL}${data.MainImageURL}`
            : "/placeholder.png"
        );
      })
      .catch((err) => console.error(err));
  }, [id]);

  if (!product) return <p className="text-center mt-10">Загрузка...</p>;

  // 🔹 Добавление в корзину
  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 animate-fade-in relative">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 flex flex-col md:flex-row gap-10 relative">
        {/* 🖼️ Левая часть — изображения */}
        <div className="flex-1">
          <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200">
            <img
              src={selectedImage}
              alt={product.Name}
              className="object-contain w-full h-full"
            />
          </div>

          {product.allImages && product.allImages.length > 1 && (
            <div className="flex gap-3 mt-4 flex-wrap">
              {product.allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-lg border transition hover:scale-105 overflow-hidden ${
                    selectedImage === img
                      ? "border-blue-500 ring-2 ring-blue-400"
                      : "border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`preview-${i}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 🧾 Правая часть — инфо */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3 text-gray-800">
              {product.Name}
            </h1>

            <p className="text-gray-500 text-sm mb-1">
              Категория:{" "}
              <span className="font-medium text-gray-700">
                {product.CategoryName || "—"}
              </span>
            </p>

            <p className="text-gray-500 text-sm mb-4">
              В наличии:{" "}
              <span
                className={`font-medium ${
                  product.QuantityInStock > 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {product.QuantityInStock > 0
                  ? `${product.QuantityInStock} шт.`
                  : "Нет в наличии"}
              </span>
            </p>

            <div
              className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line break-words break-all max-w-full"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            >
              {product.Description || "Описание отсутствует."}
            </div>
          </div>

          {/* 💰 Цена и кнопка */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-semibold text-blue-600">
                {product.Price} BYN
              </span>

              <button
                onClick={handleAddToCart}
                disabled={product.QuantityInStock === 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                  added
                    ? "bg-green-500 text-white scale-105"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} /> Добавлено!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} /> Добавить в корзину
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🟩 Всплывающее уведомление */}
      {added && (
        <div className="absolute bottom-6 right-6 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg text-sm animate-fade-in">
          ✅ Товар добавлен в корзину!
        </div>
      )}
    </div>
  );
}
