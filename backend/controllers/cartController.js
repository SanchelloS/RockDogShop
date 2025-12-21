const { poolPromise, sql } = require('../config/db');


// 🛒 Получение корзины пользователя
// const getCart = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const pool = await poolPromise;

//     const result = await pool.request()
//       .input('userId', userId)
//       .query(`
//         SELECT c.ProductID, p.Name, p.Price, c.Quantity, p.MainImageURL
//         FROM Cart c
//         JOIN Products p ON c.ProductID = p.ProductID
//         WHERE c.UserID = @userId
//       `);

//     res.json(result.recordset);
//   } catch (err) {
//     console.error('GetCart error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT ProductID, Name, Price, Quantity, MainImageURL
        FROM dbo.vw_UserCart
        WHERE UserID = @userId
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('GetCart error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ➕ Добавление товара в корзину
// const addToCart = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { productId, quantity = 1 } = req.body;
//     const pool = await poolPromise;

//     const existing = await pool.request()
//       .input('userId', userId)
//       .input('productId', productId)
//       .query(`
//         SELECT * FROM Cart WHERE UserID = @userId AND ProductID = @productId
//       `);

//     if (existing.recordset.length > 0) {
//       await pool.request()
//         .input('userId', userId)
//         .input('productId', productId)
//         .input('quantity', quantity)
//         .query(`
//           UPDATE Cart
//           SET Quantity = Quantity + @quantity
//           WHERE UserID = @userId AND ProductID = @productId
//         `);
//     } else {
//       await pool.request()
//         .input('userId', userId)
//         .input('productId', productId)
//         .input('quantity', quantity)
//         .query(`
//           INSERT INTO Cart (UserID, ProductID, Quantity)
//           VALUES (@userId, @productId, @quantity)
//         `);
//     }

//     res.json({ message: 'Item added to cart successfully' });
//   } catch (err) {
//     console.error('AddToCart error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    const pool = await poolPromise;

    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('ProductID', sql.Int, productId)
      .input('Quantity', sql.Int, quantity)
      .execute('dbo.sp_AddToCart');

    res.json({ message: 'Item added to cart successfully' });
  } catch (err) {
    console.error('AddToCart error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ❌ Удаление товара
// const removeFromCart = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const productId = req.params.productId;
//     const pool = await poolPromise;

//     await pool.request()
//       .input('userId', userId)
//       .input('productId', productId)
//       .query(`
//         DELETE FROM Cart WHERE UserID = @userId AND ProductID = @productId
//       `);

//     res.json({ message: 'Item removed from cart' });
//   } catch (err) {
//     console.error('RemoveFromCart error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;
    const pool = await poolPromise;

    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('ProductID', sql.Int, productId)
      .execute('dbo.sp_RemoveFromCart');

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('RemoveFromCart error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


module.exports = { getCart, addToCart, removeFromCart };
