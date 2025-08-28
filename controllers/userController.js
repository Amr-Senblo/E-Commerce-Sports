const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");

// Helper to handle duplicate key errors (code 11000)
const handleDuplicateKeyError = (err, next) => {
  const field = Object.keys(err.keyPattern)[0];
  next(new AppError(`${field} must be unique`, 400));
};

// @desc    Get all users
// @route   GET /users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    User.find().select("-password").skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  if (users.length === 0) {
    return res.status(404).json({
      status: "fail",
      message: "No users found",
    });
  }

  res.status(200).json({
    status: "success",
    results: users.length,
    totalUsers,
    page,
    limit,
    data: { users },
  });
});

// @desc    Create a new user
// @route   POST /users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return next(new AppError("Please provide all required fields", 400));
    }

    const slug = slugify(name, { lower: true });

    const newUser = await User.create({
      name,
      slug,
      email,
      phone,
      password,
      role: role || "user",
    });

    // Remove password from response
    newUser.password = undefined;

    res.status(201).json({
      status: "success",
      data: { user: newUser },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Get a single user
// @route   GET /users/:id
// @access  Private/Admin or own profile
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// @desc    Update a user
// @route   PATCH /users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, phone, role, active } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true });
    }
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Delete a user
// @route   DELETE /users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const deletedUser = await User.findByIdAndDelete(req.params.id);

  if (!deletedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// @desc    Change user status (active/inactive)
// @route   PATCH /users/change-status/:id
// @access  Private/Admin
exports.changeStatus = asyncHandler(async (req, res, next) => {
  const { active } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// @desc    Update user password by admin
// @route   PATCH /users/update-password/:id
// @access  Private/Admin
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.password = password;
  user.passwordChangedAt = Date.now();
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

// @desc    Get current user data (me)
// @route   GET /users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc    Update current user password
// @route   PATCH /users/update-my-password
// @access  Private
exports.updateMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Please provide current and new password", 400));
  }

  const user = await User.findById(req.user._id);

  // Check if current password is correct
  const isCurrentPasswordCorrect = await user.matchPassword(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordCorrect) {
    return next(new AppError("Current password is incorrect", 400));
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

// @desc    Update current user info
// @route   PATCH /users/update-my-info
// @access  Private
exports.updateMyInfo = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, phone, profilePicture } = req.body;
    const updateData = {};

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true });
    }
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Deactivate current user account
// @route   PATCH /users/delete-my-account
// @access  Private
exports.deleteMyAccount = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(200).json({
    status: "success",
    message: "Account deactivated successfully",
  });
});

// @desc    Activate current user account
// @route   PATCH /users/active-my-account
// @access  Private
exports.activeMyAccount = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: true });

  res.status(200).json({
    status: "success",
    message: "Account activated successfully",
  });
});