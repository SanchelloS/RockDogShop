const router = require("express").Router();
const { downloadReport, previewReport } = require("../controllers/reportsController");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

// Убедитесь, что передаете функции в маршруты, а не вызываете их.
router.get("/:type/preview", authMiddleware, adminMiddleware, previewReport);
router.get("/:type", authMiddleware, adminMiddleware, downloadReport);

module.exports = router;
