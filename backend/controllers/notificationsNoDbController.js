const { poolPromise } = require("../config/db");

/**
 * GET /api/notifications/poll
 * query:
 *  - since (ISO)  -> для админа: новые заказы после since
 *  - forUser=1    -> для юзера: возвращаем список заказов (OrderID, Status, OrderDate)
 *
 * Возвращает:
 *  - admin: { newPending: number }
 *  - user:  { orders: [{OrderID, Status, OrderDate}] }
 */
exports.poll = async (req, res) => {
  try {
    const pool = await poolPromise;

    // --- ADMIN: новые Pending заказы после since
    if (req.user.role === "Admin") {
      const sinceRaw = req.query.since;
      let since = null;
      if (sinceRaw) {
        const d = new Date(sinceRaw);
        if (!isNaN(d.getTime())) since = d;
      }

      const request = pool.request();
      if (since) request.input("since", since);

      const result = await request.query(`
        SELECT COUNT(*) AS Cnt
        FROM Orders o
        WHERE o.Status = 'Pending'
        ${since ? "AND o.OrderDate > @since" : ""}
      `);

      return res.json({
        mode: "admin",
        newPending: result.recordset[0]?.Cnt || 0,
        serverTime: new Date().toISOString(),
      });
    }

    // --- USER: статусы его заказов
    const result = await pool.request()
      .input("userId", req.user.id)
      .query(`
        SELECT OrderID, Status, OrderDate
        FROM Orders
        WHERE UserID = @userId
        ORDER BY OrderDate DESC
      `);

    return res.json({
      mode: "user",
      orders: result.recordset,
      serverTime: new Date().toISOString(),
    });

  } catch (err) {
    console.error("notifications poll error:", err);
    res.status(500).json({ message: "Ошибка получения уведомлений" });
  }
};
