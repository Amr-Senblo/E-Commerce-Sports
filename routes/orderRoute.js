const express = require("express");

const { createCashOrder } = require("../controllers/orderController");

const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(protect, restrictTo("user"));

router.post("/:cartId", createCashOrder);

module.exports = router;
