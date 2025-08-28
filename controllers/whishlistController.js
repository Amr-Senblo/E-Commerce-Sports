const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// @desc    Add product to wishlist
// @route   POST /wishlist
// @access  Private/User
exports.addProductToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  // Add productId to user wishlist array if not already exists
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { wishlist: productId }, // $addToSet prevents duplicates
    },
    { new: true }
  ).populate('wishlist', 'title price imageCover');

  res.status(200).json({
    status: "success",
    message: "Product added to wishlist successfully",
    data: {
      wishlist: user.wishlist,
    },
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /wishlist/:productId
// @access  Private/User
exports.removeProductFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  // Remove productId from user wishlist array
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { wishlist: productId }, // $pull removes the item
    },
    { new: true }
  ).populate('wishlist', 'title price imageCover');

  res.status(200).json({
    status: "success",
    message: "Product removed from wishlist successfully",
    data: {
      wishlist: user.wishlist,
    },
  });
});

// @desc    Get logged user wishlist
// @route   GET /wishlist
// @access  Private/User
exports.getMyWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'title price imageCover slug ratingsAverage ratingsQuantity');

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    results: user.wishlist.length,
    data: {
      wishlist: user.wishlist,
    },
  });
});