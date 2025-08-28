const Coupon = require("../models/couponModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// Helper to handle duplicate key errors (code 11000)
const handleDuplicateKeyError = (err, next) => {
  const field = Object.keys(err.keyPattern)[0];
  next(new AppError(`${field} must be unique`, 400));
};

// @desc    Create a new coupon
// @route   POST /coupons
// @access  Private/Admin
exports.createCoupon = asyncHandler(async (req, res, next) => {
  try {
    const { code, discount, expiry } = req.body;

    if (!code || !discount || !expiry) {
      return next(new AppError("Please provide code, discount, and expiry date", 400));
    }

    // Validate discount percentage
    if (discount <= 0 || discount > 100) {
      return next(new AppError("Discount must be between 1 and 100", 400));
    }

    // Validate expiry date
    if (new Date(expiry) <= new Date()) {
      return next(new AppError("Expiry date must be in the future", 400));
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      discount,
      expiry,
    });

    res.status(201).json({
      status: "success",
      data: { coupon: newCoupon },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Get all coupons
// @route   GET /coupons
// @access  Private/Admin
exports.getAllCoupons = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [coupons, totalCoupons] = await Promise.all([
    Coupon.find().skip(skip).limit(limit),
    Coupon.countDocuments(),
  ]);

  if (coupons.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No coupons found",
    });
  }

  res.status(200).json({
    status: "success",
    results: coupons.length,
    totalCoupons,
    page,
    limit,
    data: { coupons },
  });
});

// @desc    Get a single coupon
// @route   GET /coupons/:id
// @access  Private/Admin
exports.getCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return next(new AppError("Coupon not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { coupon },
  });
});

// @desc    Update a coupon
// @route   PATCH /coupons/:id
// @access  Private/Admin
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  try {
    const { code, discount, expiry } = req.body;
    const updateData = {};

    if (code) updateData.code = code.toUpperCase();
    if (discount) {
      if (discount <= 0 || discount > 100) {
        return next(new AppError("Discount must be between 1 and 100", 400));
      }
      updateData.discount = discount;
    }
    if (expiry) {
      if (new Date(expiry) <= new Date()) {
        return next(new AppError("Expiry date must be in the future", 400));
      }
      updateData.expiry = expiry;
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return next(new AppError("Coupon not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { coupon: updatedCoupon },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Delete a coupon
// @route   DELETE /coupons/:id
// @access  Private/Admin
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);

  if (!deletedCoupon) {
    return next(new AppError("Coupon not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});