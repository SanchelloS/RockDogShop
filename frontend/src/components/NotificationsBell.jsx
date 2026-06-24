import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Загружаем уведомления при монтировании компонента
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // При открытии дропдауна обновляем список
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true);
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        if (data.orderId) {
          if (notification.type === 'order' || notification.type === 'admin_order') {
            navigate('/admin/orders');
          } else if (notification.type === 'order_status') {
            navigate('/orders');
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return '🛒';
      case 'admin_order': return '📦';
      case 'order_status': return '📝';
      case 'order_cancelled': return '❌';
      case 'broadcast': return '📢';
      default: return '🔔';
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
      return format(date, "dd MMM yyyy", { locale: ru });
    } catch {
      return "";
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(false);
    }
  };

  // Защита от undefined - создаем безопасный массив
  const safeNotifications = notifications || [];

  return (
    <div className="relative" ref={dropdownRef}>
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
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Check size={12} /> Все прочитано
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && safeNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : safeNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Уведомлений пока нет</p>
              </div>
            ) : (
              <>
                {safeNotifications.map((notif) => (
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
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] text-gray-400">{formatDate(notif.created_at)}</p>
                          {notif.user_login && (
                            <p className="text-[10px] text-gray-400">от {notif.user_login}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full p-3 text-center text-sm text-gray-500 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {loading ? "Загрузка..." : "Загрузить ещё"}
                  </button>
                )}
              </>
            )}
          </div>

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