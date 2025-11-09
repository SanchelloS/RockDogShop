const { poolPromise, sql } = require("../config/db");

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address } = req.body;
    const pool = await poolPromise;

    // 1️⃣ Добавляем адрес доставки
    const addressResult = await pool.request()
      .input("userId", userId)
      .input("city", address.city)
      .input("street", address.street)
      .input("house", address.house)
      .input("apartment", address.apartment)
      .input("postalCode", address.postalCode)
      .query(`
        INSERT INTO DeliveryAddresses (UserID, City, Street, House, Apartment, PostalCode)
        OUTPUT INSERTED.AddressID
        VALUES (@userId, @city, @street, @house, @apartment, @postalCode)
      `);

    const addressId = addressResult.recordset[0].AddressID;

    // 2️⃣ Получаем товары из корзины + цену из Products
    const cartItems = await pool.request()
      .input("userId", userId)
      .query(`
        SELECT 
          c.ProductID, 
          c.Quantity,
          p.Price
        FROM Cart c
        JOIN Products p ON c.ProductID = p.ProductID
        WHERE c.UserID = @userId
      `);

    if (cartItems.recordset.length === 0) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    // 3️⃣ Считаем сумму
    const totalAmount = cartItems.recordset.reduce(
      (sum, item) => sum + Number(item.Price) * item.Quantity,
      0
    );

    // 4️⃣ Создаём заказ
    const orderResult = await pool.request()
      .input("userId", userId)
      .input("addressId", addressId)
      .input("totalAmount", sql.Decimal(10, 2), totalAmount)
      .query(`
        INSERT INTO Orders (UserID, OrderDate, TotalAmount, Status, AddressID)
        OUTPUT INSERTED.OrderID
        VALUES (@userId, GETDATE(), @totalAmount, 'Pending', @addressId)
      `);

    const orderId = orderResult.recordset[0].OrderID;

    // 5️⃣ Переносим товары из корзины в OrderItems (теперь с ценой)
    for (const item of cartItems.recordset) {
      const price = Number(item.Price);
      await pool.request()
        .input("orderId", orderId)
        .input("productId", item.ProductID)
        .input("quantity", item.Quantity)
        .input("price", sql.Decimal(10, 2), price)
        .query(`
          INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price)
          VALUES (@orderId, @productId, @quantity, @price)
        `);
    }

    // 6️⃣ Очищаем корзину
    await pool.request()
      .input("userId", userId)
      .query(`DELETE FROM Cart WHERE UserID = @userId`);

    res.json({
      message: "Заказ успешно оформлен",
      orderId,
      totalAmount
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({
      message: "Ошибка при оформлении заказа",
      error: err.message
    });
  }
};

module.exports = { createOrder };
