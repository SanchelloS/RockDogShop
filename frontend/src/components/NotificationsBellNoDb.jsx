import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import axiosClient from "../api/axiosClient";

function formatTs(ts) {
  try {
    return new Date(ts).toLocaleString("ru-RU");
  } catch {
    return "";
  }
}

const statusMap = {
  Pending: "⏳ Ожидает обработки",
  Paid: "💳 Оплачен",
  Shipped: "📦 Отправлен",
  Delivered: "✅ Доставлен",
  Cancelled: "❌ Отменён",
};

function ruStatus(s) {
  return statusMap[s] || s || "";
}

export default function NotificationsBellNoDb({ user, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [badge, setBadge] = useState(0);

  const keyLastAdminCheck = "notif_admin_last_check";
  const keyAdminPrevPending = "notif_admin_prev_pending";
  const keyUserSnapshot = `notif_user_orders_${user?.id || "x"}`;

  const pushLocal = (n) => {
    setItems((prev) => [n, ...prev].slice(0, 30));
  };

  const clearBadge = () => setBadge(0);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const tick = async () => {
      try {
       if (user.role === "Admin") {
  const since = localStorage.getItem(keyLastAdminCheck) || "";
  const res = await axiosClient.get(
    `/notifications/poll?since=${encodeURIComponent(since)}`
  );

  if (!mounted) return;

  const cnt = Number(res.data?.newPending || 0);

  // обновляем last_check (по serverTime)
  if (res.data?.serverTime) {
    localStorage.setItem(keyLastAdminCheck, res.data.serverTime);
  }

  // ✅ бейдж можно обновлять всегда (показывает "сколько сейчас нужно обработать")
  setBadge(cnt);

  // ✅ анти-спам: уведомление только если cnt вырос
  const prevCnt = Number(localStorage.getItem(keyAdminPrevPending) || "0");

  if (cnt > prevCnt) {
    // пришли новые заказы (Pending стало больше)
    const diff = cnt - prevCnt;

    pushLocal({
      id: `admin_${Date.now()}`,
      title: "Новые заказы",
      message:
        diff === 1
          ? "Появился 1 новый заказ на обработку"
          : `Появилось новых заказов: ${diff}`,
      time: res.data?.serverTime || new Date().toISOString(),
      action: "/admin/orders",
    });
  }

  // ✅ сохраняем текущее значение как предыдущее
  localStorage.setItem(keyAdminPrevPending, String(cnt));
}

      } catch {
        // 401 обработает interceptor axiosClient
      }
    };

    tick();
    const t = setInterval(tick, 10000);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [user]);

  const visibleItems = useMemo(() => items, [items]);

  return (
    <div className="relative">
      <button
        className="relative py-2 px-4 hover:text-blue-600 transition md:p-0"
        onClick={() => {
          setOpen((v) => !v);
          clearBadge();
        }}
        title="Уведомления"
      >
        <Bell size={20} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 animate-pulse-smooth">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden animate-blur-in z-50">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="font-semibold text-gray-800">Уведомления</div>
          </div>

          <div className="max-h-96 overflow-auto">
            {visibleItems.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Пока нет уведомлений.</div>
            ) : (
              visibleItems.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => {
                    if (n.action) {
                      setOpen(false);
                      onNavigate?.(n.action);
                    }
                  }}
                >
                  <div className="text-sm font-semibold text-gray-800">{n.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {formatTs(n.time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
