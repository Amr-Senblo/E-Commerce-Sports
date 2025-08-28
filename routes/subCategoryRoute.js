const express = require("express");

const {
  createSubCategory,
  getSubCategory,
  getSubCategories,
  updateSubCategory,
  deletesubCategory,
} = require("../controllers/subCategoryController");

const {
  createSubCategoryValidator,
  getSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subCategoryValidator");

// const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router({ mergeParams: true }); // mergeParams: true => to get access to the params of the parent router

router
  .route("/")
  .get(getSubCategories)
  .post(
    // protect,
    // restrictTo("admin"),
    createSubCategoryValidator,
    createSubCategory
  );

router
  .route("/:id")
  .get(getSubCategoryValidator, getSubCategory)
  .patch(
    // protect,
    // restrictTo("admin"),
    updateSubCategoryValidator,
    updateSubCategory
  )
  .delete(
    // protect,
    // restrictTo("admin"),
    deleteSubCategoryValidator,
    deletesubCategory
  );

router
  .route("/:id/subCategories") //id ==> categoryId
  .get(getSubCategories)
  .post(
    // protect, restrictTo("admin"),
     createSubCategory);

module.exports = router;
