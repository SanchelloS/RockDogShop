const express = require('express');
const router = express.Router();

// ✅ правильный импорт
const { authMiddleware } = require('../middleware/authMiddleware');

const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');

// Только авторизованные пользователи
router.get('/', authMiddleware, getCart);
router.post('/add', authMiddleware, addToCart);
router.delete('/:productId', authMiddleware, removeFromCart);

module.exports = router;
