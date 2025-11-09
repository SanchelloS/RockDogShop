const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  deleteUser
} = require('../controllers/usersController');


// 🧩 Регистрация
router.post('/register', registerUser);

// 🔑 Вход
router.post('/login', loginUser);

// 👑 Получить всех пользователей (только админ)
router.get('/', authMiddleware, getAllUsers);

// ✏️ Обновить пользователя (админ или сам пользователь)
router.put('/:id', authMiddleware, updateUser);

// 🗑 Удалить пользователя (только админ)
router.delete('/:id', authMiddleware, deleteUser);



// 🔹 Получить профиль текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('id', req.user.id)
      .query('SELECT UserID, Login, Email, Phone, Role FROM Users WHERE UserID = @id');

    if (result.recordset.length === 0)
      return res.status(404).json({ message: 'Пользователь не найден' });

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});



// ✏️ Обновить профиль текущего пользователя
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { login, email, phone, password } = req.body;
    const pool = await poolPromise;

    const fields = [];
    const request = pool.request();
    request.input('id', req.user.id);

    if (login) {
      fields.push('Login = @login');
      request.input('login', login);
    }
    if (email) {
      fields.push('Email = @Email');
      request.input('Email', email);
    }
    if (phone) {
      fields.push('Phone = @Phone');
      request.input('Phone', phone);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('Password = @Password');
      request.input('Password', hashed);
    }

    if (fields.length === 0)
      return res.status(400).json({ message: 'Нет данных для обновления' });

    const query = `UPDATE Users SET ${fields.join(', ')} WHERE UserID = @id`;
    await request.query(query);

    res.json({ message: 'Профиль успешно обновлён' });
  } catch (err) {
    console.error('PUT /me error:', err);
    res.status(500).json({ message: 'Ошибка при обновлении профиля' });
  }
});



module.exports = router;
