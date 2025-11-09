const jwt = require('jsonwebtoken');

// 🧩 Проверка токена и добавление req.user
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, login, role }
    console.log('🔒 Auth middleware triggered for', req.user);

    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// 👑 Проверка прав администратора
const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next();
  } catch (err) {
    console.error('adminMiddleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🚀 Экспорт обоих
module.exports = { authMiddleware, adminMiddleware };
