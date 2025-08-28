const { check, body } = require("express-validator");
const slugify = require("slugify");
const libPhoneNumber = require("libphonenumber-js");

const User = require("../../models/userModel");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.createUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("User required")
    .isLength({ min: 3 })
    .withMessage("Too short User name")
    .isLength({ max: 32 })
    .withMessage("Too long User name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
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

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation required"),

  check("role")
    .default("user")
    .isIn(["user", "technician", "admin"])
    .withMessage("Invalid role"),

  validatorMiddleware,
];

exports.getUserValidator = [
  check("id").isUUID().withMessage("Invalid User id"),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check("id").isUUID().withMessage("Invalid User id format"),
  body("name")
    .optional()
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("phone")
    .optional()
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
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check("id").isUUID().withMessage("Invalid User id format"),
  validatorMiddleware,
];

exports.updatePasswordValidator = [
  check("oldPassword").notEmpty().withMessage("Old password required"),
  check("newPassword")
    .notEmpty()
    .withMessage("New password required")
    .isLength({ min: 6 })
    .withMessage("Too short password")
    .isLength({ max: 32 })
    .withMessage("Too long password")
    .custom((value, { req }) => {
      if (value !== req.body.newPasswordConfirm) {
        throw new Error("Password confirmation is incorrect");
      }
      return true;
    }),
  validatorMiddleware,
];

exports.updateMyInfoValidator = [
  body("name")
    .optional()
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  body("email").optional().isEmail().withMessage("Invalid email"),
  body("phone")
    .optional()
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
  validatorMiddleware,
];
