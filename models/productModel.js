const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: {
      type: String,
      required: [true, "Please enter product title"],
      trim: true,
      minLength: [3, "Product title must be at least 3 characters"],
      maxLength: [100, "Product title cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Please enter product description"],
      trim: true,
      minLength: [5, "Product description must be at least 5 characters"],
      maxLength: [500, "Product description cannot exceed 500 characters"],
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
    },
    priceAfterDiscount: {
      type: Number,
    },
    imageCover: {
      type: String,
      required: [true, "Product image is required"],
    },
    images: [String],
    mainCategory: {
      type: String,
      ref: "Category",
      required: [true, "Main category is required"],
    },
    subCategories: [
      {
        type: String,
        ref: "subCategory",
      },
    ],
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, "Rating must be at least 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: "mainCategory",
    select: "name ",
  }).populate({
    path: "subCategories",
    select: "name ",
  });
  next();
});

productSchema.pre("findOne", function (next) {
  this.populate({
    path: "reviews",
    select: "review rating user",
  });
  next();
});

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
