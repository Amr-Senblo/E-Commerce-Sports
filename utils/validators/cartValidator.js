const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.addProductToCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id required")
    .isUUID()
    .withMessage("Invalid Product id"),
  check("quantity")
    .notEmpty()
    .withMessage("Quantity required")
    .isNumeric()
    .withMessage("Quantity must be a number"),

  validatorMiddleware,
];

exports.updateProductInCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id required")
    .isUUID()
    .withMessage("Invalid Product id"),
  check("quantity")
    .notEmpty()
    .withMessage("Quantity required")
    .isNumeric()
    .withMessage("Quantity must be a number"),

  validatorMiddleware,
];

exports.deleteProductFromCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id required")
    .isUUID()
    .withMessage("Invalid Product id"),

  validatorMiddleware,
];

exports.applyCouponValidator = [
  check("code")
    .notEmpty()
    .withMessage("Coupon code required")
    .isString()
    .withMessage("Coupon code must be a string"),
  validatorMiddleware,
];
