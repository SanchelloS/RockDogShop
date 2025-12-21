const { poolPromise, sql } = require('../config/db');

// 🧾 Создание заказа
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address } = req.body;
    const pool = await poolPromise;

    // Проверяем корзину
    const cartItems = await pool.request()
      .input('userId', userId)
      .query(`
        SELECT 
          c.ProductID, 
          c.Quantity, 
          p.Price
        FROM Cart c
        JOIN Products p ON c.ProductID = p.ProductID
        WHERE c.UserID = @userId
      `);

    if (cartItems.recordset.length === 0)
      return res.status(400).json({ message: 'Корзина пуста' });

    if (!address?.city || !address?.street || !address?.house)
      return res.status(400).json({ message: 'Не указан полный адрес доставки' });

    // Добавляем адрес
    const addressResult = await pool.request()
      .input('userId', userId)
      .input('city', address.city)
      .input('street', address.street)
      .input('house', address.house)
      .input('apartment', address.apartment || null)
      .input('zip', address.postalCode || null)
      .query(`
        INSERT INTO DeliveryAddresses (UserID, City, Street, House, Apartment, PostalCode)
        OUTPUT INSERTED.AddressID
        VALUES (@userId, @city, @street, @house, @apartment, @zip)
      `);

    const addressId = addressResult.recordset[0].AddressID;

    // Общая сумма
    const total = cartItems.recordset.reduce(
      (sum, i) => sum + Number(i.Price) * i.Quantity,
      0
    );

    // Создаём заказ
    const orderResult = await pool.request()
      .input('userId', userId)
      .input('addressId', addressId)
      .input('total', sql.Decimal(10, 2), total)
      .query(`
        INSERT INTO Orders (UserID, AddressID, TotalAmount)
        OUTPUT INSERTED.OrderID
        VALUES (@userId, @addressId, @total)
      `);

    const orderId = orderResult.recordset[0].OrderID;

    // Добавляем товары в заказ
    for (const item of cartItems.recordset) {
      await pool.request()
        .input('orderId', orderId)
        .input('productId', item.ProductID)
        .input('quantity', item.Quantity)
        .input('price', sql.Decimal(10, 2), item.Price)
        .query(`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price)
          VALUES (@orderId, @productId, @quantity, @price)
        `);
    }

    // Очищаем корзину
    await pool.request()
      .input('userId', userId)
      .query('DELETE FROM Cart WHERE UserID = @userId');

    res.json({ message: 'Заказ успешно оформлен', orderId, total });
  } catch (err) {
    console.error('❌ createOrder error:', err);
    res.status(500).json({ message: 'Ошибка при создании заказа', error: err.message });
  }
};

// 🧍‍♂️ Заказы пользователя
const getUserOrders = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', req.user.id)
      .query(`
        SELECT 
          o.OrderID, o.OrderDate, o.TotalAmount, o.Status,
          oi.ProductID, oi.Quantity, oi.Price,
          p.Name, p.MainImageURL
        FROM Orders o
        JOIN OrderItems oi ON o.OrderID = oi.OrderID
        JOIN Products p ON oi.ProductID = p.ProductID
        WHERE o.UserID = @userId
        ORDER BY o.OrderDate DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// 👑 Все заказы (админ)
const getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied. Admin only.' });

    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.Status,
             u.Login AS UserLogin, d.City, d.Street, d.House, d.PostalCode, d.Apartment
      FROM Orders o
      JOIN Users u ON o.UserID = u.UserID
      JOIN DeliveryAddresses d ON o.AddressID = d.AddressID
      ORDER BY o.OrderDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// 👁 Конкретный заказ
const getOrderById = async (req, res) => {
  try {
    const pool = await poolPromise;
    const orderId = req.params.id;

    const order = await pool.request()
      .input('orderId', orderId)
      .query(`
        SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.Status,
               u.Login AS UserLogin, d.City, d.Street, d.House, d.PostalCode, d.Apartment
        FROM Orders o
        JOIN Users u ON o.UserID = u.UserID
        JOIN DeliveryAddresses d ON o.AddressID = d.AddressID
        WHERE o.OrderID = @orderId
      `);

    if (!order.recordset.length)
      return res.status(404).json({ message: 'Order not found' });

    const items = await pool.request()
      .input('orderId', orderId)
      .query(`
        SELECT oi.ProductID, p.Name, oi.Quantity, oi.Price, p.MainImageURL
        FROM OrderItems oi
        JOIN Products p ON oi.ProductID = p.ProductID
        WHERE oi.OrderID = @orderId
      `);

    // Включаем информацию о квартире в ответ
    res.json({ 
      ...order.recordset[0], 
      items: items.recordset 
    });
  } catch (err) {
    console.error('getOrderById error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// 🔄 Обновить статус
const updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== 'Admin')
      return res.status(403).json({ message: 'Access denied. Admins only.' });

    const { id } = req.params;
    const { status } = req.body;
    const pool = await poolPromise;

    const validStatuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status value' });

    const result = await pool.request()
      .input('orderId', id)
      .input('status', status)
      .query(`UPDATE Orders SET Status = @status WHERE OrderID = @orderId`);

    if (!result.rowsAffected[0])
      return res.status(404).json({ message: `Order ${id} not found` });

    res.json({ message: 'Order status updated', id, status });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ❌ Удалить заказ
const deleteOrder = async (req, res) => {
  const pool = await poolPromise;
  const transaction = pool.transaction();
  try {
    await transaction.begin();

    await transaction.request()
      .input("orderId", req.params.id)
      .query("DELETE FROM OrderItems WHERE OrderID = @orderId");

    const result = await transaction.request()
      .input("orderId", req.params.id)
      .query("DELETE FROM Orders WHERE OrderID = @orderId");

    if (!result.rowsAffected[0]) {
      await transaction.rollback();
      return res.status(404).json({ message: "Заказ не найден" });
    }

    await transaction.commit();
    res.json({ message: "Заказ успешно удалён" });
  } catch (err) {
    console.error("deleteOrder error:", err);
    await transaction.rollback().catch(() => {});
    res.status(500).json({ message: "Ошибка при удалении", error: err.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
