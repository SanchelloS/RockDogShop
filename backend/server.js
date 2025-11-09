// Импорт модулей
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Инициализация приложения
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🖼 Раздача загруженных изображений
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Подключение маршрутов
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const categoryRoutes = require('./routes/categories'); // ✅ добавлено

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes); // ✅ подключено
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/admin/users', require('./routes/adminUsers'));

// Простой тестовый маршрут
app.get('/', (req, res) => {
  res.send('API is working ✅');
});

// Порт из .env или 5000 по умолчанию
const PORT = process.env.PORT || 5000;

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
