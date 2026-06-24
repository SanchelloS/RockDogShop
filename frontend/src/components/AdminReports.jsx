import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Filter, X, CheckCircle, XCircle, Info, Loader2 } from "lucide-react";

// Подключение к серверу через .env файл
const API = import.meta.env.VITE_API_URL;

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

function MetricCard({ label, value, loading = false }) {
  return (
    <div className="border rounded-xl p-3 bg-gray-50 hover-zoom transition shadow-sm hover:shadow-md">
      <div className="text-xs text-gray-500">
        {loading ? (
          <span className="inline-block h-3 w-24 rounded bg-gray-200 animate-pulse-smooth" />
        ) : (
          label
        )}
      </div>
      <div className="text-lg font-bold text-gray-800 mt-1">
        {loading ? (
          <span className="inline-block h-6 w-16 rounded bg-gray-200 animate-pulse-smooth" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function TableSkeleton({ columnsCount = 6, rowsCount = 6 }) {
  return (
    <div className="overflow-auto border rounded-xl animate-slide-down">
      <table className="min-w-[500px] md:min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columnsCount }).map((_, i) => (
              <th key={i} className="text-left p-2 border-b">
                <span className="inline-block h-3 w-24 rounded bg-gray-200 animate-pulse-smooth" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowsCount }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columnsCount }).map((_, c) => (
                <td key={c} className="p-2 border-b">
                  <span className="inline-block h-3 w-full max-w-[220px] rounded bg-gray-200 animate-pulse-smooth" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminReports() {
  const [type, setType] = useState("orders");
  const [format, setFormat] = useState("excel");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [limit, setLimit] = useState(10);
  const [metric, setMetric] = useState("revenue");
  const [minStock, setMinStock] = useState(0);

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("format", format);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    if (type === "top-products") {
      params.set("limit", String(limit));
      params.set("metric", metric);
    }

    if (type === "stock") {
      params.set("minStock", String(minStock));
    }

    return params;
  }, [type, format, dateFrom, dateTo, limit, metric, minStock]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoadingPreview(true);

        const previewParams = new URLSearchParams(queryParams);
        previewParams.set("previewLimit", "15");

        const url = `${API}/api/admin/reports/${type}/preview?${previewParams.toString()}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setPreview(null);
          showToast(data.message || "Ошибка предпросмотра", "error");
          return;
        }

        const data = await res.json();
        setPreview(data);
        setAnimKey((k) => k + 1);
      } catch (e) {
        if (e?.name !== "AbortError") setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [type, queryParams]);

  const download = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Нет токена. Войди заново.", "error");
        return;
      }

      const url = `${API}/api/admin/reports/${type}?${queryParams.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Ошибка скачивания отчёта", "error");
        return;
      }

      const blob = await res.blob();

      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const ext = format === "word" ? "docx" : "xlsx";
      let filename = `${type}-${dd}-${mm}.${ext}`;

      const cd = res.headers.get("Content-Disposition");
      if (cd) {
        const match = cd.match(/filename="(.+?)"/);
        if (match?.[1]) filename = match[1];
      }

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      showToast("Отчёт скачан ✅", "success");
    } catch (e) {
      showToast("Ошибка сети/сервера", "error");
    }
  };

  const metricsCards = useMemo(() => {
    if (!preview?.metrics) return null;
    const m = preview.metrics;

    const cards = [];
    if (m.totalOrders != null) cards.push({ label: "📦 Заказов", value: m.totalOrders });
    if (m.totalSum != null) cards.push({ label: "💰 Сумма", value: m.totalSum + " BYN" });
    if (m.totalProducts != null) cards.push({ label: "📦 Товаров", value: m.totalProducts });
    if (m.totalStock != null) cards.push({ label: "📊 Остаток", value: m.totalStock });
    if (m.totalUsers != null) cards.push({ label: "👥 Пользователей", value: m.totalUsers });
    if (m.days != null) cards.push({ label: "📅 Дней", value: m.days });
    if (m.revenue != null) cards.push({ label: "💰 Выручка", value: m.revenue + " BYN" });
    if (m.orders != null) cards.push({ label: "📦 Заказов", value: m.orders });
    if (m.items != null) cards.push({ label: "🛍 Товаров (шт)", value: m.items });
    if (m.avgOrderValue != null) cards.push({ label: "💵 Средний чек", value: m.avgOrderValue + " BYN" });
    if (m.rows != null) cards.push({ label: "📋 Строк", value: m.rows });
    if (m.totalRevenueTop != null) cards.push({ label: "🏆 Выручка ТОП", value: m.totalRevenueTop + " BYN" });
    if (m.totalSoldQtyTop != null) cards.push({ label: "🏆 Продано ТОП", value: m.totalSoldQtyTop });
    if (m.lowStockCount != null) cards.push({ label: "⚠️ Позиций мало", value: m.lowStockCount });
    if (m.minStock != null) cards.push({ label: "📉 Мин. остаток", value: m.minStock });

    return cards;
  }, [preview]);

  // Компонент фильтров для переиспользования
  const FiltersContent = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Тип отчёта</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="orders">📋 Заказы</option>
            <option value="products">🏷 Товары</option>
            <option value="users">👥 Пользователи</option>
            <option value="sales">📈 Продажи по дням</option>
            <option value="top-products">⭐ ТОП товаров</option>
            <option value="stock">⚠️ Остатки (мало на складе)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Формат</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="excel">📊 Excel (.xlsx)</option>
            <option value="word">📄 Word (.docx)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Дата от</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Дата до</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      {type === "top-products" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-down">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Лимит (1–200)</span>
            <input
              type="number"
              min="1"
              max="200"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Метрика</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="revenue">💰 По выручке</option>
              <option value="qty">📦 По количеству</option>
            </select>
          </label>
        </div>
      )}

      {type === "stock" && (
        <label className="flex flex-col gap-1 animate-slide-down">
          <span className="text-sm text-gray-600">Порог остатка (≤)</span>
          <input
            type="number"
            min="0"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value))}
            className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      )}

      <button
        onClick={download}
        className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition active:scale-[0.98] flex items-center justify-center gap-2 ${
          loadingPreview ? "opacity-80 animate-pulse-smooth" : ""
        }`}
      >
        <Download size={18} />
        Скачать отчёт
      </button>

      <p className="text-xs text-gray-500 text-center">
        Предпросмотр обновляется автоматически
      </p>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          📊 Отчёты
        </h1>
        
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg"
        >
          <Filter size={18} />
          Фильтры
          {showMobileFilters ? <X size={18} /> : null}
        </button>
      </div>

      {/* Десктопные фильтры */}
      <div className="hidden lg:block bg-white border rounded-xl p-4 md:p-6 shadow-sm space-y-4 animate-blur-in">
        <FiltersContent />
      </div>

      {/* Мобильные фильтры */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Фильтры отчётов</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <FiltersContent />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Предпросмотр */}
      <div className="bg-white border rounded-xl p-4 md:p-6 shadow-sm space-y-4 animate-blur-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold">👀 Предпросмотр</h2>
          <span className={`text-xs text-gray-500 ${loadingPreview ? "animate-pulse-smooth" : ""}`}>
            {loadingPreview ? "Загрузка..." : preview ? `Строк: ${preview.totalRows}` : "Нет данных"}
          </span>
        </div>

        <div key={animKey} className="animate-fade-in">
          {metricsCards?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {metricsCards.map((c) => (
                <MetricCard key={c.label} label={c.label} value={c.value} loading={false} />
              ))}
            </div>
          ) : loadingPreview ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <MetricCard loading />
              <MetricCard loading />
              <MetricCard loading />
              <MetricCard loading />
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              Метрики появятся после загрузки отчёта
            </div>
          )}

          <div className="mt-4">
            {loadingPreview ? (
              <TableSkeleton columnsCount={preview?.columns?.length || 6} rowsCount={6} />
            ) : preview?.rows?.length ? (
              <div className="admin-table-wrapper">
                <table className="admin-table text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {preview.columns.map((c) => (
                        <th key={c.key} className="text-left p-2 border-b font-semibold text-gray-600">
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 transition-colors ${idx % 2 ? "bg-white" : "bg-gray-50/40"}`}
                      >
                        {preview.columns.map((c) => (
                          <td key={c.key} className="p-2 border-b">
                            {String(r[c.key] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">
                Нет строк для отображения
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
        
        @keyframes blur-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-blur-in { animation: blur-in 0.3s ease-out; }
        
        @keyframes pulse-smooth {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-smooth { animation: pulse-smooth 1.5s ease-in-out infinite; }
        
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
}