const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const subCategorySchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    name: {
      type: String,
      required: [true, "sub category is required"],
      unique: [true, "Sub Category name must be unique"],
      maxlength: [32, "sub Category name can't exceed 32 characters"],
      trim: true,
    },
    slug: {
      type: String,
      index: true,
      lowercase: true,
      unique: [true, "sub category slug must be unique"],
    },
    mainCategory: {
      type: String,
      ref: "Category",
      required: [true, "Main category is required"],
    },
    // specifications:[width,height ,length,weight,material,brand,origin],
  },
  { timestamps: true }
);
const subCategoryModel = mongoose.model("subCategory", subCategorySchema);

module.exports = subCategoryModel;
