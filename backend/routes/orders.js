const express = require('express');
const router = express.Router();

// Подключаем middlewares
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Подключаем контроллеры
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/ordersController');


// ===============================
// 📦 Пользовательские маршруты
// ===============================

// Создание нового заказа (доступно всем авторизованным пользователям)
router.post('/', authMiddleware, createOrder);

// Получение заказов текущего пользователя
router.get('/', authMiddleware, getUserOrders);

// ===============================
// 👑 Админские маршруты
// ===============================

// Получить все заказы (только админ)
router.get('/all', authMiddleware, adminMiddleware, getAllOrders);

// Получить конкретный заказ по ID (только админ)
router.get('/:id', authMiddleware, adminMiddleware, getOrderById);

// Обновить статус заказа (только админ)
router.put('/:id/status', authMiddleware, adminMiddleware, updateOrderStatus);

// Удалить заказ (только админ)
router.delete("/:id", authMiddleware, adminMiddleware, deleteOrder);

// Экспорт маршрутов
module.exports = router;
