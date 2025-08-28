const express = require("express");

const {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/validators/categoryValidator");

// const { protect, restrictTo } = require("../middlewares/authMiddleware");

const subCategoriesRoute = require("./subCategoryRoute");

const router = express.Router();

// id ==> categoryId
router.use("/:id/subCategories", subCategoriesRoute);

router
  .route("/")
  .get(getCategories)
  .post(
    // protect, restrictTo("admin"),
    createCategoryValidator,
    createCategory
  );
router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .patch(
    // protect, restrictTo("admin"),
    updateCategoryValidator,
    updateCategory
  )
  .delete(
    // protect,
    // restrictTo("admin"),
    deleteCategoryValidator,
    deleteCategory
  );

module.exports = router;
