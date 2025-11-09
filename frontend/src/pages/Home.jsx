import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [sortOption, setSortOption] = useState("none");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [fade, setFade] = useState(true);

  // === Загрузка данных ===
  useEffect(() => {
    Promise.all([axiosClient.get("/products"), axiosClient.get("/categories")])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        setCategories(catRes.data);
        setTimeout(() => setLoaded(true), 200);
      })
      .catch((err) => console.error("Ошибка загрузки:", err));
  }, []);

  // === Обработка смены категории ===
  const handleCategoryChange = (cat) => {
    setFade(false);
    setTimeout(() => {
      setSelectedCategory(cat);
      setFade(true);
    }, 150);
  };

  // === Фильтрация и сортировка ===
  const filteredProducts = products
    .filter((p) => {
      const matchesName = p.Name?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "Все" || p.CategoryID === selectedCategory;
      const matchesPriceFrom = priceFrom ? p.Price >= Number(priceFrom) : true;
      const matchesPriceTo = priceTo ? p.Price <= Number(priceTo) : true;
      return matchesName && matchesCategory && matchesPriceFrom && matchesPriceTo;
    })
    .sort((a, b) => {
      if (sortOption === "price-asc") return a.Price - b.Price;
      if (sortOption === "price-desc") return b.Price - a.Price;
      if (sortOption === "name-asc") return a.Name.localeCompare(b.Name);
      if (sortOption === "name-desc") return b.Name.localeCompare(a.Name);
      return 0;
    });

  return (
    <div
      className={`bg-gray-50 min-h-screen transition-all duration-700 ${
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
 {/* Верхний баннер */}
<section className="relative py-16 text-center backdrop-blur-xl bg-white/30 border-y border-white/40 shadow-inner animate-fade-in overflow-hidden">
  {/* Светлый градиентный фон */}
  <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
  
  {/* Контент */}
  <div className="relative z-10">
    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
      Добро пожаловать в <span className="text-blue-600">RockDog Store 🐾</span>
    </h1>
    <p className="text-lg md:text-xl text-gray-600">
      Мерч, аксессуары и сувениры по вселенной RockDog
    </p>
  </div>

  {/* Мягкое сияние снизу */}
  <div className="absolute bottom-0 left-0 w-full h-16 bg-linear-to-t from-white/70 to-transparent" />
</section>


      {/* === Основной контент === */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 mt-12 mb-20 px-4 animate-fade-in">
        {/* === Сайдбар === */}
        <aside className="md:w-64 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 h-fit self-start mx-auto md:mx-0">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            🗂️ Категории
          </h3>
          <ul className="space-y-2">
            <li
              onClick={() => handleCategoryChange("Все")}
              className={`cursor-pointer px-4 py-2 rounded-lg transition font-medium ${
                selectedCategory === "Все"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              Все
            </li>
            {categories.map((cat) => (
              <li
                key={cat.CategoryID}
                onClick={() => handleCategoryChange(cat.CategoryID)}
                className={`cursor-pointer px-4 py-2 rounded-lg transition font-medium ${
                  selectedCategory === cat.CategoryID
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {cat.Name}
              </li>
            ))}
          </ul>

          {/* === Сортировка === */}
          <div className="mt-8">
            <h4 className="text-md font-semibold mb-2 text-gray-800">Сортировка</h4>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-blue-400"
            >
              <option value="none">Без сортировки</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
              <option value="name-asc">Название: А–Я</option>
              <option value="name-desc">Название: Я–А</option>
            </select>
          </div>

          {/* === Цена от/до === */}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2 text-gray-800">Цена</h4>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="От"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="w-1/2 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                placeholder="До"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="w-1/2 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </aside>

        {/* === Каталог товаров === */}
        <main className="flex-1 flex flex-col items-center">
          {/* Поиск */}
          <div className="w-full max-w-2xl mb-8 animate-fade-in">
            <div className="flex items-center bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 focus-within:ring-2 focus-within:ring-blue-400 transition-all duration-300">
              <input
                type="text"
                placeholder="🔍 Поиск товаров..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 focus:outline-none text-gray-700"
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center transition-all duration-300">
            {selectedCategory === "Все"
              ? "Каталог товаров"
              : categories.find((c) => c.CategoryID === selectedCategory)?.Name}
          </h2>

          <div
            className={`transition-opacity duration-300 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 text-lg">
                😕 Нет товаров для отображения
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {filteredProducts.map((p, i) => (
                  <div
                    key={p.ProductID}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      animationFillMode: "backwards",
                    }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
