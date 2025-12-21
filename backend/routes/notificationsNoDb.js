const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { poll } = require("../controllers/notificationsNoDbController");

router.get("/poll", authMiddleware, poll);

module.exports = router;
