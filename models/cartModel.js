const mongoose = require("mongoose");

const { v4: uuidv4 } = require("uuid");

const cartSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    user: {
      type: String,
      ref: "User",
      required: [true, "Cart must belong to a user"],
    },
    products: [
      {
        _id: false, // Prevent the automatic generation of _id for subdocuments
        product: {
          type: String,
          ref: "Product",
          required: [true, "Cart must belong to a product"],
        },
        quantity: {
          type: Number,
          required: [true, "Cart must have quantity"],
          default: 1,
        },
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    totalAfterDiscount: {
      type: Number,
      default: 0,
    },
    ordered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
