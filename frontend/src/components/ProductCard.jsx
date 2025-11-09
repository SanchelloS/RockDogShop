import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import { Link } from "react-router-dom";
import { ShoppingCart, Check } from "lucide-react";

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      to={`/product/${product.ProductID}`}
      className="block group relative w-full max-w-xs"
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-md transition-transform duration-300 ease-out group-hover:shadow-xl group-hover:scale-[1.03]"
      >
        {/* Изображение */}
        <div className="relative h-60 bg-gray-100 overflow-hidden flex items-center justify-center">
          {product.MainImageURL ? (
            <img
              src={`http://localhost:5000${product.MainImageURL}`}
              alt={product.Name}
              className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="text-gray-400">Нет фото</div>
          )}

          {/* Кнопка добавления в корзину */}
          <button
            onClick={handleAdd}
            className={`absolute bottom-3 right-3 p-3 rounded-full shadow-lg transition-all duration-300 ${
              added
                ? "bg-green-500 text-white scale-110"
                : "bg-blue-600 text-white opacity-0 group-hover:opacity-100 hover:bg-blue-700"
            }`}
            title="Добавить в корзину"
          >
            {added ? <Check size={20} /> : <ShoppingCart size={20} />}
          </button>
        </div>

        {/* Текстовый блок */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
            {product.Name}
          </h2>
         {/* <p className="text-gray-500 text-sm line-clamp-2 mb-2">
            {product.Description || "Описание отсутствует"}
          </p>*/}
          <p className="text-xl font-bold text-blue-600">
            {product.Price} BYN
          </p>
        </div>
      </div>

      {/* Анимационное уведомление */}
      {added && (
        <div className="absolute bottom-24 right-3 bg-green-500 text-white text-sm font-medium py-1.5 px-3 rounded-lg shadow-md animate-fade-in">
          ✅ Добавлено в корзину!
        </div>
      )}
    </Link>
  );
}
