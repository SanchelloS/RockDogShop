const { poolPromise, sql } = require('../config/db');
const { buildExcel, buildWord } = require("../services/reportBuilders");

// ---------- helpers ----------
function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toInt(value, def) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : def;
}

function toMetric(value, allowed, def) {
  return allowed.includes(value) ? value : def;
}

function ymd(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// ---------- reports ----------
async function ordersReport(req) {
  const pool = await poolPromise;

  const dateFrom = safeDate(req.query.dateFrom);
  const dateTo = safeDate(req.query.dateTo);

  const request = pool.request();
  if (dateFrom) request.input("dateFrom", dateFrom);
  if (dateTo) request.input("dateTo", dateTo);

  const where = `
    WHERE 1=1
    ${dateFrom ? "AND o.OrderDate >= @dateFrom" : ""}
    ${dateTo ? "AND o.OrderDate <= @dateTo" : ""}
  `;

  const result = await request.query(`
    SELECT 
      o.OrderID,
      o.OrderDate,
      o.TotalAmount,
      o.Status,
      u.Login AS UserLogin,
      d.City, d.Street, d.House, d.PostalCode, d.Apartment
    FROM Orders o
    JOIN Users u ON o.UserID = u.UserID
    JOIN DeliveryAddresses d ON o.AddressID = d.AddressID
    ${where}
    ORDER BY o.OrderDate DESC
  `);

const rows = result.recordset.map((r) => ({
  OrderID: r.OrderID,
  OrderDate: r.OrderDate ? new Date(r.OrderDate).toLocaleString("ru-RU") : "",
  TotalAmount: r.TotalAmount,
  Status: r.Status,
  UserLogin: r.UserLogin,
  Address: `${r.City}, ${r.Street} ${r.House}${r.Apartment ? ", Квартира: " + r.Apartment : ""}${r.PostalCode ? ", " + r.PostalCode : ""}`,
}));

  const columns = [
    { header: "№ Заказа", key: "OrderID" },
    { header: "Дата", key: "OrderDate" },
    { header: "Сумма", key: "TotalAmount" },
    { header: "Статус", key: "Status" },
    { header: "Пользователь", key: "UserLogin" },
    { header: "Адрес", key: "Address" },
  ];

  return { title: "Отчёт по заказам", columns, rows };
}

async function productsReport() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT 
      p.ProductID, p.Name, p.Price, p.QuantityInStock,
      c.Name AS CategoryName
    FROM Products p
    JOIN Categories c ON p.CategoryID = c.CategoryID
    ORDER BY p.ProductID DESC
  `);

  const rows = result.recordset.map((r) => ({
    ProductID: r.ProductID,
    Name: r.Name,
    CategoryName: r.CategoryName,
    Price: r.Price,
    QuantityInStock: r.QuantityInStock,
  }));

  const columns = [
    { header: "ID", key: "ProductID" },
    { header: "Товар", key: "Name" },
    { header: "Категория", key: "CategoryName" },
    { header: "Цена", key: "Price" },
    { header: "Остаток", key: "QuantityInStock" },
  ];

  return { title: "Отчёт по товарам", columns, rows };
}

async function usersReport() {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT UserID, Login, Email, Phone, Role
    FROM Users
    ORDER BY UserID DESC
  `);

  const rows = result.recordset.map((r) => ({
    UserID: r.UserID,
    Login: r.Login,
    Email: r.Email,
    Phone: r.Phone,
    Role: r.Role,
  }));

  const columns = [
    { header: "ID", key: "UserID" },
    { header: "Логин", key: "Login" },
    { header: "Email", key: "Email" },
    { header: "Телефон", key: "Phone" },
    { header: "Роль", key: "Role" },
  ];

  return { title: "Отчёт по пользователям", columns, rows };
}

async function salesByDayReport(req) {
  const pool = await poolPromise;

  const dateFrom = safeDate(req.query.dateFrom);
  const dateTo = safeDate(req.query.dateTo);

  const request = pool.request();
  if (dateFrom) request.input("dateFrom", dateFrom);
  if (dateTo) request.input("dateTo", dateTo);

  const where = `
    WHERE 1=1
    ${dateFrom ? "AND o.OrderDate >= @dateFrom" : ""}
    ${dateTo ? "AND o.OrderDate <= @dateTo" : ""}
  `;

  const result = await request.query(`
    SELECT
      CAST(o.OrderDate AS date) AS Day,
      COUNT(DISTINCT o.OrderID) AS OrdersCount,
      SUM(oi.Quantity) AS ItemsCount,
      SUM(CAST(oi.Price AS decimal(10,2)) * oi.Quantity) AS Revenue
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderID = o.OrderID
    ${where}
    GROUP BY CAST(o.OrderDate AS date)
    ORDER BY Day DESC
  `);

  const rows = result.recordset.map((r) => ({
    Day: r.Day ? ymd(r.Day) : "",
    OrdersCount: r.OrdersCount ?? 0,
    ItemsCount: r.ItemsCount ?? 0,
    Revenue: r.Revenue ?? 0,
  }));

  const columns = [
    { header: "День", key: "Day" },
    { header: "Кол-во заказов", key: "OrdersCount" },
    { header: "Кол-во товаров", key: "ItemsCount" },
    { header: "Выручка", key: "Revenue" },
  ];

  return { title: "Отчёт: продажи по дням", columns, rows };
}

async function topProductsReport(req) {
  const pool = await poolPromise;

  const dateFrom = safeDate(req.query.dateFrom);
  const dateTo = safeDate(req.query.dateTo);

  const limit = Math.min(200, Math.max(1, toInt(req.query.limit, 10)));
  const metric = toMetric(req.query.metric, ["revenue", "qty"], "revenue");

  const request = pool.request();
  request.input("limit", limit);
  if (dateFrom) request.input("dateFrom", dateFrom);
  if (dateTo) request.input("dateTo", dateTo);

  const where = `
    WHERE 1=1
    ${dateFrom ? "AND o.OrderDate >= @dateFrom" : ""}
    ${dateTo ? "AND o.OrderDate <= @dateTo" : ""}
  `;

  const orderBy =
    metric === "qty"
      ? "ORDER BY SUM(oi.Quantity) DESC"
      : "ORDER BY SUM(CAST(oi.Price AS decimal(10,2)) * oi.Quantity) DESC";

  const result = await request.query(`
    SELECT TOP (@limit)
      p.ProductID,
      p.Name,
      c.Name AS CategoryName,
      SUM(oi.Quantity) AS SoldQty,
      SUM(CAST(oi.Price AS decimal(10,2)) * oi.Quantity) AS Revenue
    FROM Orders o
    JOIN OrderItems oi ON oi.OrderID = o.OrderID
    JOIN Products p ON p.ProductID = oi.ProductID
    JOIN Categories c ON c.CategoryID = p.CategoryID
    ${where}
    GROUP BY p.ProductID, p.Name, c.Name
    ${orderBy}
  `);

  const rows = result.recordset.map((r) => ({
    ProductID: r.ProductID,
    Name: r.Name,
    CategoryName: r.CategoryName,
    SoldQty: r.SoldQty ?? 0,
    Revenue: r.Revenue ?? 0,
  }));

  const columns = [
    { header: "ID", key: "ProductID" },
    { header: "Товар", key: "Name" },
    { header: "Категория", key: "CategoryName" },
    { header: "Продано (шт)", key: "SoldQty" },
    { header: "Выручка", key: "Revenue" },
  ];

  const title =
    metric === "qty" ? "ТОП товаров по количеству" : "ТОП товаров по выручке";

  return { title, columns, rows };
}

async function stockReport(req) {
  const pool = await poolPromise;

  const minStock = Math.max(0, toInt(req.query.minStock, 0));

  const request = pool.request();
  request.input("minStock", minStock);

  const result = await request.query(`
    SELECT
      p.ProductID,
      p.Name,
      c.Name AS CategoryName,
      p.Price,
      p.QuantityInStock
    FROM Products p
    JOIN Categories c ON c.CategoryID = p.CategoryID
    WHERE p.QuantityInStock <= @minStock
    ORDER BY p.QuantityInStock ASC, p.ProductID DESC
  `);

  const rows = result.recordset.map((r) => ({
    ProductID: r.ProductID,
    Name: r.Name,
    CategoryName: r.CategoryName,
    Price: r.Price,
    QuantityInStock: r.QuantityInStock,
  }));

  const columns = [
    { header: "ID", key: "ProductID" },
    { header: "Товар", key: "Name" },
    { header: "Категория", key: "CategoryName" },
    { header: "Цена", key: "Price" },
    { header: "Остаток", key: "QuantityInStock" },
  ];

  return { title: `Отчёт: остатки <= ${minStock}`, columns, rows };
}

// ---------- map ----------
const reportMap = {
  orders: ordersReport,
  products: productsReport,
  users: usersReport,
  sales: salesByDayReport,
  "top-products": topProductsReport,
  stock: stockReport,
};

// ---------- download ----------
exports.downloadReport = async (req, res) => {
  try {
    const { type } = req.params;
    const format = (req.query.format || "excel").toLowerCase(); // excel | word

    const builder = reportMap[type];
    if (!builder) return res.status(400).json({ message: "Unknown report type" });

    const data = await builder(req);

    let buffer, contentType, ext;
    if (format === "word") {
      buffer = await buildWord(data);
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      ext = "docx";
    } else {
      buffer = await buildExcel(data);
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      ext = "xlsx";
    }

    // имя файла: type + dd-mm + параметры
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const extra = [];
    if (req.query.dateFrom) extra.push(`from-${req.query.dateFrom}`);
    if (req.query.dateTo) extra.push(`to-${req.query.dateTo}`);
    if (req.query.limit) extra.push(`top-${req.query.limit}`);
    if (req.query.metric) extra.push(req.query.metric);
    if (req.query.minStock) extra.push(`min-${req.query.minStock}`);

    const suffix = extra.length ? `_${extra.join("_")}` : "";
    const fileName = `${type}-${day}-${month}${suffix}.${ext}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("downloadReport error:", err);
    res.status(500).json({ message: "Ошибка генерации отчёта", error: err.message });
  }
  
};
exports.previewReport = async (req, res) => {
  try {
    const { type } = req.params;

    const builder = reportMap[type];
    if (!builder) return res.status(400).json({ message: "Unknown report type" });

    const data = await builder(req); // {title, columns, rows}

    const previewLimit = Math.min(
      50,
      Math.max(1, parseInt(req.query.previewLimit || "15", 10))
    );

    const rows = data.rows.slice(0, previewLimit);

    const metrics = {};

    if (type === "orders") {
      const totalOrders = data.rows.length;
      const totalSum = data.rows.reduce(
        (s, r) => s + Number(r.TotalAmount || 0),
        0
      );
      metrics.totalOrders = totalOrders;
      metrics.totalSum = Number(totalSum.toFixed(2));
    }

    if (type === "products") {
      const totalProducts = data.rows.length;
      const totalStock = data.rows.reduce(
        (s, r) => s + Number(r.QuantityInStock || 0),
        0
      );
      metrics.totalProducts = totalProducts;
      metrics.totalStock = totalStock;
    }

    if (type === "users") {
      metrics.totalUsers = data.rows.length;
      const byRole = {};
      for (const r of data.rows) {
        const role = r.Role || "Unknown";
        byRole[role] = (byRole[role] || 0) + 1;
      }
      metrics.byRole = byRole;
    }

    if (type === "sales") {
      const days = data.rows.length;
      const revenue = data.rows.reduce((s, r) => s + Number(r.Revenue || 0), 0);
      const orders = data.rows.reduce(
        (s, r) => s + Number(r.OrdersCount || 0),
        0
      );
      const items = data.rows.reduce(
        (s, r) => s + Number(r.ItemsCount || 0),
        0
      );

      metrics.days = days;
      metrics.revenue = Number(revenue.toFixed(2));
      metrics.orders = orders;
      metrics.items = items;
      metrics.avgOrderValue = orders > 0 ? Number((revenue / orders).toFixed(2)) : 0;
    }

    if (type === "top-products") {
      metrics.rows = data.rows.length;
      const revenue = data.rows.reduce((s, r) => s + Number(r.Revenue || 0), 0);
      const qty = data.rows.reduce((s, r) => s + Number(r.SoldQty || 0), 0);
      metrics.totalRevenueTop = Number(revenue.toFixed(2));
      metrics.totalSoldQtyTop = qty;

      if (data.rows[0]) {
        metrics.top1 = {
          name: data.rows[0].Name,
          revenue: Number(data.rows[0].Revenue || 0),
          qty: Number(data.rows[0].SoldQty || 0),
        };
      }
    }

    if (type === "stock") {
      metrics.lowStockCount = data.rows.length;
      if (data.rows.length) {
        const min = Math.min(
          ...data.rows.map((r) => Number(r.QuantityInStock ?? 0))
        );
        metrics.minStock = Number.isFinite(min) ? min : 0;
      } else {
        metrics.minStock = 0;
      }
    }

    res.json({
      title: data.title,
      columns: data.columns,
      rows,
      metrics,
      totalRows: data.rows.length,
      previewLimit,
    });
  } catch (err) {
    console.error("previewReport error:", err);
    res.status(500).json({ message: "Ошибка превью отчёта", error: err.message });
  }
};

