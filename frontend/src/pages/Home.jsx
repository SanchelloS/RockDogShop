import { useEffect, useState, useCallback, useMemo } from "react";
import ProductCard from "../components/ProductCard";
import FilterModal from "../components/FilterModal";
import axiosClient from "../api/axiosClient";
import { SlidersHorizontal } from "lucide-react";

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // === Загрузка данных ===
  useEffect(() => {
    Promise.all([
      axiosClient.get("/products"), 
      axiosClient.get("/categories")
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        setCategories(catRes.data);
        setTimeout(() => setLoaded(true), 200);
      })
      .catch((err) => console.error("Ошибка загрузки:", err));
  }, []);

  // Подсчет активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "Все") count++;
    if (sortOption !== "none") count++;
    if (priceFrom) count++;
    if (priceTo) count++;
    if (search) count++;
    return count;
  }, [selectedCategory, sortOption, priceFrom, priceTo, search]);

  // === Обработка смены категории ===
  const handleCategoryChange = useCallback((cat) => {
    setFade(false);
    setTimeout(() => {
      setSelectedCategory(cat);
      setFade(true);
    }, 150);
  }, []);

  // === Сброс фильтров ===
  const resetFilters = useCallback(() => {
    setSelectedCategory("Все");
    setSortOption("none");
    setPriceFrom("");
    setPriceTo("");
    setSearch("");
  }, []);

  // === Фильтрация и сортировка ===
  const filteredProducts = useMemo(() => {
    return products
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
  }, [products, search, selectedCategory, priceFrom, priceTo, sortOption]);

  // Компонент фильтров
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Категории */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
          🗂️ Категории
        </h3>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleCategoryChange("Все")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
              selectedCategory === "Все"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.CategoryID}
              onClick={() => handleCategoryChange(cat.CategoryID)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                selectedCategory === cat.CategoryID
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.Name}
            </button>
          ))}
        </div>
      </div>

      {/* Сортировка */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-800">📊 Сортировка</h4>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
        >
          <option value="none">📌 Без сортировки</option>
          <option value="price-asc">💰 Цена: по возрастанию</option>
          <option value="price-desc">💰 Цена: по убыванию</option>
          <option value="name-asc">🔤 Название: А–Я</option>
          <option value="name-desc">🔤 Название: Я–А</option>
        </select>
      </div>

      {/* Цена от/до */}
      <div>
        <h4 className="text-md font-semibold mb-2 text-gray-800">💰 Цена (BYN)</h4>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="От"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
          <input
            type="number"
            placeholder="До"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`bg-gray-50 min-h-screen transition-all duration-700 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Верхний баннер */}
        <section className="relative py-12 md:py-16 lg:py-20 text-center bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3">
              Добро пожаловать в <span className="text-blue-600">RockDog Store 🐾</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600">
              Мерч, аксессуары и сувениры по вселенной RockDog
            </p>
          </div>
        </section>

        {/* === Основной контент === */}
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* === Сайдбар - скрывается на планшетах и мобилках === */}
            <aside className="hidden lg:block lg:w-72 xl:w-80 bg-white rounded-2xl shadow-sm p-5 h-fit sticky top-24 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Фильтры</h3>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm text-red-500 hover:text-red-600 transition"
                  >
                    Сбросить ({activeFiltersCount})
                  </button>
                )}
              </div>
              <FiltersContent />
            </aside>

            {/* === Каталог товаров === */}
            <main className="flex-1">
              {/* Поиск и кнопка фильтра */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="🔍 Поиск товаров..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                
                {/* Кнопка фильтра для мобилок и планшетов */}
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-2 bg-white rounded-xl px-5 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <SlidersHorizontal size={18} />
                  <span className="font-medium">Фильтры</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  {selectedCategory === "Все"
                    ? "Все товары"
                    : categories.find((c) => c.CategoryID === selectedCategory)?.Name}
                </h2>
                <p className="text-sm text-gray-500">
                  Найдено: {filteredProducts.length} товаров
                </p>
              </div>

              <div
                className={`transition-opacity duration-300 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
              >
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">😕 Ничего не найдено</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 text-blue-600 hover:text-blue-700 transition"
                    >
                      Сбросить фильтры
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                    {filteredProducts.map((p, i) => (
                      <div
                        key={p.ProductID}
                        className="animate-fade-in h-full"
                        style={{
                          animationDelay: `${i * 0.03}s`,
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
      </div>

      {/* Модалка */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFiltersCount={activeFiltersCount}
        filteredProductsCount={filteredProducts.length}
        onReset={resetFilters}
      >
        <FiltersContent />
      </FilterModal>
    </>
  );
}