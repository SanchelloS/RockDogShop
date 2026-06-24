import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in">
        {/* Анимированная 404 */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>

        {/* Иконка и сообщение */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Страница не найдена
          </h2>
          <p className="text-gray-600">
            Извините, страница, которую вы ищете, не существует или была перемещена.
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300"
          >
            <ArrowLeft size={18} />
            Вернуться назад
          </button>
          
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300"
          >
            <Home size={18} />
            На главную
          </Link>
        </div>

        {/* Полезные ссылки */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Возможно, вас заинтересует:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/catalog" className="text-sm text-blue-600 hover:text-blue-700">
              Каталог
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/cart" className="text-sm text-blue-600 hover:text-blue-700">
              Корзина
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-700">
              Мои заказы
            </Link>
          </div>
        </div>
      </div>

      {/* Добавляем стили для анимации */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}