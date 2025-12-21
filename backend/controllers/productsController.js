const { poolPromise, sql } = require('../config/db');

// ======== PRODUCTS ========

// Получить все товары
const getAllProducts = async (req, res) => {
  try {
    const pool = await poolPromise;
    // const result = await pool.request().query(`
    //   SELECT 
    //     p.ProductID,
    //     p.Name,
    //     p.Description,
    //     p.Price,
    //     p.QuantityInStock,
    //     p.CategoryID,
    //     p.MainImageURL,
    //     c.Name AS CategoryName
    //   FROM Products p
    //   JOIN Categories c ON p.CategoryID = c.CategoryID
    //   ORDER BY p.ProductID DESC
    // `);
const result = await pool.request().query(`
  SELECT
    ProductID, Name, Description, Price, QuantityInStock,
    CategoryID, MainImageURL, CategoryName
  FROM dbo.vw_ProductsWithCategory
  ORDER BY ProductID DESC
`);

    res.json(result.recordset);
  } catch (err) {
    console.error('getAllProducts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Получить товар по ID (теперь с дополнительными изображениями)
const getProductById = async (req, res) => {
  try {
    const pool = await poolPromise;

    // 🔹 Основная информация о товаре
    const productResult = await pool.request()
      .input('id', req.params.id)
      .query(`
        SELECT 
          p.ProductID, 
          p.Name, 
          p.Description, 
          p.Price, 
          p.QuantityInStock,
          p.MainImageURL,
          c.Name AS CategoryName
        FROM Products p
        JOIN Categories c ON p.CategoryID = c.CategoryID
        WHERE p.ProductID = @id
      `);

    if (productResult.recordset.length === 0)
      return res.status(404).json({ message: 'Product not found' });

    const product = productResult.recordset[0];

    // 🔹 Дополнительные изображения
    const imagesResult = await pool.request()
      .input('productId', req.params.id)
      .query(`SELECT ImageURL FROM ProductImages WHERE ProductID = @productId`);

    const images = imagesResult.recordset.map(img => img.ImageURL);

    // 🔹 Объединяем и отправляем ответ
    res.json({
      ...product,
      Images: images
    });

  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Добавить товар (Admin)
const addProduct = async (req, res) => {
  try {
    const { name, description, price, quantityInStock, categoryId } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('name', name)
      .input('description', description)
      .input('price', price)
      .input('quantityInStock', quantityInStock)
      .input('categoryId', categoryId)
      .query(`
        INSERT INTO Products (Name, Description, Price, QuantityInStock, CategoryID)
        OUTPUT INSERTED.ProductID
        VALUES (@name, @description, @price, @quantityInStock, @categoryId)
      `);

    const productId = result.recordset[0].ProductID;

    res.status(201).json({ message: 'Product added successfully', productId });
  } catch (err) {
    console.error('addProduct error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Обновить товар (Admin)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantityInStock, categoryId } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', id)
      .input('name', name)
      .input('description', description)
      .input('price', price)
      .input('quantityInStock', quantityInStock)
      .input('categoryId', categoryId)
      .query(`
        UPDATE Products
        SET Name=@name, Description=@description, Price=@price,
            QuantityInStock=@quantityInStock, CategoryID=@categoryId
        WHERE ProductID=@id
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Удалить товар (Admin)
const deleteProduct = async (req, res) => {
  const pool = await poolPromise;
  const transaction = pool.transaction();

  try {
    const { id } = req.params;

    await transaction.begin();
    const request = transaction.request();
    request.input("id", id);

    // 1) Удаляем доп. изображения (иначе FK не даст удалить товар)
    await request.query(`
      DELETE FROM ProductImages
      WHERE ProductID = @id
    `);

    // 2) Удаляем из корзин (на всякий)
    await request.query(`
      DELETE FROM Cart
      WHERE ProductID = @id
    `);

    // 3) Можно обнулить MainImageURL (не обязательно, но логично)
    await request.query(`
      UPDATE Products
      SET MainImageURL = NULL
      WHERE ProductID = @id
    `);

    // 4) Удаляем сам товар
    const result = await request.query(`
      DELETE FROM Products
      WHERE ProductID = @id
    `);

    if (!result.rowsAffected[0]) {
      await transaction.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    await transaction.commit();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    try { await transaction.rollback(); } catch {}
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ======== CATEGORIES ========

const getCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT * FROM Categories ORDER BY CategoryID DESC`);
    res.json(result.recordset);
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const pool = await poolPromise;

    await pool.request().input('name', name)
      .query(`INSERT INTO Categories (Name) VALUES (@name)`);

    res.status(201).json({ message: 'Category added successfully' });
  } catch (err) {
    console.error('addCategory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', id)
      .input('name', name)
      .query(`UPDATE Categories SET Name=@name WHERE CategoryID=@id`);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('updateCategory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', id)
      .query(`DELETE FROM Categories WHERE CategoryID=@id`);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// === IMAGE UPLOADS ===

// Главное изображение (обложка)
const uploadMainImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const imageUrl = `/uploads/${req.file.filename}`;
    const pool = await poolPromise;

    const result = await pool.request()
      .input('productId', productId)
      .input('imageUrl', imageUrl)
      .query(`
        UPDATE Products
        SET MainImageURL = @imageUrl
        WHERE ProductID = @productId
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Main image uploaded successfully', imageUrl });
  } catch (err) {
    console.error('uploadMainImage error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// До 3 дополнительных фото
const uploadProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const pool = await poolPromise;

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: 'No images uploaded' });

    const imageUrls = [];

    for (const file of req.files) {
      const imageUrl = `/uploads/${file.filename}`;
      imageUrls.push(imageUrl);

      await pool.request()
        .input('productId', productId)
        .input('imageUrl', imageUrl)
        .query(`
          INSERT INTO ProductImages (ProductID, ImageURL)
          VALUES (@productId, @imageUrl)
        `);
    }

    res.json({ message: 'Images uploaded successfully', imageUrls });
  } catch (err) {
    console.error('uploadProductImages error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
const fs = require("fs");
const path = require("path");

const deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const { imageUrl } = req.body; // "/uploads/xxx.jpg"

    if (!imageUrl) return res.status(400).json({ message: "imageUrl is required" });

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("productId", productId)
      .input("imageUrl", imageUrl)
      .query(`
        DELETE FROM ProductImages
        WHERE ProductID = @productId AND ImageURL = @imageUrl
      `);

    if (!result.rowsAffected[0]) {
      return res.status(404).json({ message: "Image not found" });
    }

    // ✅ аккуратно удаляем файл (важно убрать ведущий /)
    const rel = imageUrl.replace(/^\/+/, ""); // "uploads/xxx.jpg"
    const filePath = path.join(__dirname, "..", rel);

    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.warn("⚠️ Could not delete file:", filePath, err.message);
      }
    });

    res.json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("deleteProductImage error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  uploadMainImage,
  uploadProductImages,
  deleteProductImage,
};
