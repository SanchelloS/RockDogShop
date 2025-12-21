const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

// 📋 Регистрация
const registerUser = async (req, res) => {
  try {
    const { login, email, password, phone } = req.body;

    if (!login || !email || !password || !phone) {
      return res.status(400).json({ message: 'Пожалуйста, заполните все обязательные поля' });
    }

    const pool = await poolPromise;

    // Проверяем, существует ли пользователь с таким email
    const checkUser = await pool
      .request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE Email = @email');

    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.request()
      .input('login', login)
      .input('password', hashedPassword)
      .input('email', email)
      .input('phone', phone)
      .query(`
        INSERT INTO Users (Login, Password, Email, Phone, Role)
        VALUES (@login, @password, @email, @phone, 'User')
      `);

    res.status(201).json({ message: 'Регистрация прошла успешно' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Ошибка на сервере', error: err.message });
  }
};

// 🔑 Логин
const loginUser = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: 'Введите логин и пароль' });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('login', login)
      .query('SELECT * FROM Users WHERE Login = @login');

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный пароль' });
    }

    const token = jwt.sign(
      { id: user.UserID, login: user.Login, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.UserID,
        login: user.Login,
        role: user.Role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Ошибка при входе', error: err.message });
  }
};

// 👑 Получить всех пользователей
const getAllUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, Login, Email, Phone, Role
      FROM Users
      ORDER BY UserID DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
  }
};

// ✏️ Обновить данные пользователя (админ)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { login, email, phone, role, password } = req.body;

    const pool = await poolPromise;

    let fields = [];
    const request = pool.request();
    request.input("id", id);

    if (login !== undefined) {
      fields.push("Login = @login");
      request.input("login", login);
    }
    if (email !== undefined) {
      fields.push("Email = @Email");
      request.input("Email", email);
    }
    if (phone !== undefined) {
      fields.push("Phone = @Phone");
      request.input("Phone", phone);
    }
    if (role !== undefined) {
      fields.push("Role = @Role");
      request.input("Role", role);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push("Password = @Password");
      request.input("Password", hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    const query = `
      UPDATE Users
      SET ${fields.join(", ")}
      WHERE UserID = @id
    `;

    await request.query(query);
    res.json({ message: "Пользователь успешно обновлён" });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "Ошибка при обновлении пользователя" });
  }
};

// 🗑 Удалить пользователя полностью
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const pool = await poolPromise;
  const transaction = pool.transaction();

  try {
    await transaction.begin();
    const request = transaction.request();
    request.input("userId", id);

    await request.query(`DELETE FROM Cart WHERE UserID = @userId`);
    await request.query(`
      DELETE FROM OrderItems WHERE OrderID IN (
        SELECT OrderID FROM Orders WHERE UserID = @userId
      )
    `);
    await request.query(`DELETE FROM Orders WHERE UserID = @userId`);
    await request.query(`DELETE FROM DeliveryAddresses WHERE UserID = @userId`);

    const result = await request.query(`DELETE FROM Users WHERE UserID = @userId`);

    if (result.rowsAffected[0] === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    await transaction.commit();
    res.json({ message: "Пользователь и все его данные успешно удалены" });
  } catch (err) {
    console.error("deleteUser error:", err);
    await transaction.rollback();
    res.status(500).json({
      message: "Ошибка при удалении пользователя",
      error: err.message,
    });
  }
};

// ✅ GET /api/users/me
const getMe = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id", req.user.id)
      .query(`
        SELECT UserID, Login, Email, Phone, Role
        FROM Users
        WHERE UserID = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ✅ PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    const { login, email, phone, password } = req.body;

    const pool = await poolPromise;

    const fields = [];
    const request = pool.request();
    request.input("id", req.user.id);

    if (login !== undefined) {
      fields.push("Login = @login");
      request.input("login", login);
    }
    if (email !== undefined) {
      fields.push("Email = @email");
      request.input("email", email);
    }
    if (phone !== undefined) {
      fields.push("Phone = @phone");
      request.input("phone", phone);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push("Password = @password");
      request.input("password", hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    await request.query(`
      UPDATE Users
      SET ${fields.join(", ")}
      WHERE UserID = @id
    `);

    res.json({ message: "Профиль обновлён" });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ message: "Ошибка при обновлении профиля" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
};
