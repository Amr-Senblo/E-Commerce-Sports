const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [32, "Category name cannot exceed 32 characters"],
      unique: [true, "Category name must be unique"],
    },
    slug: {
      type: String,
      unique: [true, "category slug must be unique"],
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true }
);

const categoryModel = mongoose.model("Category", categorySchema);

module.exports = categoryModel;
