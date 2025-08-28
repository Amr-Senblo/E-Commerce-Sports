const SubCategory = require("../models/subCategoryModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const AppError = require("../utils/appError");

// 🛠 Helper to handle duplicate key errors (code 11000)
const handleDuplicateKeyError = (err, next) => {
  const field = Object.keys(err.keyPattern)[0];
  next(new AppError(`${field} must be unique`, 400));
};

// @desc    Create a new subcategory
// @route   POST /subcategory
// @route   POST /category/:id/subcategories
// @access  Private
exports.createSubCategory = asyncHandler(async (req, res, next) => {
  try {
    const { name, mainCategory } = req.body;
    
    // If creating subcategory under a specific category, use the category ID from params
    const categoryId = req.params.id || mainCategory;
    
    if (!name) {
      return next(new AppError("Subcategory name is required", 400));
    }

    if (!categoryId) {
      return next(new AppError("Main category is required", 400));
    }

    const slug = slugify(name, { lower: true });

    const newSubCategory = await SubCategory.create({ 
      name, 
      slug, 
      mainCategory: categoryId 
    });

    res.status(201).json({
      status: "success",
      data: { subCategory: newSubCategory },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Get all subcategories or subcategories by category
// @route   GET /subcategory
// @route   GET /category/:id/subcategories
// @access  Public
exports.getSubCategories = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // If accessing via /category/:id/subcategories, filter by category
  if (req.params.id) {
    filter.mainCategory = req.params.id;
  }

  const [subCategories, totalSubCategories] = await Promise.all([
    SubCategory.find(filter)
      .populate('mainCategory', 'name slug')
      .skip(skip)
      .limit(limit),
    SubCategory.countDocuments(filter),
  ]);

  if (subCategories.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No subcategories found",
    });
  }

  res.status(200).json({
    status: "success",
    results: subCategories.length,
    totalSubCategories,
    page,
    limit,
    data: { subCategories },
  });
});

// @desc    Get a single subcategory
// @route   GET /subcategory/:id
// @access  Public
exports.getSubCategory = asyncHandler(async (req, res, next) => {
  const subCategory = await SubCategory.findById(req.params.id)
    .populate('mainCategory', 'name slug');

  if (!subCategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { subCategory },
  });
});

// @desc    Update a subcategory
// @route   PATCH /subcategory/:id
// @access  Private
exports.updateSubCategory = asyncHandler(async (req, res, next) => {
  try {
    const { name, mainCategory } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true });
    }

    if (mainCategory) {
      updateData.mainCategory = mainCategory;
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('mainCategory', 'name slug');

    if (!updatedSubCategory) {
      return next(new AppError("Subcategory not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { subCategory: updatedSubCategory },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Delete a subcategory
// @route   DELETE /subcategory/:id
// @access  Private
exports.deletesubCategory = asyncHandler(async (req, res, next) => {
  const deletedSubCategory = await SubCategory.findByIdAndDelete(req.params.id);

  if (!deletedSubCategory) {
    return next(new AppError("Subcategory not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});