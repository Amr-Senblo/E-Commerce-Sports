const Category = require("../models/categoryModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const AppError = require("../utils/appError");

// 🛠 Helper to handle duplicate key errors (code 11000)
const handleDuplicateKeyError = (err, next) => {
  const field = Object.keys(err.keyPattern)[0];
  next(new AppError(`${field} must be unique`, 400));
};

// @desc    Create a new category
// @route   POST /category
// @access  Private
exports.createCategory = asyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return next(new AppError("Category name is required", 400));
    }

    const slug = slugify(name, { lower: true });

    const newCategory = await Category.create({ name, slug });

    res.status(201).json({
      status: "success",
      data: { category: newCategory },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Get all categories
// @route   GET /category
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [categories, totalCategories] = await Promise.all([
    Category.find().skip(skip).limit(limit),
    Category.countDocuments(),
  ]);

  if (categories.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No categories found",
    });
  }

  res.status(200).json({
    status: "success",
    results: categories.length,
    totalCategories,
    page,
    limit,
    data: { categories },
  });
});

// @desc    Get a single category
// @route   GET /category/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { category },
  });
});

// @desc    Update a category
// @route   PUT /category/:id
// @access  Private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  try {
    const { name } = req.body;
    const slug = name ? slugify(name, { lower: true }) : undefined;

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(slug && { slug }) },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { category: updatedCategory },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Delete a category
// @route   DELETE /category/:id
// @access  Private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const deletedCategory = await Category.findByIdAndDelete(req.params.id);

  if (!deletedCategory) {
    return next(new AppError("Category not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
