const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { getAllUsers, updateUser, deleteUser } = require('../controllers/usersController');

// 👑 Получить всех пользователей
router.get('/', authMiddleware, adminMiddleware, getAllUsers);

// ✏️ Обновить пользователя
router.put('/:id', authMiddleware, adminMiddleware, updateUser);

// 🗑 Удалить пользователя
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
