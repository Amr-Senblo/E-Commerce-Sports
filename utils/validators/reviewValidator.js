const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Review = require("../../models/reviewModel");

exports.createReviewValidator = [
  check("review").optional().isString().withMessage("Review must be a string"),

  check("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be a number between 1 and 5"),

  check("product")
    .optional()
    .isUUID()
    .withMessage("Product must be a valid UUID format")
    .custom(async (value, { req }) => {
      const review = await Review.findOne({
        $and: [{ product: value }, { user: req.user.id }],
      });
      if (review) {
        throw new Error("You already reviewed this product before");
      }
      return true;
    }),

  check("user")
    .optional()
    .isUUID()
    .withMessage("User must be a valid UUID format")
    .custom((value, { req }) => {
      if (value !== req.user.id) {
        throw new Error("User id is not valid");
      }
      console.log("user id is valid");
      return true;
    }),
  validatorMiddleware,
];

exports.getReviewValidator = [
  check("id").isUUID().withMessage("Id must be a valid UUID format"),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("id")
    .isUUID()
    .withMessage("Id must be a valid UUID format")
    .custom(async (value, { req }) => {
      const review = await Review.findOne({
        $and: [{ _id: value }, { user: req.user.id }],
      });

      if (!review) {
        throw new Error("Review not found");
      }
      return true;
    }),

  check("review").optional().isString().withMessage("Review must be a string"),

  check("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be a number between 1 and 5"),

  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id")
    .isUUID()
    .withMessage("Id must be a valid UUID format")
    .custom(async (value, { req }) => {
      const review = await Review.findOne({
        $and: [
          { _id: value },
          { $or: [{ user: req.user.id }, { role: "admin" }] },
        ],
      });

      if (!review) {
        throw new Error("Review not found");
      }
      return true;
    }),

  validatorMiddleware,
];
