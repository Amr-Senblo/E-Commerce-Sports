const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// Calculate total cart price
const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.products.forEach((item) => {
    totalPrice += item.quantity * item.product.price;
  });
  cart.total = totalPrice;
  cart.totalAfterDiscount = undefined;
  return totalPrice;
};

// @desc    Add product to cart
// @route   POST /cart
// @access  Private/User
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Check if product quantity is available
  if (quantity > product.quantity) {
    return next(new AppError(`Only ${product.quantity} items available in stock`, 400));
  }

  // Get cart for logged user
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // Create cart for logged user with product
    cart = await Cart.create({
      user: req.user._id,
      products: [{ product: productId, quantity }],
    });
  } else {
    // Product exist in cart, update product quantity
    const productIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex > -1) {
      const newQuantity = cart.products[productIndex].quantity + quantity;
      
      // Check if new quantity exceeds available stock
      if (newQuantity > product.quantity) {
        return next(new AppError(`Only ${product.quantity} items available in stock`, 400));
      }
      
      cart.products[productIndex].quantity = newQuantity;
    } else {
      // Product not exist in cart, push product to products array
      cart.products.push({ product: productId, quantity });
    }
  }

  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();

  // Populate cart before sending response
  await cart.populate('products.product', 'title price imageCover');

  res.status(200).json({
    status: "success",
    message: "Product added to cart successfully",
    numOfCartItems: cart.products.length,
    data: { cart },
  });
});

// @desc    Get logged user cart
// @route   GET /cart
// @access  Private/User
exports.getMyCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'products.product',
    'title price imageCover'
  );

  if (!cart) {
    return next(new AppError("Cart not found for this user", 404));
  }

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.products.length,
    data: { cart },
  });
});

// @desc    Update specific cart item quantity
// @route   PATCH /cart/:productId
// @access  Private/User
exports.updateProductQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  if (!quantity || quantity <= 0) {
    return next(new AppError("Quantity must be greater than 0", 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(new AppError("Cart not found for this user", 404));
  }

  const itemIndex = cart.products.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    // Check if product exists and has enough quantity
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (quantity > product.quantity) {
      return next(new AppError(`Only ${product.quantity} items available in stock`, 400));
    }

    cart.products[itemIndex].quantity = quantity;
    calcTotalCartPrice(cart);
  } else {
    return next(new AppError("Product not found in cart", 404));
  }

  await cart.save();
  await cart.populate('products.product', 'title price imageCover');

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.products.length,
    data: { cart },
  });
});

// @desc    Remove specific cart item
// @route   DELETE /cart/:productId
// @access  Private/User
exports.deleteProductFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { products: { product: productId } },
    },
    { new: true }
  );

  if (!cart) {
    return next(new AppError("Cart not found for this user", 404));
  }

  calcTotalCartPrice(cart);
  await cart.save();
  await cart.populate('products.product', 'title price imageCover');

  res.status(200).json({
    status: "success",
    message: "Product removed from cart successfully",
    numOfCartItems: cart.products.length,
    data: { cart },
  });
});

// @desc    Apply coupon on logged user cart
// @route   POST /cart/coupon
// @access  Private/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return next(new AppError("Coupon code is required", 400));
  }

  // 1) Get coupon based on coupon code
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    expiry: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new AppError("Coupon is invalid or expired", 404));
  }

  // 2) Get logged user cart to get total cart price
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(new AppError("Cart not found for this user", 404));
  }

  const totalPrice = cart.total;

  // 3) Calculate price after priceAfterDiscount
  const totalAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2);

  cart.totalAfterDiscount = totalAfterDiscount;
  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Coupon applied successfully",
    numOfCartItems: cart.products.length,
    data: { cart },
  });
});