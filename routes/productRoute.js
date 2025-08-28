const express = require("express");

const {
  getAllProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validators/productValidator");

// const { protect, restrictTo } = require("../middlewares/authMiddleware");

// const reviewRoute = require("./reviewRoute");

const router = express.Router();

// router.use("/:id/reviews", reviewRoute);

router
  .route("/")
  .get(getAllProducts)
  .post(
    // protect, restrictTo("admin"), 
    createProductValidator, createProduct);
router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .patch(
    // protect, restrictTo("admin"), 
    updateProductValidator, updateProduct)
  .delete(
    // protect, restrictTo("admin"), 
    deleteProductValidator, deleteProduct);

module.exports = router;
