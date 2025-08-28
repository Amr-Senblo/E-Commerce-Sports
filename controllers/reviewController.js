const Review = require("../models/reviewModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// @desc    Set product and user IDs
// @route   Middleware
// @access  Private
exports.setProductUserIds = asyncHandler(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.product) req.body.product = req.params.id;
  if (!req.body.user) req.body.user = req.user._id;
  next();
});

// @desc    Get all reviews
// @route   GET /reviews
// @route   GET /products/:id/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // If accessing via /products/:id/reviews, filter by product
  if (req.params.id) {
    filter.product = req.params.id;
  }

  const [reviews, totalReviews] = await Promise.all([
    Review.find(filter).skip(skip).limit(limit),
    Review.countDocuments(filter),
  ]);

  if (reviews.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No reviews found",
    });
  }

  res.status(200).json({
    status: "success",
    results: reviews.length,
    totalReviews,
    page,
    limit,
    data: { reviews },
  });
});

// @desc    Get a single review
// @route   GET /reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

// @desc    Create a new review
// @route   POST /reviews
// @route   POST /products/:id/reviews
// @access  Private/User
exports.createReview = asyncHandler(async (req, res, next) => {
  try {
    const { rating, review, product, user } = req.body;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: user,
      product: product,
    });

    if (existingReview) {
      return next(new AppError("You already reviewed this product", 400));
    }

    const newReview = await Review.create({
      rating,
      review,
      product,
      user,
    });

    res.status(201).json({
      status: "success",
      data: { review: newReview },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
});

// @desc    Update a review
// @route   PATCH /reviews/:id
// @access  Private/User (own reviews only)
exports.updateReview = asyncHandler(async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(new AppError("Review not found", 404));
    }

    // Check if the review belongs to the logged user
    if (review.user._id.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only update your own reviews", 403));
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: { review: updatedReview },
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
});

// @desc    Delete a review
// @route   DELETE /reviews/:id
// @access  Private/User (own reviews) or Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  // Check if the review belongs to the logged user or user is admin
  if (
    review.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(
      new AppError("You can only delete your own reviews or be an admin", 403)
    );
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});