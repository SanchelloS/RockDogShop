// Импорт модулей
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// Инициализация приложения
const app = express();

// Middleware
app.use(
  cors({
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json());

// 🖼 Раздача загруженных изображений
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔹 Подключение маршрутов бэкенда
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const categoryRoutes = require('./routes/categories');

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use("/api/admin/reports", require("./routes/adminReports"));
app.use("/api/notifications", require("./routes/notificationsNoDb"));


// 🔹 Настройка раздачи фронтенда (нашего скомпилированного React/Vite приложения)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Любой запрос, который не совпал с API-маршрутами выше, отправляем на фронтенд
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});


// Порт из .env или 5000 по умолчанию
const PORT = process.env.PORT || 5000;

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});