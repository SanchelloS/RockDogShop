const { poolPromise } = require("../config/db");

// === Получить все категории ===
exports.getCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Categories ORDER BY CategoryID DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error("Ошибка при получении категорий:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// === Добавить категорию ===
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Название категории обязательно" });

    const pool = await poolPromise;
    await pool.request().input("Name", name)
      .query("INSERT INTO Categories (Name) VALUES (@Name)");

    res.json({ message: "Категория успешно добавлена" });
  } catch (err) {
    console.error("Ошибка при добавлении категории:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// === Обновить категорию ===
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Название обязательно" });

    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", id)
      .input("name", name)
      .query("UPDATE Categories SET Name=@name WHERE CategoryID=@id");

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: "Категория не найдена" });

    res.json({ message: "Категория успешно обновлена" });
  } catch (err) {
    console.error("Ошибка при обновлении категории:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// === Удалить категорию (с проверкой наличия товаров) ===
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Проверяем, есть ли товары с этой категорией
    const check = await pool.request()
      .input("id", id)
      .query("SELECT COUNT(*) AS ProductCount FROM Products WHERE CategoryID=@id");

    if (check.recordset[0].ProductCount > 0) {
      return res.status(400).json({
        message: "Невозможно удалить категорию, к которой привязаны товары.",
      });
    }

    // Если нет товаров — удаляем
    const result = await pool.request()
      .input("id", id)
      .query("DELETE FROM Categories WHERE CategoryID=@id");

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: "Категория не найдена" });

    res.json({ message: "Категория успешно удалена" });
  } catch (err) {
    console.error("Ошибка при удалении категории:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
