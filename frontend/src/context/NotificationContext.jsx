import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import axiosClient from '../api/axiosClient';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user) return;
    
    const currentPage = reset ? 0 : page;
    setLoading(true);
    
    try {
      const res = await axiosClient.get(`/notifications?limit=20&offset=${currentPage * 20}`);
      
      if (reset) {
        setNotifications(res.data.notifications);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...res.data.notifications]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(res.data.notifications.length === 20);
    } catch (error) {
      // Ошибка загрузки уведомлений - логируем только в development режиме
      if (process.env.NODE_ENV === 'development') {
        // console.debug('Ошибка загрузки уведомлений:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const res = await axiosClient.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      // Ошибка загрузки счетчика - игнорируем
      if (process.env.NODE_ENV === 'development') {
        // console.debug('Ошибка загрузки счетчика:', error);
      }
    }
  }, [user]);

  const markAsRead = useCallback(async (id) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Ошибка отметки прочитанным - игнорируем
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosClient.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (error) {
      // Ошибка отметки всех - игнорируем
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await axiosClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (!notifications.find(n => n.id === id)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      // Ошибка удаления - игнорируем
    }
  }, [notifications]);

  // Проверка новых уведомлений каждые 30 секунд
  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};