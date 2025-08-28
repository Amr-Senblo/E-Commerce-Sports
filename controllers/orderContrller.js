const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");

// @desc    Create cash order
// @route   POST /orders/:cartId
// @access  Private/User
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // Tax and shipping prices
  const taxPrice = 0;
  const shippingPrice = 0;

  // 1) Get cart by cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(new AppError(`Cart not found with id ${req.params.cartId}`, 404));
  }

  // 2) Verify cart belongs to logged user
  if (cart.user !== req.user._id) {
    return next(new AppError("This cart does not belong to you", 403));
  }

  // 3) Get user's default address
  const user = await User.findById(req.user._id);
  if (!user.addresses || user.addresses.length === 0) {
    return next(new AppError("You must add an address first", 400));
  }

  // Use first address as default (you can modify this logic)
  const defaultAddress = user.addresses[0];

  // 4) Get order price based on cart total "Check if coupon apply"
  const cartPrice = cart.totalAfterDiscount ? cart.totalAfterDiscount : cart.total;
  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  // 5) Create order with default payment method (cash)
  const order = await Order.create({
    user: req.user._id,
    cart: cart._id,
    shippingAddress: defaultAddress._id,
    totalPrice: totalOrderPrice,
    taxPrice,
    shippingPrice,
    paymentMethod: "cash",
  });

  // 6) After creating order, mark cart as ordered and decrement product quantity
  if (order) {
    // Mark cart as ordered
    await Cart.findByIdAndUpdate(cart._id, { ordered: true });

    // Decrement product quantity and increment sold
    const bulkOption = cart.products.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await require("../models/productModel").bulkWrite(bulkOption, {});
  }

  res.status(201).json({
    status: "success",
    data: { order },
  });
});