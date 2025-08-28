const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.createAddressValidator = [
  check("alias")
    .notEmpty()
    .withMessage("Alias required")
    .custom((value, { req }) => {
      const foundAlias = req.user.addresses.find(
        (address) => address.alias === value
      );
      if (foundAlias) {
        return Promise.reject(new Error("Alias already in use"));
      }
      return true;
    }),
  check("details").notEmpty().withMessage("Address Details required"),
  check("city").notEmpty().withMessage("City required"),
  check("governorate").notEmpty().withMessage("Governorate required"),
  check("zipCode").optional(),

  validatorMiddleware,
];

exports.updateAddressValidator = [
  check("alias")
    .optional()

    .custom((value, { req }) => {
      const foundAlias = req.user.addresses.find(
        (address) => address.alias === value
      );
      if (foundAlias) {
        return Promise.reject(new Error("Alias already in use"));
      }
      return true;
    }),
  check("details").optional(),
  check("city").optional(),
  check("governorate").optional(),
  check("zipCode").optional(),

  validatorMiddleware,
];

exports.deleteAddressValidator = [
  check("addressId").isUUID().withMessage("Invalid Address id"),
  validatorMiddleware,
];
