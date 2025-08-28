const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Product = require("./productModel");

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },

    rating: {
      type: Number,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      required: [true, "A review must have a rating"],
    },
    review: {
      type: String,
      required: [true, "A review must have a description"],
    },
    user: {
      type: String,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },
    product: {
      type: String,
      ref: "Product",
      required: [true, "A review must belong to a product"],
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profilePicture ",
  });
  next();
});

// statics is a method that is available on the model  (Review) and not on the document (review)
reviewSchema.statics.calcRatingAvarageAndQuantity = async function (productId) {
  const result = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: "$product",
        ratingsQuantity: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  // console.log(result);

  if (result.length)
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: result[0].ratingsQuantity,
      ratingsAverage: result[0].avgRating.toFixed(2),
    });
};

reviewSchema.post("save", async function () {
  await this.constructor.calcRatingAvarageAndQuantity(this.product);
});

reviewSchema.post("remove", async function () {
  await this.constructor.calcRatingAvarageAndQuantity(this.product);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
