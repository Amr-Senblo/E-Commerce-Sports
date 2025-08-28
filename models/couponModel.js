const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const couponSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    discount: {
      // discount in percentage
      type: Number,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
