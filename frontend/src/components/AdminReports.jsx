import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function MetricCard({ label, value, loading = false }) {
  return (
    <div className={`border rounded-xl p-3 bg-gray-50 hover-zoom transition shadow-sm hover:shadow-md`}>
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
      <table className="min-w-full text-sm">
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

  const [limit, setLimit] = useState(10);
  const [metric, setMetric] = useState("revenue"); // revenue | qty
  const [minStock, setMinStock] = useState(0);

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ключ для лёгкой анимации обновления блока предпросмотра
  const [animKey, setAnimKey] = useState(0);

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
          toast.error(data.message || "Ошибка предпросмотра");
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
        toast.error("Нет токена. Войди заново.");
        return;
      }

      const url = `${API}/api/admin/reports/${type}?${queryParams.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || "Ошибка скачивания отчёта");
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

      toast.success("Отчёт скачан ✅");
    } catch (e) {
      toast.error("Ошибка сети/сервера");
    }
  };

  const metricsCards = useMemo(() => {
    if (!preview?.metrics) return null;
    const m = preview.metrics;

    const cards = [];
    if (m.totalOrders != null) cards.push({ label: "Заказов", value: m.totalOrders });
    if (m.totalSum != null) cards.push({ label: "Сумма", value: m.totalSum });

    if (m.totalProducts != null) cards.push({ label: "Товаров", value: m.totalProducts });
    if (m.totalStock != null) cards.push({ label: "Остаток (всего)", value: m.totalStock });

    if (m.totalUsers != null) cards.push({ label: "Пользователей", value: m.totalUsers });

    if (m.days != null) cards.push({ label: "Дней", value: m.days });
    if (m.revenue != null) cards.push({ label: "Выручка", value: m.revenue });
    if (m.orders != null) cards.push({ label: "Заказов", value: m.orders });
    if (m.items != null) cards.push({ label: "Товаров (шт)", value: m.items });
    if (m.avgOrderValue != null) cards.push({ label: "Средний чек", value: m.avgOrderValue });

    if (m.rows != null) cards.push({ label: "Строк", value: m.rows });
    if (m.totalRevenueTop != null) cards.push({ label: "Выручка ТОП", value: m.totalRevenueTop });
    if (m.totalSoldQtyTop != null) cards.push({ label: "Продано ТОП (шт)", value: m.totalSoldQtyTop });

    if (m.lowStockCount != null) cards.push({ label: "Позиций мало", value: m.lowStockCount });
    if (m.minStock != null) cards.push({ label: "Мин. остаток", value: m.minStock });

    return cards;
  }, [preview]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold animate-fade-in">📊 Отчёты</h1>

      {/* настройки */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4 animate-blur-in">
        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Тип отчёта</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="orders">Заказы</option>
              <option value="products">Товары</option>
              <option value="users">Пользователи</option>
              <option value="sales">Продажи по дням</option>
              <option value="top-products">ТОП товаров</option>
              <option value="stock">Остатки (мало на складе)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Формат</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="word">Word (.docx)</option>
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
          <div className="grid md:grid-cols-2 gap-3 animate-slide-down">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Лимит (1–200)</span>
              <input
                type="number"
                min="1"
                max="200"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
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
                <option value="revenue">По выручке</option>
                <option value="qty">По количеству</option>
              </select>
            </label>
          </div>
        )}

        {type === "stock" && (
          <label className="flex flex-col gap-1 animate-slide-down">
            <span className="text-sm text-gray-600">Порог остатка (&le;)</span>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        )}

        <button
          onClick={download}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition active:scale-[0.98] ${
            loadingPreview ? "opacity-80 animate-pulse-smooth" : ""
          }`}
        >
          Скачать отчёт
        </button>

        <p className="text-sm text-gray-500">
          Предпросмотр обновляется автоматически. Даты актуальны для: заказы / продажи / топ товаров.
        </p>
      </div>

      {/* предпросмотр */}
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4 animate-blur-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">👀 Предпросмотр</h2>
          <span className={`text-sm text-gray-500 ${loadingPreview ? "animate-pulse-smooth" : ""}`}>
            {loadingPreview ? "Загрузка..." : preview ? `Строк: ${preview.totalRows}` : "Нет данных"}
          </span>
        </div>

        <div key={animKey} className="animate-fade-in">
          {metricsCards?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {metricsCards.map((c) => (
                <MetricCard key={c.label} label={c.label} value={c.value} loading={false} />
              ))}
            </div>
          ) : loadingPreview ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard loading />
              <MetricCard loading />
              <MetricCard loading />
              <MetricCard loading />
            </div>
          ) : (
            <div className="text-sm text-gray-500">Метрики появятся после загрузки отчёта.</div>
          )}

          <div className="mt-4">
            {loadingPreview ? (
              <TableSkeleton columnsCount={preview?.columns?.length || 6} rowsCount={6} />
            ) : preview?.rows?.length ? (
              <div className="overflow-auto border rounded-xl animate-slide-down">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {preview.columns.map((c) => (
                        <th key={c.key} className="text-left p-2 border-b">
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
              <div className="text-sm text-gray-500">Нет строк для отображения.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
