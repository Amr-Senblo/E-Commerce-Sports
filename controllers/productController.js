const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const AppError = require("../utils/appError");

// Helper to handle duplicate key errors (code 11000)
const handleDuplicateKeyError = (err, next) => {
  const field = Object.keys(err.keyPattern)[0];
  next(new AppError(`${field} must be unique`, 400));
};

// @desc    Get all products
// @route   GET /products
// @access  Public
exports.getAllProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // Filter by category if provided
  if (req.query.category) {
    filter.mainCategory = req.query.category;
  }
  
  // Filter by subcategories if provided
  if (req.query.subCategory) {
    filter.subCategories = { $in: [req.query.subCategory] };
  }

  // Price range filter
  if (req.query.price) {
    const priceFilter = {};
    if (req.query.price.gte) priceFilter.$gte = Number(req.query.price.gte);
    if (req.query.price.lte) priceFilter.$lte = Number(req.query.price.lte);
    filter.price = priceFilter;
  }

  // Build sort object
  let sort = {};
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    sort = sortBy;
  } else {
    sort = '-createdAt'; // Default sort by newest
  }

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  if (products.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No products found",
    });
  }

  res.status(200).json({
    status: "success",
    results: products.length,
    totalProducts,
    page,
    limit,
    data: { products },
  });
});

// @desc    Create a new product
// @route   POST /products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res, next) => {
  try {
    const {
      title,
      description,
      quantity,
      price,
      priceAfterDiscount,
      imageCover,
      images,
      mainCategory,
      subCategories,
    } = req.body;

    if (!title) {
      return next(new AppError("Product title is required", 400));
    }

    const slug = slugify(title, { lower: true });

    const newProduct = await Product.create({
      title,
      slug,
      description,
      quantity,
      price,
      priceAfterDiscount,
      imageCover,
      images,
      mainCategory,
      subCategories,
    });

    res.status(201).json({
      status: "success",
      data: { product: newProduct },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Get a single product
// @route   GET /products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

// @desc    Update a product
// @route   PATCH /products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res, next) => {
  try {
    const {
      title,
      description,
      quantity,
      price,
      priceAfterDiscount,
      imageCover,
      images,
      mainCategory,
      subCategories,
    } = req.body;

    const allowed = ["title","description","quantity","price","priceAfterDiscount","imageCover","images","mainCategory","subCategories"];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    // Update slug if title is being updated
    if (title) {
      updateData.slug = slugify(title, { lower: true });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return next(new AppError("Product not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { product: updatedProduct },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Delete a product
// @route   DELETE /products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);

  if (!deletedProduct) {
    return next(new AppError("Product not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});