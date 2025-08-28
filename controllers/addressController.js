const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// @desc    Add address to user addresses list
// @route   POST /addresses
// @access  Private/User
exports.addAddress = asyncHandler(async (req, res, next) => {
  const { alias, details, city, governorate, zipCode } = req.body;

  if (!alias || !details || !city || !governorate) {
    return next(new AppError("Please provide all required address fields", 400));
  }

  // Add address to user addresses array
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        addresses: {
          alias,
          details,
          city,
          governorate,
          zipCode,
        },
      },
    },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    message: "Address added successfully",
    data: {
      addresses: user.addresses,
    },
  });
});

// @desc    Remove address from user addresses list
// @route   DELETE /addresses/:addressId
// @access  Private/User
exports.removeAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  // Remove address from user addresses array
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        addresses: { _id: addressId },
      },
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Address removed successfully",
    data: {
      addresses: user.addresses,
    },
  });
});

// @desc    Get logged user addresses
// @route   GET /addresses
// @access  Private/User
exports.getMyAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    results: user.addresses.length,
    data: {
      addresses: user.addresses,
    },
  });
});

// @desc    Update specific address
// @route   PATCH /addresses/:addressId
// @access  Private/User
exports.updateMyAddresses = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const { alias, details, city, governorate, zipCode } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Find the address to update
  const addressIndex = user.addresses.findIndex(
    (address) => address._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(new AppError("Address not found", 404));
  }

  // Update the address fields
  if (alias) user.addresses[addressIndex].alias = alias;
  if (details) user.addresses[addressIndex].details = details;
  if (city) user.addresses[addressIndex].city = city;
  if (governorate) user.addresses[addressIndex].governorate = governorate;
  if (zipCode) user.addresses[addressIndex].zipCode = zipCode;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Address updated successfully",
    data: {
      addresses: user.addresses,
    },
  });
});