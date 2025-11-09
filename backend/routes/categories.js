const express = require("express");
const router = express.Router();
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController.js");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

// Получить все категории
router.get("/", getCategories);

// Добавить категорию (только админ)
router.post("/", authMiddleware, adminMiddleware, addCategory);

// Обновить категорию (только админ)
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);

// Удалить категорию (только админ)
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

module.exports = router;
