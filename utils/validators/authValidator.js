const { check } = require("express-validator");
const slugify = require("slugify");
const libPhoneNumber = require("libphonenumber-js");

const User = require("../../models/userModel");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.signupValidator = [
  check("name")
    .notEmpty()
    .withMessage("User required")
    .isLength({ min: 3 })
    .withMessage("Too short User name")
    .isLength({ max: 32 })
    .withMessage("Too long User name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      console.log(req.body.slug);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email")
    .custom(async (email) => {
      await User.findOne({ email }).then((user) => {
        if (user) {
          return Promise.reject(new Error("E-mail already in use"));
        }
        return true;
      });
    }),

  check("phone")
    .notEmpty()
    .withMessage("Phone required")
    .custom((value) => {
      value = `+2${value}`;
      const parsedNumber = libPhoneNumber.parsePhoneNumberFromString(
        value,
        "EG"
      );
      if (!parsedNumber && !parsedNumber.isValid()) {
        console.log("Validation failed for", value);
        return Promise.reject(new Error("Invalid phone number"));
      }
      return true;
    }),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Too short password")
    .isLength({ max: 32 })
    .withMessage("Too long password")
    .custom((value, { req }) => {
      if (value !== req.body.passwordConfirm) {
        throw new Error("Password confirmation is incorrect");
      }
      return true;
    }),

  validatorMiddleware,
];
exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Invalid email"),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Too short password")
    .isLength({ max: 32 })
    .withMessage("Too long password"),

  validatorMiddleware,
];
