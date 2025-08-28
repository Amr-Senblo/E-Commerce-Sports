const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User is required"],
    },
    cart: {
      type: String,
      ref: "Cart",
      required: [true, "Cart is required"],
    },
    shippingAddress: {
      type: String,
      ref: "Address",
      required: [true, "Shipping address is required"],
    },
    taxPrice: {
      type: Number,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      default: 0.0,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["cash", "card"],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },

    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
