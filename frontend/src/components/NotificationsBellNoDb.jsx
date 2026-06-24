import { useEffect, useState, useCallback } from "react";
import { Bell, Check, X } from "lucide-react";
import axiosClient from "../api/axiosClient";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function NotificationsBell({ user, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [notificationsRes, countRes] = await Promise.all([
        axiosClient.get("/notifications"),
        axiosClient.get("/notifications/unread-count")
      ]);
      
      setNotifications(notificationsRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    // Периодическая проверка новых уведомлений (каждые 30 секунд)
    const interval = setInterval(() => {
      if (user) {
        axiosClient.get("/notifications/unread-count").then(res => {
          setUnreadCount(res.data.count);
        });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Ошибка отметки прочитанным:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        if (data.orderId && notification.type === 'order') {
          onNavigate?.("/admin/orders");
        } else if (data.orderId && notification.type === 'order_status') {
          onNavigate?.("/orders");
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return "🛒";
      case 'order_status': return "📦";
      default: return "🔔";
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return "Только что";
      if (diffMins < 60) return `${diffMins} мин назад`;
      if (diffHours < 24) return `${diffHours} ч назад`;
      if (diffDays < 7) return `${diffDays} д назад`;
      return format(date, "dd MMM", { locale: ru });
    } catch {
      return "";
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition"
        title="Уведомления"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Заголовок */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  notifications.forEach(n => !n.is_read && markAsRead(n.id));
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Все прочитано
              </button>
            )}
          </div>

          {/* Список уведомлений */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Уведомлений пока нет</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition hover:bg-gray-50 ${
                    !notif.is_read ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Футер */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}