const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const AppError = require("../utils/appError");

// Helper function to create JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });
};

// Helper function to create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// Helper to handle duplicate key errors (code 11000)
const handleDuplicateKeyError = (err, next) => {
  const field = Object.keys(err.keyPattern)[0];
  next(new AppError(`${field} already exists`, 400));
};

// @desc    Register user
// @route   POST /auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

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
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    if (err.code === 11000) return handleDuplicateKeyError(err, next);
    next(new AppError(err.message, 400));
  }
});

// @desc    Login user
// @route   POST /auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) Check if user is active
  if (!user.active) {
    return next(new AppError("Your account has been deactivated", 401));
  }

  // 4) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// @desc    Forgot password
// @route   POST /auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("No user found with that email address", 404));
  }

  // 2) Generate the random 6 digits reset code
  const resetCode = user.createPasswordResetCode();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email (you'll need to implement email service)
  const message = `Hi ${user.name},\n\nYour password reset code is: ${resetCode}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.`;

  try {
    // TODO: Send email with reset code
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset code (valid for 10 min)',
    //   message,
    // });

    res.status(200).json({
      status: "success",
      message: "Reset code sent to email",
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("There was an error sending the email. Try again later", 500));
  }
});

// @desc    Verify password reset code
// @route   POST /auth/verify-password-reset-code
// @access  Public
exports.verifyPasswordResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetCodeExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Reset code is invalid or expired", 400));
  }

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Reset code verified successfully",
  });
});

// @desc    Reset password
// @route   PATCH /auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email and check if reset code is verified
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("No user found with that email", 404));
  }

  // 2) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new AppError("Reset code not verified", 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetCodeExpires = undefined;
  user.passwordResetVerified = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  // 3) Generate token
  createSendToken(user, 200, res);
});