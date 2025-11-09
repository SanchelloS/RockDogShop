const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");

// ✅ перемести лог до объявления второго раза
console.log("🧠 checkout route loaded");
const { createOrder } = require("../controllers/checkoutController");
console.log("✅ typeof createOrder:", typeof createOrder);

router.post("/", authMiddleware, createOrder);

module.exports = router;
